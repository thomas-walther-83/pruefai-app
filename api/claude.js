const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
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

async function incrementUsage(stripeKey, customerId, current, resetDate) {
  const params = new URLSearchParams({
    'metadata[corrections_this_month]': String(current + 1),
    'metadata[corrections_reset_date]': resetDate,
  });
  await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';

  // CORS: only allow configured origins (or same-origin requests with no Origin header)
  if (origin && ALLOWED_ORIGINS.length > 0 && !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: 'Origin not allowed.' });
  }

  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-License-Key');
    res.setHeader('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured on server.' });
  }

  const { model, max_tokens, system, messages, licenseKey: bodyLicenseKey } = req.body;
  if (!messages) {
    return res.status(400).json({ error: 'Missing required field: messages' });
  }

  // License validation (optional, enabled via REQUIRE_LICENSE=true)
  if (process.env.REQUIRE_LICENSE === 'true') {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return res.status(500).json({ error: 'STRIPE_SECRET_KEY not configured on server.' });
    }

    const licenseKey = req.headers['x-license-key'] || bodyLicenseKey || '';
    if (!licenseKey) {
      return res.status(402).json({ error: 'Kein aktiver Plan. Bitte abonnieren.', upgradeUrl: '/landing.html' });
    }

    let customer;
    try {
      customer = await findCustomerByLicenseKey(stripeKey, licenseKey);
    } catch (err) {
      console.error('License check failed:', err.message);
      return res.status(502).json({ error: 'Lizenzprüfung fehlgeschlagen.' });
    }

    if (!customer) {
      return res.status(402).json({ error: 'Kein aktiver Plan. Bitte abonnieren.', upgradeUrl: '/landing.html' });
    }

    const meta = customer.metadata || {};
    const plan = meta.plan || 'none';
    const limit = PLAN_LIMITS[plan] ?? 0;

    if (plan === 'none' || limit === 0) {
      return res.status(402).json({ error: 'Kein aktiver Plan. Bitte abonnieren.', upgradeUrl: '/landing.html' });
    }

    const today = new Date().toISOString().slice(0, 10);
    let correctionsThisMonth = parseInt(meta.corrections_this_month || '0', 10);
    let resetDate = meta.corrections_reset_date || today;

    // Reset counter if new month
    if (resetDate.slice(0, 7) !== today.slice(0, 7)) {
      correctionsThisMonth = 0;
      resetDate = today;
    }

    if (correctionsThisMonth >= limit) {
      return res.status(429).json({ error: 'Monatliches Limit erreicht.', upgradeUrl: '/landing.html' });
    }

    // Increment usage (fire and forget — don't block the Claude request)
    incrementUsage(stripeKey, customer.id, correctionsThisMonth, resetDate).catch((err) =>
      console.error('Failed to increment usage:', err.message)
    );
  }

  let response;
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'claude-opus-4-5',
        max_tokens: max_tokens || 1024,
        system,
        messages,
      }),
    });
  } catch (err) {
    return res.status(502).json({ error: 'Failed to reach Anthropic API: ' + err.message });
  }

  const data = await response.json();
  if (!response.ok) {
    console.error('Anthropic API error', response.status, JSON.stringify(data));
  }
  return res.status(response.status).json(data);
}
