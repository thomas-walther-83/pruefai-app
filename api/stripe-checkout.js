const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 3_600_000;
const ipRateMap = new Map();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = ipRateMap.get(ip);
  if (!entry || entry.resetAt < now) {
    ipRateMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

function refererHostAllowed(req) {
  if (ALLOWED_ORIGINS.length === 0) return true;
  const ref = req.headers.referer || req.headers.referrer || '';
  if (!ref) return true; // direct navigation / bookmark – allow
  try {
    const refOrigin = new URL(ref).origin;
    return ALLOWED_ORIGINS.includes(refOrigin);
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!refererHostAllowed(req)) {
    return res.status(403).json({ error: 'Referer not allowed.' });
  }

  if (!checkRateLimit(getClientIp(req))) {
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
