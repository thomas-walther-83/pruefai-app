import crypto from 'crypto';

const LICENSE_KEY_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

async function findCustomerByLicense(stripeKey, licenseKey) {
  const query = encodeURIComponent(`metadata['license_key']:'${licenseKey}'`);
  const res = await fetch(
    `https://api.stripe.com/v1/customers/search?query=${query}&limit=1`,
    { headers: { Authorization: `Bearer ${stripeKey}` } },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Stripe search error');
  return data.data && data.data.length > 0 ? data.data[0] : null;
}

async function updateCustomerMetadata(stripeKey, customerId, metadata) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(metadata)) {
    params.append(`metadata[${k}]`, v);
  }
  const res = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Stripe update error');
  return data;
}

/**
 * Admin-only endpoint: mark a license key as revoked.
 * Subsequent calls to /api/claude with this key are rejected with 402
 * `license_revoked`. The Stripe subscription is NOT cancelled — the customer
 * can re-enable themselves by sending a new key request (manual support flow).
 *
 * Usage:
 *   curl -X POST https://pruefai.ch/api/admin-revoke \
 *     -H "Content-Type: application/json" \
 *     -H "X-Admin-Token: $ADMIN_TOKEN" \
 *     -d '{"license_key":"<UUID>","reason":"leaked-on-github"}'
 *
 * To UN-revoke a key, send the same request with body `{license_key, action: "restore"}`.
 */
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return res.status(503).json({
      error: 'Admin endpoint not configured (ADMIN_TOKEN missing).',
    });
  }

  const presented = req.headers['x-admin-token'] || '';
  if (!constantTimeEqual(presented, adminToken)) {
    // Generic message; do not reveal whether token format was valid
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return res.status(500).json({ error: 'STRIPE_SECRET_KEY not configured.' });
  }

  const licenseKey = typeof req.body?.license_key === 'string' ? req.body.license_key.trim() : '';
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.slice(0, 200) : '';
  const action = req.body?.action === 'restore' ? 'restore' : 'revoke';

  if (!LICENSE_KEY_RE.test(licenseKey)) {
    return res.status(400).json({ error: 'license_key fehlt oder hat ungültiges Format.' });
  }

  let customer;
  try {
    customer = await findCustomerByLicense(stripeKey, licenseKey);
  } catch (err) {
    console.error('admin-revoke: stripe lookup failed:', err.message);
    return res.status(502).json({ error: 'Stripe lookup failed.' });
  }

  if (!customer) {
    return res.status(404).json({ error: 'Kein Customer für diesen License-Key gefunden.' });
  }

  const now = new Date().toISOString();
  let update;
  if (action === 'restore') {
    update = {
      revoked: '',
      revoked_reason: '',
      revoked_at: '',
      restored_at: now,
    };
  } else {
    update = {
      revoked: 'true',
      revoked_reason: reason || 'admin-revoked',
      revoked_at: now,
    };
  }

  try {
    await updateCustomerMetadata(stripeKey, customer.id, update);
  } catch (err) {
    console.error('admin-revoke: stripe update failed:', err.message);
    return res.status(502).json({ error: 'Stripe update failed.' });
  }

  console.log(
    `admin-revoke: action=${action} customer=${customer.id} license=${licenseKey.slice(0, 8)}…` +
      (reason ? ` reason="${reason}"` : ''),
  );

  return res.status(200).json({
    ok: true,
    action,
    customer_id: customer.id,
    revoked: action === 'revoke',
    revoked_at: action === 'revoke' ? now : null,
  });
}
