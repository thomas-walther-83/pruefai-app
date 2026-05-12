#!/usr/bin/env node
/**
 * Idempotent Stripe bootstrap for Pruefai.
 *
 * Creates (or reuses) products + monthly CHF prices for all plans and the
 * webhook endpoint pointing to ${APP_URL}/api/stripe-webhook.
 *
 * Resources are tagged with metadata.pruefai_managed=1 and
 * metadata.pruefai_plan=<plan> so re-runs find and update them instead of
 * creating duplicates.
 *
 * Required env:
 *   STRIPE_SECRET_KEY    Either sk_test_... or sk_live_...
 *   APP_URL              e.g. https://pruefai.ch (default)
 *
 * Output: prints the env-var block to copy into Vercel. The script never
 * writes any secret to disk.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_test_xxx APP_URL=https://pruefai.ch \
 *     node scripts/setup-stripe.mjs
 */

const STRIPE_API = 'https://api.stripe.com/v1';

const PLANS = [
  { plan: 'starter', name: 'Pruefai Starter',  amountCHF:  9, corrections: 50,   description: 'Bis 50 KI-Korrekturen / Monat' },
  { plan: 'pro',     name: 'Pruefai Pro',      amountCHF: 19, corrections: 300,  description: 'Bis 300 KI-Korrekturen / Monat' },
  { plan: 'max',     name: 'Pruefai Max',      amountCHF: 49, corrections: 1500, description: 'Bis 1500 KI-Korrekturen / Monat' },
];

const WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.deleted',
  'customer.subscription.updated',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
];

const stripeKey = process.env.STRIPE_SECRET_KEY;
const appUrl = (process.env.APP_URL || 'https://pruefai.ch').replace(/\/$/, '');

if (!stripeKey) {
  console.error('ERROR: STRIPE_SECRET_KEY env var required.');
  process.exit(1);
}
if (!/^sk_(test|live)_/.test(stripeKey)) {
  console.error('ERROR: STRIPE_SECRET_KEY must start with sk_test_ or sk_live_.');
  process.exit(1);
}
const mode = stripeKey.startsWith('sk_live_') ? 'live' : 'test';

async function stripe(path, { method = 'GET', body } = {}) {
  const init = {
    method,
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };
  if (body) init.body = body instanceof URLSearchParams ? body.toString() : body;
  const res = await fetch(`${STRIPE_API}${path}`, init);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Stripe ${method} ${path} failed (${res.status}): ${data.error?.message || JSON.stringify(data)}`);
  }
  return data;
}

function form(obj, prefix = '') {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v === null || v === undefined) continue;
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (typeof item === 'object') {
          for (const [ik, iv] of Object.entries(item)) p.append(`${key}[${i}][${ik}]`, String(iv));
        } else {
          p.append(`${key}[${i}]`, String(item));
        }
      });
    } else if (typeof v === 'object') {
      for (const [ik, iv] of Object.entries(v)) p.append(`${key}[${ik}]`, String(iv));
    } else {
      p.append(key, String(v));
    }
  }
  return p;
}

async function listAll(path) {
  const items = [];
  let starting_after;
  for (;;) {
    const qs = new URLSearchParams({ limit: '100' });
    if (starting_after) qs.set('starting_after', starting_after);
    const data = await stripe(`${path}?${qs.toString()}`);
    items.push(...data.data);
    if (!data.has_more) return items;
    starting_after = data.data[data.data.length - 1].id;
  }
}

async function upsertProduct({ plan, name, description }) {
  const existing = await listAll('/products');
  const match = existing.find(
    (p) => p.metadata?.pruefai_managed === '1' && p.metadata?.pruefai_plan === plan,
  );
  const body = form({
    name,
    description,
    active: true,
    metadata: { pruefai_managed: '1', pruefai_plan: plan },
  });
  if (match) {
    const updated = await stripe(`/products/${match.id}`, { method: 'POST', body });
    return { product: updated, created: false };
  }
  const created = await stripe('/products', { method: 'POST', body });
  return { product: created, created: true };
}

async function upsertMonthlyPrice({ productId, plan, amountCHF }) {
  const prices = await listAll(`/prices?product=${productId}`);
  const expectedAmount = Math.round(amountCHF * 100);
  const match = prices.find(
    (pr) =>
      pr.metadata?.pruefai_managed === '1' &&
      pr.metadata?.pruefai_plan === plan &&
      pr.active &&
      pr.currency === 'chf' &&
      pr.unit_amount === expectedAmount &&
      pr.recurring?.interval === 'month',
  );
  if (match) return { price: match, created: false };

  // Archive any older managed prices for this plan with different amounts.
  for (const pr of prices) {
    if (
      pr.metadata?.pruefai_managed === '1' &&
      pr.metadata?.pruefai_plan === plan &&
      pr.active
    ) {
      await stripe(`/prices/${pr.id}`, { method: 'POST', body: form({ active: false }) });
    }
  }
  const body = form({
    product: productId,
    currency: 'chf',
    unit_amount: expectedAmount,
    recurring: { interval: 'month' },
    metadata: { pruefai_managed: '1', pruefai_plan: plan },
  });
  const created = await stripe('/prices', { method: 'POST', body });
  return { price: created, created: true };
}

async function upsertWebhook(url) {
  const endpoints = await listAll('/webhook_endpoints');
  const match = endpoints.find(
    (e) => e.metadata?.pruefai_managed === '1' && e.url === url,
  );
  const body = form({
    url,
    enabled_events: WEBHOOK_EVENTS,
    description: 'Pruefai license + subscription lifecycle',
    metadata: { pruefai_managed: '1' },
  });
  if (match) {
    const updated = await stripe(`/webhook_endpoints/${match.id}`, { method: 'POST', body });
    return { endpoint: updated, secret: null, created: false };
  }
  const created = await stripe('/webhook_endpoints', { method: 'POST', body });
  return { endpoint: created, secret: created.secret, created: true };
}

console.log(`\nStripe bootstrap (${mode} mode) – target: ${appUrl}\n`);

const results = [];
for (const cfg of PLANS) {
  const { product, created: pCreated } = await upsertProduct(cfg);
  const { price, created: prCreated } = await upsertMonthlyPrice({
    productId: product.id,
    plan: cfg.plan,
    amountCHF: cfg.amountCHF,
  });
  results.push({ plan: cfg.plan, productId: product.id, priceId: price.id, pCreated, prCreated });
  console.log(
    `  ${pCreated ? '+' : '='} product  ${cfg.plan.padEnd(8)} ${product.id}` +
      `   ${prCreated ? '+' : '='} price ${price.id}  (CHF ${cfg.amountCHF}/mo)`,
  );
}

const webhookUrl = `${appUrl}/api/stripe-webhook`;
const { endpoint, secret, created: whCreated } = await upsertWebhook(webhookUrl);
console.log(`  ${whCreated ? '+' : '='} webhook  ${endpoint.id}  ${webhookUrl}\n`);

console.log('─────────────────────────────────────────────────────────────');
console.log('  Vercel Environment Variables (Production):');
console.log('─────────────────────────────────────────────────────────────');
for (const r of results) {
  console.log(`  STRIPE_PRICE_${r.plan.toUpperCase()}=${r.priceId}`);
}
if (secret) {
  console.log(`  STRIPE_WEBHOOK_SECRET=${secret}    # ⚠ shown only on creation`);
} else {
  console.log('  STRIPE_WEBHOOK_SECRET=<unchanged>   # webhook already existed');
}
console.log('─────────────────────────────────────────────────────────────\n');

if (mode === 'test') {
  console.log('Test mode – use these IDs in your Vercel "Preview" environment.');
} else {
  console.log('Live mode – use these IDs in your Vercel "Production" environment.');
}
