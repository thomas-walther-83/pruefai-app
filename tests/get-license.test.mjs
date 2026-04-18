/**
 * Tests für api/get-license.js
 *
 * Verwendet Node.js built-in test runner (node:test) – keine externen Abhängigkeiten.
 * Ausführen: node --test tests/get-license.test.mjs
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';

const { default: handler } = await import('../api/get-license.js');

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
    method:  opts.method  ?? 'GET',
    headers: opts.headers ?? {},
    query:   opts.query   ?? {},
    body:    opts.body    ?? {},
    socket:  { remoteAddress: '127.0.0.1' },
  };
}

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.STRIPE_SECRET_KEY;
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('get-license – Methoden-Validierung', () => {
  it('gibt 405 zurück für POST', async () => {
    const res = mockRes();
    await handler(mockReq({ method: 'POST' }), res);
    assert.equal(res.statusCode, 405);
  });
});

describe('get-license – Eingabe-Validierung', () => {
  it('gibt 400 zurück wenn session_id fehlt', async () => {
    const res = mockRes();
    await handler(mockReq({ query: {} }), res);
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.error.includes('session_id'));
  });

  it('gibt 400 zurück wenn session_id nicht mit cs_ beginnt', async () => {
    const res = mockRes();
    await handler(mockReq({ query: { session_id: 'invalid_session' } }), res);
    assert.equal(res.statusCode, 400);
  });

  it('gibt 500 zurück wenn STRIPE_SECRET_KEY fehlt', async () => {
    const res = mockRes();
    await handler(mockReq({ query: { session_id: 'cs_test_abc123' } }), res);
    assert.equal(res.statusCode, 500);
    assert.ok(res.body.error.includes('STRIPE_SECRET_KEY'));
  });
});

describe('get-license – Stripe-Integration (gemockt)', () => {
  it('gibt Lizenzschlüssel und Plan für gültige Session zurück', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    const licenseKey = '550e8400-e29b-41d4-a716-446655440000';

    globalThis.fetch = async (url) => {
      if (url.includes('/v1/checkout/sessions/cs_test_abc')) {
        return {
          ok: true,
          json: async () => ({ customer: 'cus_abc123', metadata: { plan: 'pro' } }),
        };
      }
      if (url.includes('/v1/customers/cus_abc123')) {
        return {
          ok: true,
          json: async () => ({
            metadata: { license_key: licenseKey, plan: 'pro' },
          }),
        };
      }
      return { ok: true, json: async () => ({}) };
    };

    const res = mockRes();
    await handler(mockReq({ query: { session_id: 'cs_test_abc' } }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.licenseKey, licenseKey);
    assert.equal(res.body.plan, 'pro');
  });

  it('zeigt "max" als Plan an wenn interner Plan "schule" ist', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';

    globalThis.fetch = async (url) => {
      if (url.includes('/v1/checkout/sessions/')) {
        return {
          ok: true,
          json: async () => ({ customer: 'cus_schule', metadata: {} }),
        };
      }
      return {
        ok: true,
        json: async () => ({
          metadata: { license_key: '550e8400-e29b-41d4-a716-446655440001', plan: 'schule' },
        }),
      };
    };

    const res = mockRes();
    await handler(mockReq({ query: { session_id: 'cs_test_schule' } }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.plan, 'max');
  });

  it('gibt 404 zurück wenn Session keinen Kunden hat', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';

    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({ metadata: {} }), // no customer field
    });

    const res = mockRes();
    await handler(mockReq({ query: { session_id: 'cs_test_nocust' } }), res);
    assert.equal(res.statusCode, 404);
  });

  it('gibt 502 zurück bei Netzwerkfehler', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    globalThis.fetch = async () => { throw new Error('ECONNREFUSED'); };

    const res = mockRes();
    await handler(mockReq({ query: { session_id: 'cs_test_fail' } }), res);
    assert.equal(res.statusCode, 502);
    assert.ok(res.body.error.includes('Stripe'));
  });
});
