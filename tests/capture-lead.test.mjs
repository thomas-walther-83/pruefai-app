/**
 * Tests für api/capture-lead.js
 *
 * Verwendet Node.js built-in test runner (node:test) – keine externen Abhängigkeiten.
 * Ausführen: node --test tests/capture-lead.test.mjs
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';

const { default: handler } = await import('../api/capture-lead.js');

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

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

function mockReq(opts = {}) {
  return {
    method:  opts.method  ?? 'POST',
    headers: opts.headers ?? {},
    query:   opts.query   ?? {},
    body:    opts.body    ?? {},
    socket:  { remoteAddress: '127.0.0.1' },
  };
}

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.RESEND_API_KEY;
  delete process.env.ADMIN_EMAIL;
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('capture-lead – Methoden-Validierung', () => {
  it('gibt 405 zurück für GET', async () => {
    const res = mockRes();
    await handler(mockReq({ method: 'GET' }), res);
    assert.equal(res.statusCode, 405);
  });
});

describe('capture-lead – Eingabe-Validierung', () => {
  it('gibt 400 zurück bei fehlendem E-Mail', async () => {
    const res = mockRes();
    await handler(mockReq({ body: { name: 'Test' } }), res);
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.error);
  });

  it('gibt 400 zurück bei ungültigem E-Mail-Format (kein @)', async () => {
    const res = mockRes();
    await handler(mockReq({ body: { email: 'keineatadresse' } }), res);
    assert.equal(res.statusCode, 400);
  });
});

describe('capture-lead – E-Mail-Versand', () => {
  it('gibt 200 ok zurück ohne RESEND_API_KEY (überspringt E-Mails)', async () => {
    // Kein RESEND_API_KEY – E-Mails werden still übersprungen
    const res = mockRes();
    await handler(mockReq({ body: { email: 'lead@example.com', name: 'Max Muster' } }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
  });

  it('sendet Willkommens-E-Mail und Admin-Benachrichtigung mit RESEND_API_KEY', async () => {
    process.env.RESEND_API_KEY = 'resend_test_key';
    process.env.ADMIN_EMAIL = 'admin@pruefai.ch';

    const sentEmails = [];
    globalThis.fetch = async (url, opts) => {
      if (url.includes('resend.com')) {
        const body = JSON.parse(opts.body);
        sentEmails.push(body);
      }
      return { ok: true, json: async () => ({ id: 'email_id_123' }) };
    };

    const res = mockRes();
    await handler(mockReq({ body: { email: 'lead@example.com', name: 'Max Muster' } }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
    // Welcome email (to lead) + admin notification
    assert.equal(sentEmails.length, 2);
    assert.deepEqual(sentEmails[0].to, ['lead@example.com']);
    assert.deepEqual(sentEmails[1].to, ['admin@pruefai.ch']);
  });

  it('behandelt HTML-Sonderzeichen im Namen sicher (kein XSS)', async () => {
    process.env.RESEND_API_KEY = 'resend_test_key';
    const maliciousName = '<script>alert("xss")</script>';

    const sentEmails = [];
    globalThis.fetch = async (url, opts) => {
      if (url.includes('resend.com')) sentEmails.push(JSON.parse(opts.body));
      return { ok: true, json: async () => ({}) };
    };

    const res = mockRes();
    await handler(mockReq({ body: { email: 'safe@example.com', name: maliciousName } }), res);
    assert.equal(res.statusCode, 200);
    // HTML must be escaped – <script> must not appear literally in email body
    const html = sentEmails[0]?.html || '';
    assert.ok(!html.includes('<script>'), 'Unescaped <script> tag found in email HTML');
  });
});
