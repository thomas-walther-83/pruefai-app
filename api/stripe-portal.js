const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
const LICENSE_KEY_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lernortai.ch';

  const licenseKey = typeof req.body?.license_key === 'string' ? req.body.license_key.trim() : '';
  if (!licenseKey) {
    return res.status(400).json({ error: 'Missing license_key in request body.' });
  }
  if (!LICENSE_KEY_RE.test(licenseKey) || licenseKey.includes("'")) {
    return res.status(400).json({ error: 'Invalid license_key format.' });
  }

  // Search Stripe customer by license_key metadata
  const query = encodeURIComponent(`metadata['license_key']:'${licenseKey}'`);
  let searchRes;
  try {
    searchRes = await fetch(`https://api.stripe.com/v1/customers/search?query=${query}&limit=1`, {
      headers: { Authorization: `Bearer ${stripeKey}` },
    });
  } catch (err) {
    return res.status(502).json({ error: 'Failed to reach Stripe API: ' + err.message });
  }

  const searchData = await searchRes.json();
  if (!searchRes.ok) {
    return res.status(searchRes.status).json({ error: searchData.error?.message || 'Stripe search error' });
  }

  if (!searchData.data || searchData.data.length === 0) {
    return res.status(404).json({ error: 'No customer found for this license key.' });
  }
  const customerId = searchData.data[0].id;

  // Create Billing Portal session
  const portalParams = new URLSearchParams({
    customer: customerId,
    return_url: `${appUrl}/`,
  });

  let portalRes;
  try {
    portalRes = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: portalParams.toString(),
    });
  } catch (err) {
    return res.status(502).json({ error: 'Failed to reach Stripe API: ' + err.message });
  }

  const portalData = await portalRes.json();
  if (!portalRes.ok) {
    console.error('Stripe portal error', portalRes.status, JSON.stringify(portalData));
    return res.status(portalRes.status).json({ error: portalData.error?.message || 'Stripe portal error' });
  }

  // Frontend uses fetch, so return JSON with URL
  return res.status(200).json({ url: portalData.url });
}
