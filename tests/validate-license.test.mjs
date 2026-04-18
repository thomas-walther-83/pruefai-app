/**
 * Tests für api/validate-license.js
 *
 * Verwendet Node.js built-in test runner (node:test) – keine externen Abhängigkeiten.
 * Ausführen: node --test tests/validate-license.test.mjs
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

process.env.ALLOWED_ORIGINS = '';
// STRIPE_SECRET_KEY wird im Handler gelesen – kann zwischen Tests gesetzt werden

const { default: handler } = await import('../api/validate-license.js');

// ── Hilfsfunktionen ──────────────────────────────────────────────────────────

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

// Gültige UUID v4 und Schulcode für Format-Tests (kein echter Stripe-Aufruf benötigt)
const VALID_LICENSE_KEY = '123e4567-e89b-42d3-a456-426614174000';
const VALID_SCHUL_CODE  = 'SCHULE-AABBCCDDEEFF';

// ── Fetch-Mock zurücksetzen ──────────────────────────────────────────────────
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.STRIPE_SECRET_KEY;
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('validate-license – HTTP-Methoden', () => {
  it('gibt 405 zurück für GET', async () => {
    const res = mockRes();
    await handler(mockReq({ method: 'GET' }), res);
    assert.equal(res.statusCode, 405);
  });

  it('antwortet mit 204 auf OPTIONS', async () => {
    const res = mockRes();
    await handler(mockReq({ method: 'OPTIONS' }), res);
    assert.equal(res.statusCode, 204);
  });
});

describe('validate-license – Eingabe-Validierung', () => {
  it('gibt 400 wenn weder license_key noch schul_code übergeben wird', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    const res = mockRes();
    await handler(mockReq({ body: {} }), res);
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.error);
  });

  it('gibt 400 wenn license_key UND schul_code gleichzeitig übergeben werden', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    const res = mockRes();
    await handler(mockReq({ body: { license_key: VALID_LICENSE_KEY, schul_code: VALID_SCHUL_CODE } }), res);
    assert.equal(res.statusCode, 400);
  });

  it('gibt 200 {valid:false} für ungültiges license_key-Format', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    const res = mockRes();
    await handler(mockReq({ body: { license_key: 'kein-gueltiger-key' } }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.valid, false);
  });

  it('gibt 200 {valid:false} für ungültiges schul_code-Format', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    const res = mockRes();
    await handler(mockReq({ body: { schul_code: 'FALSCH-FORMAT' } }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.valid, false);
  });

  it('gibt 500 wenn STRIPE_SECRET_KEY fehlt', async () => {
    // STRIPE_SECRET_KEY nicht gesetzt
    const res = mockRes();
    await handler(mockReq({ body: { license_key: VALID_LICENSE_KEY } }), res);
    assert.equal(res.statusCode, 500);
    assert.ok(res.body.error.includes('STRIPE_SECRET_KEY'));
  });
});

describe('validate-license – Stripe-Integration (gemockt)', () => {
  it('gibt 200 {valid:false} wenn kein Stripe-Kunde gefunden', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const res = mockRes();
    await handler(mockReq({ body: { license_key: VALID_LICENSE_KEY } }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.valid, false);
  });

  it('gibt gültige Planbeschreibung zurück für bekannten Pro-Kunden', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    const today = new Date().toISOString().slice(0, 10);
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({
        data: [{
          id: 'cus_test123',
          metadata: {
            plan: 'pro',
            corrections_this_month: '42',
            corrections_reset_date: today,
          },
        }],
      }),
    });

    const res = mockRes();
    await handler(mockReq({ body: { license_key: VALID_LICENSE_KEY } }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.valid, true);
    assert.equal(res.body.plan, 'pro');
    assert.equal(res.body.corrections_this_month, 42);
    assert.equal(res.body.limit, 300);
    assert.equal(res.body.corrections_remaining, 258);
  });

  it('gibt gültige Planbeschreibung zurück für Starter-Plan', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    const today = new Date().toISOString().slice(0, 10);
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({
        data: [{
          id: 'cus_starter',
          metadata: {
            plan: 'starter',
            corrections_this_month: '10',
            corrections_reset_date: today,
          },
        }],
      }),
    });

    const res = mockRes();
    await handler(mockReq({ body: { license_key: VALID_LICENSE_KEY } }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.valid, true);
    assert.equal(res.body.plan, 'starter');
    assert.equal(res.body.limit, 50);
  });

  it('zeigt "max" als Plan an wenn interner Plan "schule" ist (Rückwärtskompatibilität)', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    const today = new Date().toISOString().slice(0, 10);
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({
        data: [{
          id: 'cus_schule',
          metadata: {
            plan: 'schule',
            corrections_this_month: '0',
            corrections_reset_date: today,
          },
        }],
      }),
    });

    const res = mockRes();
    await handler(mockReq({ body: { license_key: VALID_LICENSE_KEY } }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.valid, true);
    assert.equal(res.body.plan, 'max');
    assert.equal(res.body.limit, 99999);
  });

  it('gibt 200 {valid:false} für Kunden ohne aktiven Plan', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({
        data: [{ id: 'cus_noplan', metadata: { plan: 'none' } }],
      }),
    });

    const res = mockRes();
    await handler(mockReq({ body: { license_key: VALID_LICENSE_KEY } }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.valid, false);
  });

  it('setzt Korrekturen zurück und gibt korrektes Limit zurück wenn Monat gewechselt hat', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    const lastMonth = new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    globalThis.fetch = async (url, opts) => {
      // Erster Aufruf: customer search; zweiter Aufruf: metadata update (falls nötig)
      if (!opts || opts.method !== 'POST') {
        return {
          ok: true,
          json: async () => ({
            data: [{
              id: 'cus_oldmonth',
              metadata: {
                plan: 'pro',
                corrections_this_month: '250',
                corrections_reset_date: lastMonth,
              },
            }],
          }),
        };
      }
      return { ok: true, json: async () => ({}) };
    };

    const res = mockRes();
    await handler(mockReq({ body: { license_key: VALID_LICENSE_KEY } }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.valid, true);
    // Nach Reset muss corrections_this_month = 0 sein
    assert.equal(res.body.corrections_this_month, 0);
    assert.equal(res.body.corrections_remaining, 300);
  });

  it('gibt 502 bei Stripe-API-Fehler zurück', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    globalThis.fetch = async () => {
      throw new Error('Netzwerkfehler');
    };

    const res = mockRes();
    await handler(mockReq({ body: { license_key: VALID_LICENSE_KEY } }), res);
    assert.equal(res.statusCode, 502);
    assert.ok(res.body.error.includes('Stripe'));
  });
});
