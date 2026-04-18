/**
 * Tests für api/stripe-checkout.js
 *
 * Verwendet Node.js built-in test runner (node:test) – keine externen Abhängigkeiten.
 * Ausführen: node --test tests/stripe-checkout.test.mjs
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';

const { default: handler } = await import('../api/stripe-checkout.js');

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

function mockRes() {
  const r = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) { r.statusCode = code; return r; },
    json(data)   { r.body = data;       return r; },
    end()        {                       return r; },
    setHeader(k, v) { r.headers[k] = v; },
  };
  return r;
}

function mockReq(opts = {}) {
  return {
    method: opts.method ?? 'GET',
    headers: opts.headers ?? {},
    query:   opts.query  ?? {},
    body:    opts.body   ?? {},
    socket:  { remoteAddress: '127.0.0.1' },
  };
}

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_PRICE_STARTER;
  delete process.env.STRIPE_PRICE_PRO;
  delete process.env.STRIPE_PRICE_MAX;
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('stripe-checkout – Methoden-Validierung', () => {
  it('gibt 405 zurück für POST', async () => {
    const res = mockRes();
    await handler(mockReq({ method: 'POST' }), res);
    assert.equal(res.statusCode, 405);
  });
});

describe('stripe-checkout – Eingabe-Validierung', () => {
  it('gibt 400 zurück bei fehlendem plan-Parameter', async () => {
    const res = mockRes();
    await handler(mockReq({ query: {} }), res);
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.error.includes('plan'));
  });

  it('gibt 400 zurück bei ungültigem plan-Parameter', async () => {
    const res = mockRes();
    await handler(mockReq({ query: { plan: 'enterprise' } }), res);
    assert.equal(res.statusCode, 400);
  });

  it('normalisiert Plan-Namen (Grossschreibung → Kleinschreibung)', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    process.env.STRIPE_PRICE_PRO = 'price_pro123';
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({ url: 'https://checkout.stripe.com/pay/cs_test_123' }),
    });
    const res = mockRes();
    await handler(mockReq({ query: { plan: 'PRO' } }), res);
    assert.equal(res.statusCode, 302);
    assert.ok(res.headers['Location'].includes('stripe.com'));
  });
});

describe('stripe-checkout – Konfigurationsprüfung', () => {
  it('gibt 500 zurück wenn STRIPE_SECRET_KEY fehlt', async () => {
    process.env.STRIPE_PRICE_STARTER = 'price_starter123';
    const res = mockRes();
    await handler(mockReq({ query: { plan: 'starter' } }), res);
    assert.equal(res.statusCode, 500);
    assert.ok(res.body.error.includes('STRIPE_SECRET_KEY'));
  });

  it('gibt 500 zurück wenn STRIPE_PRICE_* nicht konfiguriert ist', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    // STRIPE_PRICE_STARTER not set
    const res = mockRes();
    await handler(mockReq({ query: { plan: 'starter' } }), res);
    assert.equal(res.statusCode, 500);
    assert.ok(res.body.error.includes('STRIPE_PRICE_STARTER'));
  });
});

describe('stripe-checkout – Stripe-Integration (gemockt)', () => {
  it('leitet mit 302 auf Stripe-Checkout-URL weiter', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    process.env.STRIPE_PRICE_STARTER = 'price_starter123';
    const checkoutUrl = 'https://checkout.stripe.com/pay/cs_test_abc';

    globalThis.fetch = async (url, opts) => {
      assert.ok(url.includes('stripe.com'));
      const body = opts.body;
      assert.ok(body.includes('price_starter123'));
      assert.ok(body.includes('metadata%5Bplan%5D=starter'));
      assert.ok(!body.includes('automatic_payment_methods'));
      return { ok: true, json: async () => ({ url: checkoutUrl }) };
    };

    const res = mockRes();
    await handler(mockReq({ query: { plan: 'starter' } }), res);
    assert.equal(res.statusCode, 302);
    assert.equal(res.headers['Location'], checkoutUrl);
  });

  it('gibt 502 zurück bei Netzwerkfehler zur Stripe-API', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    process.env.STRIPE_PRICE_PRO = 'price_pro123';
    globalThis.fetch = async () => { throw new Error('ECONNREFUSED'); };

    const res = mockRes();
    await handler(mockReq({ query: { plan: 'pro' } }), res);
    assert.equal(res.statusCode, 502);
    assert.ok(res.body.error.includes('Stripe'));
  });

  it('akzeptiert plan über query.model-Parameter (Rückwärtskompatibilität)', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    process.env.STRIPE_PRICE_MAX = 'price_max123';

    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({ url: 'https://checkout.stripe.com/pay/cs_test_max' }),
    });

    const res = mockRes();
    await handler(mockReq({ query: { model: 'max' } }), res);
    assert.equal(res.statusCode, 302);
  });
});
