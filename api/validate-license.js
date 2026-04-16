const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
const PLAN_LIMITS = { starter: 50, pro: 300, schule: 99999 };
const LICENSE_KEY_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SCHUL_CODE_RE = /^SCHULE-[0-9A-F]{12}$/;

async function findCustomerByMeta(stripeKey, metaKey, metaValue) {
  if (metaKey !== 'license_key' && metaKey !== 'schul_code') {
    throw new Error('Invalid metadata key');
  }
  if (typeof metaValue !== 'string' || metaValue.includes("'")) {
    return null;
  }
  const query = encodeURIComponent(`metadata['${metaKey}']:'${metaValue}'`);
  const res = await fetch(`https://api.stripe.com/v1/customers/search?query=${query}&limit=1`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  });
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

export default async function handler(req, res) {
  const origin = req.headers.origin || '';

  if (origin && ALLOWED_ORIGINS.length > 0 && !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: 'Origin not allowed.' });
  }
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  res.setHeader('Cache-Control', 'no-store');

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return res.status(500).json({ error: 'STRIPE_SECRET_KEY not configured.' });
  }

  const rawLicenseKey = typeof req.body?.license_key === 'string' ? req.body.license_key.trim() : '';
  const rawSchulCode = typeof req.body?.schul_code === 'string' ? req.body.schul_code.trim().toUpperCase() : '';
  const action = req.body?.action;
  if (!rawLicenseKey && !rawSchulCode) {
    return res.status(400).json({ error: 'Missing license_key or schul_code.' });
  }
  if (rawLicenseKey && rawSchulCode) {
    return res.status(400).json({ error: 'Provide either license_key or schul_code, not both.' });
  }
  if (rawLicenseKey && !LICENSE_KEY_RE.test(rawLicenseKey)) {
    return res.status(200).json({ valid: false });
  }
  if (rawSchulCode && !SCHUL_CODE_RE.test(rawSchulCode)) {
    return res.status(200).json({ valid: false });
  }

  let customer;
  try {
    customer = rawSchulCode
      ? await findCustomerByMeta(stripeKey, 'schul_code', rawSchulCode)
      : await findCustomerByMeta(stripeKey, 'license_key', rawLicenseKey);
  } catch (err) {
    return res.status(502).json({ error: 'Failed to reach Stripe API: ' + err.message });
  }

  if (!customer) {
    return res.status(200).json({ valid: false });
  }

  const meta = customer.metadata || {};
  const plan = meta.plan || 'none';
  const limit = PLAN_LIMITS[plan] ?? 0;

  if (plan === 'none' || limit === 0) {
    return res.status(200).json({ valid: false });
  }

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  let correctionsThisMonth = parseInt(meta.corrections_this_month || '0', 10);
  let resetDate = meta.corrections_reset_date || today;

  // Clamp future resetDate to today to handle clock skew, and persist the correction
  if (resetDate > today) {
    resetDate = today;
    try {
      await updateCustomerMetadata(stripeKey, customer.id, {
        corrections_reset_date: resetDate,
        corrections_this_month: String(correctionsThisMonth),
      });
    } catch (err) {
      console.error('Failed to persist clock-skew correction:', err.message);
    }
  }

  // Reset if new month
  const resetMonth = resetDate.slice(0, 7);
  const currentMonth = today.slice(0, 7);
  if (resetMonth !== currentMonth) {
    correctionsThisMonth = 0;
    resetDate = today;
  }

  if (action === 'increment') {
    if (correctionsThisMonth >= limit) {
      return res.status(429).json({
        valid: true,
        plan,
        corrections_this_month: correctionsThisMonth,
        limit,
        corrections_remaining: 0,
        error: 'Monatliches Limit erreicht.',
      });
    }
    correctionsThisMonth += 1;
    try {
      await updateCustomerMetadata(stripeKey, customer.id, {
        corrections_this_month: String(correctionsThisMonth),
        corrections_reset_date: resetDate,
      });
    } catch (err) {
      console.error('Failed to increment usage:', err.message);
    }
  }

  return res.status(200).json({
    valid: true,
    plan,
    corrections_this_month: correctionsThisMonth,
    limit,
    corrections_remaining: Math.max(0, limit - correctionsThisMonth),
  });
}
