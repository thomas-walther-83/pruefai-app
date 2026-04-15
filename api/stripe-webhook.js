export const config = { api: { bodyParser: false } };

import crypto from 'crypto';

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function verifyStripeSignature(rawBody, sigHeader, secret) {
  // sigHeader format: t=<timestamp>,v1=<sig1>,v1=<sig2>,...
  const parts = sigHeader.split(',');
  let timestamp = null;
  const v1Sigs = [];

  for (const part of parts) {
    if (part.startsWith('t=')) timestamp = part.slice(2);
    else if (part.startsWith('v1=')) v1Sigs.push(part.slice(3));
  }

  if (!timestamp || v1Sigs.length === 0) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  return v1Sigs.some((sig) => crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex')));
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
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return res.status(500).json({ error: 'Stripe environment variables not configured.' });
  }

  let rawBody;
  try {
    rawBody = await getRawBody(req);
  } catch (err) {
    return res.status(400).json({ error: 'Could not read request body.' });
  }

  const sigHeader = req.headers['stripe-signature'];
  if (!sigHeader) {
    return res.status(400).json({ error: 'Missing stripe-signature header.' });
  }

  if (!verifyStripeSignature(rawBody.toString('utf8'), sigHeader, webhookSecret)) {
    console.error('Stripe webhook signature verification failed');
    return res.status(400).json({ error: 'Webhook signature verification failed.' });
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON payload.' });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const customerId = session.customer;
      const customerEmail = session.customer_details?.email || session.customer_email || '';
      const plan = session.metadata?.plan || 'starter';
      const licenseKey = crypto.randomUUID();
      const today = new Date().toISOString().slice(0, 10);

      await updateCustomerMetadata(stripeKey, customerId, {
        license_key: licenseKey,
        plan,
        corrections_this_month: '0',
        corrections_reset_date: today,
      });

      console.log(`Checkout completed: customer=${customerId}, email=${customerEmail}, plan=${plan}, license=${licenseKey}`);
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      await updateCustomerMetadata(stripeKey, customerId, {
        license_key: '',
        plan: 'none',
      });

      console.log(`Subscription deleted: customer=${customerId}`);
    }
  } catch (err) {
    console.error('Webhook handler error:', err.message);
    return res.status(500).json({ error: 'Webhook handler failed: ' + err.message });
  }

  return res.status(200).json({ received: true });
}
