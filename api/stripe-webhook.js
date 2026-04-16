export const config = { api: { bodyParser: false } };

import crypto from 'crypto';

const PLAN_LABELS = { starter: 'Starter (50 Korrekturen/Monat)', pro: 'Pro (300 Korrekturen/Monat)', schule: 'Schule (unbegrenzt)' };

async function sendLicenseEmail(resendKey, toEmail, licenseKey, plan) {
  if (!resendKey || !toEmail) return;
  const planLabel = PLAN_LABELS[plan] || plan;
  const html = `
<!DOCTYPE html><html lang="de"><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#f9fafb;padding:2rem">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#1a56db,#0d3494);color:#fff;padding:2rem;text-align:center">
    <div style="font-size:2rem;margin-bottom:.5rem">🎓</div>
    <h1 style="margin:0;font-size:1.5rem;font-weight:800">Willkommen bei LernortAI!</h1>
    <p style="margin:.5rem 0 0;opacity:.9">Ihr Abonnement ist aktiv.</p>
  </div>
  <div style="padding:2rem">
    <p style="margin:0 0 1rem">Herzlichen Glückwunsch! Ihr <strong>${planLabel}</strong>-Abonnement ist jetzt aktiv.</p>
    <p style="margin:0 0 .5rem;font-size:.85rem;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:.06em">Ihr Lizenzschlüssel</p>
    <div style="background:#f3f4f6;border:1px solid #e5e7eb;border-radius:8px;padding:1rem;font-family:'Courier New',monospace;font-size:.95rem;font-weight:700;color:#1a56db;word-break:break-all;margin-bottom:1.5rem">${licenseKey}</div>
    <p style="margin:0 0 1rem;font-size:.9rem">So aktivieren Sie Ihr Abo:</p>
    <ol style="margin:0 0 1.5rem;padding-left:1.25rem;font-size:.9rem;line-height:1.8">
      <li>Öffnen Sie <a href="https://lernortai.ch" style="color:#1a56db">lernortai.ch</a></li>
      <li>Klicken Sie auf ⚙️ <strong>Einstellungen</strong></li>
      <li>Fügen Sie den Lizenzschlüssel ein und speichern Sie</li>
    </ol>
    <a href="https://lernortai.ch" style="display:inline-block;background:#1a56db;color:#fff;padding:.875rem 2rem;border-radius:10px;font-weight:700;font-size:1rem;text-decoration:none">App starten →</a>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:2rem 0">
    <p style="margin:0;font-size:.8rem;color:#9ca3af">Fragen? <a href="mailto:info@lernortai.ch" style="color:#1a56db">info@lernortai.ch</a></p>
  </div>
</div>
</body></html>`;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'LernortAI <noreply@lernortai.ch>',
        to: [toEmail],
        subject: 'Ihr LernortAI Lizenzschlüssel – Abonnement aktiv',
        html,
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      console.error('Resend email failed:', res.status, JSON.stringify(d));
    } else {
      console.log(`License email sent to ${toEmail}`);
    }
  } catch (err) {
    console.error('Resend email error:', err.message);
  }
}

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

  // Reject webhooks older than 5 minutes to prevent replay attacks
  const TOLERANCE_SECONDS = 300;
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - parseInt(timestamp, 10)) > TOLERANCE_SECONDS) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  const expectedBuf = Buffer.from(expected, 'hex');
  return v1Sigs.some((sig) => {
    try {
      const sigBuf = Buffer.from(sig, 'hex');
      return sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf);
    } catch (_) {
      return false;
    }
  });
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

      // Send license key by email (non-blocking, graceful on missing RESEND_API_KEY)
      const resendKey = process.env.RESEND_API_KEY || '';
      await sendLicenseEmail(resendKey, customerEmail, licenseKey, plan);

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
