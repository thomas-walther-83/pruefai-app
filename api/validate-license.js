const PLAN_LIMITS = { starter: 50, pro: 300, schule: 99999 };

async function findCustomerByLicenseKey(stripeKey, licenseKey) {
  const query = encodeURIComponent(`metadata['license_key']:'${licenseKey}'`);
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return res.status(500).json({ error: 'STRIPE_SECRET_KEY not configured.' });
  }

  const { license_key, action } = req.body || {};
  if (!license_key) {
    return res.status(400).json({ error: 'Missing license_key.' });
  }

  let customer;
  try {
    customer = await findCustomerByLicenseKey(stripeKey, license_key);
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

  // Clamp future resetDate to today to handle clock skew
  if (resetDate > today) resetDate = today;

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
