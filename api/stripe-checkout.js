import { ALLOWED_ORIGINS, checkRateLimit, getClientIp } from './_lib/security.js';

const RATE_LIMIT = { max: 10, windowMs: 600_000 }; // 10 checkout sessions / 10 min / IP

function refererAllowed(req) {
  if (ALLOWED_ORIGINS.length === 0) return true; // dev mode: no allowlist configured
  const referer = req.headers.referer || '';
  if (!referer) return true; // some browsers strip referer; don't punish legit users
  try {
    const origin = new URL(referer).origin;
    return ALLOWED_ORIGINS.includes(origin);
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  if (!refererAllowed(req)) {
    return res.status(403).json({ error: 'Origin not allowed.' });
  }

  const ip = getClientIp(req);
  if (!checkRateLimit('stripe-checkout', ip, RATE_LIMIT)) {
    return res.status(429).json({ error: 'Zu viele Anfragen. Bitte später erneut versuchen.' });
  }

  const normalizePlan = (value) =>
    String(Array.isArray(value) ? value[0] || '' : value || '').trim().toLowerCase();

  const rawPlan = req.query.plan || req.query.model || '';
  const plan = normalizePlan(rawPlan);
  const planMap = {
    starter: process.env.STRIPE_PRICE_STARTER,
    pro: process.env.STRIPE_PRICE_PRO,
    max: process.env.STRIPE_PRICE_MAX || process.env.STRIPE_PRICE_SCHULE,
    schule: process.env.STRIPE_PRICE_SCHULE,
  };

  if (!plan || !Object.prototype.hasOwnProperty.call(planMap, plan)) {
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pruefai.ch';

  const params = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    'metadata[plan]': plan,
    // Stripe Checkout automatically uses payment methods configured in Dashboard
    // for eligible customers (e.g. TWINT in CH when enabled there).
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
