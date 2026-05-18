/**
 * Tests für api/admin-revoke.js
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';

const { default: handler } = await import('../api/admin-revoke.js');

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
    method: opts.method ?? 'POST',
    headers: opts.headers ?? {},
    body:    opts.body    ?? {},
    socket:  { remoteAddress: '127.0.0.1' },
  };
}

const VALID_KEY = '12345678-1234-4123-8123-123456789abc';
const ADMIN_TOKEN = 'super-secret-admin-token-123';

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.ADMIN_TOKEN;
  delete process.env.STRIPE_SECRET_KEY;
});

describe('admin-revoke – Methoden & Auth', () => {
  it('gibt 405 für GET', async () => {
    const res = mockRes();
    await handler(mockReq({ method: 'GET' }), res);
    assert.equal(res.statusCode, 405);
  });

  it('gibt 503 wenn ADMIN_TOKEN nicht konfiguriert', async () => {
    const res = mockRes();
    await handler(mockReq({ body: { license_key: VALID_KEY } }), res);
    assert.equal(res.statusCode, 503);
  });

  it('gibt 401 ohne X-Admin-Token Header', async () => {
    process.env.ADMIN_TOKEN = ADMIN_TOKEN;
    const res = mockRes();
    await handler(mockReq({ body: { license_key: VALID_KEY } }), res);
    assert.equal(res.statusCode, 401);
  });

  it('gibt 401 mit falschem Admin-Token', async () => {
    process.env.ADMIN_TOKEN = ADMIN_TOKEN;
    const res = mockRes();
    await handler(mockReq({
      headers: { 'x-admin-token': 'wrong-token-zzz-with-same-len' },
      body: { license_key: VALID_KEY },
    }), res);
    assert.equal(res.statusCode, 401);
  });

  it('gibt 500 wenn STRIPE_SECRET_KEY fehlt', async () => {
    process.env.ADMIN_TOKEN = ADMIN_TOKEN;
    const res = mockRes();
    await handler(mockReq({
      headers: { 'x-admin-token': ADMIN_TOKEN },
      body: { license_key: VALID_KEY },
    }), res);
    assert.equal(res.statusCode, 500);
  });

  it('gibt 400 bei ungültigem license_key-Format', async () => {
    process.env.ADMIN_TOKEN = ADMIN_TOKEN;
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
    const res = mockRes();
    await handler(mockReq({
      headers: { 'x-admin-token': ADMIN_TOKEN },
      body: { license_key: 'not-a-uuid' },
    }), res);
    assert.equal(res.statusCode, 400);
  });
});

describe('admin-revoke – Stripe-Integration', () => {
  it('gibt 404 wenn kein Customer für License-Key existiert', async () => {
    process.env.ADMIN_TOKEN = ADMIN_TOKEN;
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ data: [] }) });

    const res = mockRes();
    await handler(mockReq({
      headers: { 'x-admin-token': ADMIN_TOKEN },
      body: { license_key: VALID_KEY },
    }), res);
    assert.equal(res.statusCode, 404);
  });

  it('setzt revoked=true wenn Customer gefunden wird', async () => {
    process.env.ADMIN_TOKEN = ADMIN_TOKEN;
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
    let postBody = null;
    globalThis.fetch = async (url, opts) => {
      if (url.includes('customers/search')) {
        return { ok: true, json: async () => ({ data: [{ id: 'cus_revoke_test' }] }) };
      }
      if (url.includes('/v1/customers/cus_revoke_test') && opts?.method === 'POST') {
        postBody = Object.fromEntries(new URLSearchParams(opts.body));
      }
      return { ok: true, json: async () => ({}) };
    };

    const res = mockRes();
    await handler(mockReq({
      headers: { 'x-admin-token': ADMIN_TOKEN },
      body: { license_key: VALID_KEY, reason: 'leaked-on-github' },
    }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.revoked, true);
    assert.equal(res.body.customer_id, 'cus_revoke_test');
    assert.equal(postBody['metadata[revoked]'], 'true');
    assert.equal(postBody['metadata[revoked_reason]'], 'leaked-on-github');
    assert.ok(postBody['metadata[revoked_at]']);
  });

  it('action=restore setzt revoked auf leeren String', async () => {
    process.env.ADMIN_TOKEN = ADMIN_TOKEN;
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
    let postBody = null;
    globalThis.fetch = async (url, opts) => {
      if (url.includes('customers/search')) {
        return { ok: true, json: async () => ({ data: [{ id: 'cus_restore' }] }) };
      }
      if (opts?.method === 'POST') postBody = Object.fromEntries(new URLSearchParams(opts.body));
      return { ok: true, json: async () => ({}) };
    };

    const res = mockRes();
    await handler(mockReq({
      headers: { 'x-admin-token': ADMIN_TOKEN },
      body: { license_key: VALID_KEY, action: 'restore' },
    }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.revoked, false);
    assert.equal(postBody['metadata[revoked]'], '');
    assert.ok(postBody['metadata[restored_at]']);
  });
});
