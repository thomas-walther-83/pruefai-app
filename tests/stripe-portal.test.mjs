/**
 * Tests für api/stripe-portal.js
 *
 * Verwendet Node.js built-in test runner (node:test) – keine externen Abhängigkeiten.
 * Ausführen: node --test tests/stripe-portal.test.mjs
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';

// Wird beim Modul-Load gelesen
process.env.ALLOWED_ORIGINS = '';

const { default: handler } = await import('../api/stripe-portal.js');

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
    method:  opts.method  ?? 'POST',
    headers: opts.headers ?? {},
    query:   opts.query   ?? {},
    body:    opts.body    ?? {},
    socket:  { remoteAddress: '127.0.0.1' },
  };
}

const SAMPLE_LICENSE_KEY = '123e4567-e89b-42d3-a456-426614174000';

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.STRIPE_SECRET_KEY;
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('stripe-portal – Methoden-Validierung', () => {
  it('antwortet mit 204 auf OPTIONS', async () => {
    const res = mockRes();
    await handler(mockReq({ method: 'OPTIONS' }), res);
    assert.equal(res.statusCode, 204);
  });

  it('gibt 405 zurück für GET', async () => {
    const res = mockRes();
    await handler(mockReq({ method: 'GET' }), res);
    assert.equal(res.statusCode, 405);
  });
});

describe('stripe-portal – Eingabe-Validierung', () => {
  it('gibt 400 zurück wenn license_key fehlt', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    const res = mockRes();
    await handler(mockReq({ body: {} }), res);
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.error.includes('license_key'));
  });

  it('gibt 400 zurück bei ungültigem license_key-Format', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    const res = mockRes();
    await handler(mockReq({ body: { license_key: 'kein-gueltiger-key' } }), res);
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.error.toLowerCase().includes('format') || res.body.error.toLowerCase().includes('invalid'));
  });

  it('gibt 500 zurück wenn STRIPE_SECRET_KEY fehlt', async () => {
    const res = mockRes();
    await handler(mockReq({ body: { license_key: SAMPLE_LICENSE_KEY } }), res);
    assert.equal(res.statusCode, 500);
    assert.ok(res.body.error.includes('STRIPE_SECRET_KEY'));
  });
});

describe('stripe-portal – Stripe-Integration (gemockt)', () => {
  it('gibt 404 zurück wenn kein Stripe-Kunde gefunden', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const res = mockRes();
    await handler(mockReq({ body: { license_key: SAMPLE_LICENSE_KEY } }), res);
    assert.equal(res.statusCode, 404);
    assert.ok(res.body.error.toLowerCase().includes('customer') || res.body.error.toLowerCase().includes('kunden'));
  });

  it('gibt Portal-URL zurück für gültigen Lizenzschlüssel', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    const portalUrl = 'https://billing.stripe.com/session/bps_test_123';

    globalThis.fetch = async (url, opts) => {
      // Erster Aufruf: Stripe-Kundensuche
      if (url.includes('/v1/customers/search')) {
        return {
          ok: true,
          json: async () => ({ data: [{ id: 'cus_portal123' }] }),
        };
      }
      // Zweiter Aufruf: Billing-Portal-Session erstellen
      if (url.includes('/v1/billing_portal/sessions')) {
        const body = opts?.body || '';
        assert.ok(body.includes('cus_portal123'), 'Kunden-ID muss übergeben werden');
        return {
          ok: true,
          json: async () => ({ url: portalUrl }),
        };
      }
      return { ok: true, json: async () => ({}) };
    };

    const res = mockRes();
    await handler(mockReq({ body: { license_key: SAMPLE_LICENSE_KEY } }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.url, portalUrl);
  });

  it('gibt 502 zurück bei Netzwerkfehler zur Stripe-API', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    globalThis.fetch = async () => { throw new Error('Netzwerkfehler'); };

    const res = mockRes();
    await handler(mockReq({ body: { license_key: SAMPLE_LICENSE_KEY } }), res);
    assert.equal(res.statusCode, 502);
    assert.ok(res.body.error.includes('Stripe'));
  });
});
