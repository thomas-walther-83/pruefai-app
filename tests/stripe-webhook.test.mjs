/**
 * Tests für api/stripe-webhook.js
 *
 * Verwendet Node.js built-in test runner (node:test) – keine externen Abhängigkeiten.
 * Ausführen: node --test tests/stripe-webhook.test.mjs
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

process.env.ALLOWED_ORIGINS = '';

const { default: handler } = await import('../api/stripe-webhook.js');

// ── Konstanten ────────────────────────────────────────────────────────────────

const WEBHOOK_SECRET = 'whsec_test_secret_1234567890abcdef';
const STRIPE_KEY = 'sk_test_fake';

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

function makeStripeSignature(secret, rawBody) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `${timestamp}.${rawBody}`;
  const sig = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
  return `t=${timestamp},v1=${sig}`;
}

/**
 * Erstellt ein Mock-Request, das den Node.js-Streams-Interface (on/data/end) nachbildet.
 * Die Daten werden im nächsten Microtask emittiert, damit Listener zuerst registriert werden.
 */
function makeWebhookReq(bodyStr, sigHeader, method = 'POST') {
  const listeners = {};
  const req = {
    method,
    headers: {
      'content-type': 'application/json',
      ...(sigHeader !== undefined ? { 'stripe-signature': sigHeader } : {}),
    },
    on(event, cb) {
      listeners[event] = cb;
      return this;
    },
  };
  if (method === 'POST') {
    Promise.resolve().then(() => {
      if (listeners.data) listeners.data(Buffer.from(bodyStr, 'utf8'));
      if (listeners.end) listeners.end();
    });
  }
  return req;
}

function makeEvent(type, data) {
  return JSON.stringify({ type, data: { object: data } });
}

function mockRes() {
  const r = {
    statusCode: 200,
    body: null,
    status(code) { r.statusCode = code; return r; },
    json(data)   { r.body = data;       return r; },
    end()        {                       return r; },
    setHeader()  {},
  };
  return r;
}

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  delete process.env.RESEND_API_KEY;
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('stripe-webhook – Methoden-Validierung', () => {
  it('gibt 405 zurück für GET', async () => {
    const req = { method: 'GET', headers: {}, on() { return this; } };
    const res = mockRes();
    await handler(req, res);
    assert.equal(res.statusCode, 405);
  });
});

describe('stripe-webhook – Konfigurationsprüfung', () => {
  it('gibt 500 zurück wenn STRIPE_SECRET_KEY und STRIPE_WEBHOOK_SECRET fehlen', async () => {
    const rawBody = makeEvent('test', {});
    const req = makeWebhookReq(rawBody, 't=1,v1=abc');
    const res = mockRes();
    await handler(req, res);
    assert.equal(res.statusCode, 500);
  });

  it('gibt 500 zurück wenn nur STRIPE_WEBHOOK_SECRET gesetzt ist', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
    const rawBody = makeEvent('test', {});
    const req = makeWebhookReq(rawBody, 't=1,v1=abc');
    const res = mockRes();
    await handler(req, res);
    assert.equal(res.statusCode, 500);
  });
});

describe('stripe-webhook – Signaturprüfung', () => {
  it('gibt 400 zurück wenn stripe-signature Header fehlt', async () => {
    process.env.STRIPE_SECRET_KEY = STRIPE_KEY;
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
    const rawBody = makeEvent('test.event', {});
    const req = makeWebhookReq(rawBody, undefined);
    delete req.headers['stripe-signature'];
    const res = mockRes();
    await handler(req, res);
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.error.toLowerCase().includes('signature'));
  });

  it('gibt 400 zurück bei ungültiger Signatur', async () => {
    process.env.STRIPE_SECRET_KEY = STRIPE_KEY;
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
    const timestamp = Math.floor(Date.now() / 1000);
    const rawBody = makeEvent('test.event', {});
    const req = makeWebhookReq(rawBody, `t=${timestamp},v1=${'a'.repeat(64)}`);
    const res = mockRes();
    await handler(req, res);
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.error.toLowerCase().includes('signature'));
  });

  it('gibt 400 zurück bei zu altem Timestamp (> 5 Minuten)', async () => {
    process.env.STRIPE_SECRET_KEY = STRIPE_KEY;
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
    const oldTimestamp = Math.floor(Date.now() / 1000) - 400; // 400s ago > 300s tolerance
    const rawBody = makeEvent('test.event', {});
    const payload = `${oldTimestamp}.${rawBody}`;
    const sig = crypto.createHmac('sha256', WEBHOOK_SECRET).update(payload, 'utf8').digest('hex');
    const req = makeWebhookReq(rawBody, `t=${oldTimestamp},v1=${sig}`);
    const res = mockRes();
    await handler(req, res);
    assert.equal(res.statusCode, 400);
  });
});

describe('stripe-webhook – checkout.session.completed', () => {
  it('erstellt Lizenzschlüssel und aktualisiert Stripe-Metadaten', async () => {
    process.env.STRIPE_SECRET_KEY = STRIPE_KEY;
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;

    const eventPayload = makeEvent('checkout.session.completed', {
      customer: 'cus_test123',
      customer_details: { email: 'test@example.com' },
      metadata: { plan: 'pro' },
    });
    const sig = makeStripeSignature(WEBHOOK_SECRET, eventPayload);

    let capturedParams = null;
    globalThis.fetch = async (url, opts) => {
      if (url.includes('/v1/customers/cus_test123') && opts?.method === 'POST') {
        capturedParams = Object.fromEntries(new URLSearchParams(opts.body));
      }
      return { ok: true, json: async () => ({}) };
    };

    const req = makeWebhookReq(eventPayload, sig);
    const res = mockRes();
    await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.received, true);
    // Lizenzschlüssel muss eine gültige UUID sein
    assert.match(
      capturedParams?.['metadata[license_key]'] || '',
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
    assert.equal(capturedParams?.['metadata[plan]'], 'pro');
    assert.equal(capturedParams?.['metadata[corrections_this_month]'], '0');
  });

  it('generiert Schulcode für schule-Plan', async () => {
    process.env.STRIPE_SECRET_KEY = STRIPE_KEY;
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;

    const eventPayload = makeEvent('checkout.session.completed', {
      customer: 'cus_schule',
      customer_details: { email: 'schule@example.com' },
      metadata: { plan: 'schule' },
    });
    const sig = makeStripeSignature(WEBHOOK_SECRET, eventPayload);

    let capturedParams = null;
    globalThis.fetch = async (url, opts) => {
      if (opts?.method === 'POST') {
        capturedParams = Object.fromEntries(new URLSearchParams(opts.body));
      }
      return { ok: true, json: async () => ({}) };
    };

    const req = makeWebhookReq(eventPayload, sig);
    const res = mockRes();
    await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.match(capturedParams?.['metadata[schul_code]'] || '', /^SCHULE-[0-9A-F]{12}$/);
  });
});

describe('stripe-webhook – customer.subscription.updated', () => {
  it('aktualisiert den Plan bei Plan-Wechsel', async () => {
    process.env.STRIPE_SECRET_KEY = STRIPE_KEY;
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;

    const eventPayload = makeEvent('customer.subscription.updated', {
      customer: 'cus_sub123',
      items: { data: [{ price: { id: 'price_pro123' } }] },
    });
    const sig = makeStripeSignature(WEBHOOK_SECRET, eventPayload);

    let customerUpdated = false;
    globalThis.fetch = async (url, opts) => {
      if (url.includes('/v1/prices/price_pro123')) {
        return { ok: true, json: async () => ({ metadata: { plan: 'pro' }, product: null }) };
      }
      if (url.includes('/v1/customers/cus_sub123') && opts?.method === 'POST') {
        customerUpdated = true;
      }
      return { ok: true, json: async () => ({}) };
    };

    const req = makeWebhookReq(eventPayload, sig);
    const res = mockRes();
    await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.ok(customerUpdated, 'Kunden-Metadaten müssen nach Plan-Wechsel aktualisiert werden');
  });
});

describe('stripe-webhook – customer.subscription.deleted', () => {
  it('setzt Plan auf "none" bei Kündigung', async () => {
    process.env.STRIPE_SECRET_KEY = STRIPE_KEY;
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;

    const eventPayload = makeEvent('customer.subscription.deleted', {
      customer: 'cus_cancelled',
    });
    const sig = makeStripeSignature(WEBHOOK_SECRET, eventPayload);

    let updatedMeta = null;
    globalThis.fetch = async (url, opts) => {
      if (opts?.method === 'POST') {
        updatedMeta = Object.fromEntries(new URLSearchParams(opts.body));
      }
      return { ok: true, json: async () => ({}) };
    };

    const req = makeWebhookReq(eventPayload, sig);
    const res = mockRes();
    await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(updatedMeta?.['metadata[plan]'], 'none');
    assert.equal(updatedMeta?.['metadata[license_key]'], '');
  });
});

describe('stripe-webhook – invoice.payment_failed', () => {
  it('sperrt Zugang nach Erreichen des Maximal-Fehlversuch-Limits (3)', async () => {
    process.env.STRIPE_SECRET_KEY = STRIPE_KEY;
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;

    const eventPayload = makeEvent('invoice.payment_failed', {
      customer: 'cus_failed',
      customer_email: 'fail@example.com',
      attempt_count: 3,
    });
    const sig = makeStripeSignature(WEBHOOK_SECRET, eventPayload);

    let updatedMeta = null;
    globalThis.fetch = async (url, opts) => {
      if (opts?.method === 'POST') {
        updatedMeta = Object.fromEntries(new URLSearchParams(opts.body));
      }
      return { ok: true, json: async () => ({}) };
    };

    const req = makeWebhookReq(eventPayload, sig);
    const res = mockRes();
    await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(updatedMeta?.['metadata[plan]'], 'none');
    assert.equal(updatedMeta?.['metadata[license_key]'], '');
  });

  it('behält Zugang bei weniger als 3 Fehlversuchen', async () => {
    process.env.STRIPE_SECRET_KEY = STRIPE_KEY;
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;

    const eventPayload = makeEvent('invoice.payment_failed', {
      customer: 'cus_failed2',
      customer_email: 'fail2@example.com',
      attempt_count: 2,
    });
    const sig = makeStripeSignature(WEBHOOK_SECRET, eventPayload);

    let metadataUpdated = false;
    globalThis.fetch = async (url, opts) => {
      if (opts?.method === 'POST') metadataUpdated = true;
      return { ok: true, json: async () => ({}) };
    };

    const req = makeWebhookReq(eventPayload, sig);
    const res = mockRes();
    await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(metadataUpdated, false, 'Bei 2 Fehlversuchen darf kein Metadaten-Update erfolgen');
  });
});
