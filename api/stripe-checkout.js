export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const plan = req.query.plan;
  const planMap = {
    starter: process.env.STRIPE_PRICE_STARTER,
    pro: process.env.STRIPE_PRICE_PRO,
    max: process.env.STRIPE_PRICE_MAX || process.env.STRIPE_PRICE_SCHULE,
    schule: process.env.STRIPE_PRICE_SCHULE,
  };

  if (!plan || !planMap[plan]) {
    return res.status(400).json({ error: 'Invalid or missing plan parameter.' });
  }

  const priceId = planMap[plan];
  if (!priceId) {
    return res.status(500).json({ error: `STRIPE_PRICE_${plan.toUpperCase()} not configured.` });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return res.status(500).json({ error: 'STRIPE_SECRET_KEY not configured.' });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lernortai.ch';

  const params = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    'metadata[plan]': plan,
    // Allow card and SEPA Direct Debit
    'payment_method_types[0]': 'card',
    'payment_method_types[1]': 'sepa_debit',
    // Enable automatic invoice creation
    'invoice_creation[enabled]': 'true',
    success_url: `${appUrl}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/`,
  });

  let stripeRes;
  try {
    stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
  } catch (err) {
    return res.status(502).json({ error: 'Failed to reach Stripe API: ' + err.message });
  }

  const data = await stripeRes.json();
  if (!stripeRes.ok) {
    console.error('Stripe checkout error', stripeRes.status, JSON.stringify(data));
    return res.status(stripeRes.status).json({ error: data.error?.message || 'Stripe error' });
  }

  res.setHeader('Location', data.url);
  return res.status(302).end();
}
