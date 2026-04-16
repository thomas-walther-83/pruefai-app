export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return res.status(500).json({ error: 'STRIPE_SECRET_KEY not configured.' });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lernortai.ch';

  let customerId;

  if (req.method === 'GET') {
    customerId = req.query.customer_id;
    if (!customerId) {
      return res.status(400).json({ error: 'Missing customer_id parameter.' });
    }
  } else {
    // POST with license_key
    const { license_key } = req.body || {};
    if (!license_key) {
      return res.status(400).json({ error: 'Missing license_key in request body.' });
    }

    // Search Stripe customer by license_key metadata
    const query = encodeURIComponent(`metadata['license_key']:'${license_key}'`);
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

    customerId = searchData.data[0].id;
  }

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

  if (req.method === 'POST') {
    // Frontend uses fetch, so return JSON with URL
    return res.status(200).json({ url: portalData.url });
  }

  // GET: redirect directly
  res.setHeader('Location', portalData.url);
  return res.status(302).end();
}
