export const config = { api: { bodyParser: false } };

import crypto from 'crypto';

const PLAN_LABELS = {
  starter: 'Starter (50 Korrekturen/Monat)',
  pro: 'Pro (300 Korrekturen/Monat)',
  max: 'Max (5’000 Korrekturen/Monat)',
  schule: 'Max (5’000+ Korrekturen/Monat)',
};

const MAX_PAYMENT_FAILURES = 3;

function generateSchulCode() {
  // 6 bytes = 12 hex chars → 281 trillion possible codes, brute-force infeasible
  return 'SCHULE-' + crypto.randomBytes(6).toString('hex').toUpperCase();
}

async function sendLicenseEmail(resendKey, toEmail, licenseKey, plan, schulCode) {
  if (!resendKey || !toEmail) return;
  const planLabel = PLAN_LABELS[plan] || plan;
  const schulCodeSection = schulCode
    ? `<p style="margin:0 0 .5rem;font-size:.85rem;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:.06em">Schulcode (für alle Lehrpersonen)</p>
    <div style="background:#f3f4f6;border:1px solid #e5e7eb;border-radius:8px;padding:1rem;font-family:'Courier New',monospace;font-size:.95rem;font-weight:700;color:#1a56db;word-break:break-all;margin-bottom:1.5rem">${schulCode}</div>
    <p style="margin:0 0 1rem;font-size:.85rem;color:#6b7280">Teilen Sie den Schulcode mit Ihren Lehrpersonen. Jede Lehrperson trägt ihn in ⚙️ Einstellungen → «Schulcode» ein.</p>`
    : '';
  const html = `
<!DOCTYPE html><html lang="de"><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#f9fafb;padding:2rem">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#1a56db,#0d3494);color:#fff;padding:2rem;text-align:center">
    <div style="font-size:2rem;margin-bottom:.5rem">🎓</div>
    <h1 style="margin:0;font-size:1.5rem;font-weight:800">Willkommen bei Pruefai!</h1>
    <p style="margin:.5rem 0 0;opacity:.9">Ihr Abonnement ist aktiv.</p>
  </div>
  <div style="padding:2rem">
    <p style="margin:0 0 1rem">Herzlichen Glückwunsch! Ihr <strong>${planLabel}</strong>-Abonnement ist jetzt aktiv.</p>
    <p style="margin:0 0 .5rem;font-size:.85rem;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:.06em">Ihr Lizenzschlüssel</p>
    <div style="background:#f3f4f6;border:1px solid #e5e7eb;border-radius:8px;padding:1rem;font-family:'Courier New',monospace;font-size:.95rem;font-weight:700;color:#1a56db;word-break:break-all;margin-bottom:1.5rem">${licenseKey}</div>
    ${schulCodeSection}
    <p style="margin:0 0 1rem;font-size:.9rem">So aktivieren Sie Ihr Abo:</p>
    <ol style="margin:0 0 1.5rem;padding-left:1.25rem;font-size:.9rem;line-height:1.8">
      <li>Öffnen Sie <a href="https://pruefai.ch" style="color:#1a56db">pruefai.ch</a></li>
      <li>Klicken Sie auf ⚙️ <strong>Einstellungen</strong></li>
      <li>Fügen Sie den Lizenzschlüssel ein und speichern Sie</li>
    </ol>
    <a href="https://pruefai.ch" style="display:inline-block;background:#1a56db;color:#fff;padding:.875rem 2rem;border-radius:10px;font-weight:700;font-size:1rem;text-decoration:none">App starten →</a>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:2rem 0">
    <p style="margin:0;font-size:.8rem;color:#9ca3af">Fragen? <a href="mailto:info@pruefai.ch" style="color:#1a56db">info@pruefai.ch</a></p>
  </div>
</div>
</body></html>`;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Pruefai <noreply@pruefai.ch>',
        to: [toEmail],
        subject: 'Ihr Pruefai Lizenzschlüssel – Abonnement aktiv',
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

  // Reject webhooks with timestamps more than 5 minutes in the past (replay attack prevention)
  const TOLERANCE_SECONDS = 300;
  const nowSeconds = Math.floor(Date.now() / 1000);
  const ts = parseInt(timestamp, 10);
  if (nowSeconds - ts > TOLERANCE_SECONDS || ts > nowSeconds) return false;

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

      // For the schule plan also generate a shared schulCode for multi-teacher access
      const schulCode = plan === 'schule' ? generateSchulCode() : '';
      const metaUpdate = {
        license_key: licenseKey,
        plan,
        corrections_this_month: '0',
        corrections_reset_date: today,
      };
      if (schulCode) metaUpdate.schul_code = schulCode;

      await updateCustomerMetadata(stripeKey, customerId, metaUpdate);

      // Send license key by email (non-blocking, graceful on missing RESEND_API_KEY)
      const resendKey = process.env.RESEND_API_KEY || '';
      await sendLicenseEmail(resendKey, customerEmail, licenseKey, plan, schulCode);

      console.log(`Checkout completed: customer=${customerId}, email=${customerEmail}, plan=${plan}, license=${licenseKey}${schulCode ? ', schulCode=' + schulCode : ''}`);
    } else if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      const priceId = subscription.items?.data?.[0]?.price?.id;

      if (priceId) {
        // Resolve the plan label from the price's product metadata (set in Stripe dashboard)
        // Fall back to inspecting the price metadata directly
        const priceRes = await fetch(`https://api.stripe.com/v1/prices/${priceId}?expand[]=product`, {
          headers: { Authorization: `Bearer ${stripeKey}` },
        });
        const priceData = await priceRes.json();
        const newPlan =
          priceData.metadata?.plan ||
          priceData.product?.metadata?.plan ||
          null;

        if (newPlan) {
          await updateCustomerMetadata(stripeKey, customerId, { plan: newPlan });
          console.log(`Subscription updated: customer=${customerId}, newPlan=${newPlan}`);
        } else {
          console.warn(`Subscription updated for customer=${customerId} but no plan metadata found on price ${priceId}`);
        }
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      await updateCustomerMetadata(stripeKey, customerId, {
        license_key: '',
        plan: 'none',
      });

      console.log(`Subscription deleted: customer=${customerId}`);
    } else if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const customerId = invoice.customer;
      const customerEmail = invoice.customer_email || '';
      const attemptCount = invoice.attempt_count || 1;

      // After MAX_PAYMENT_FAILURES failed attempts, revoke access
      if (attemptCount >= MAX_PAYMENT_FAILURES) {
        await updateCustomerMetadata(stripeKey, customerId, {
          license_key: '',
          plan: 'none',
        });
        console.log(`Payment failed 3+ times, access revoked: customer=${customerId}`);
      } else {
        console.log(`Payment failed (attempt ${attemptCount}): customer=${customerId}, email=${customerEmail}`);
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err.message);
    return res.status(500).json({ error: 'Webhook handler failed: ' + err.message });
  }

  return res.status(200).json({ received: true });
}
