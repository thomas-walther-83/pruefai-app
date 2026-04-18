/**
 * Tests für api/contact-enterprise.js
 *
 * Verwendet Node.js built-in test runner (node:test) – keine externen Abhängigkeiten.
 * Ausführen: node --test tests/contact-enterprise.test.mjs
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';

const { default: handler } = await import('../api/contact-enterprise.js');

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

const VALID_BODY = {
  institution: 'Berufsfachschule Zürich',
  email: 'kontakt@bfz.ch',
  name: 'Frau Muster',
  kanton: 'ZH',
  anzahl: '20',
  fachbereich: 'Technik',
  starttermin: '2026-09-01',
};

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.RESEND_API_KEY;
  delete process.env.ADMIN_EMAIL;
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('contact-enterprise – Methoden-Validierung', () => {
  it('gibt 405 zurück für GET', async () => {
    const res = mockRes();
    await handler(mockReq({ method: 'GET' }), res);
    assert.equal(res.statusCode, 405);
  });
});

describe('contact-enterprise – Eingabe-Validierung', () => {
  it('gibt 400 zurück bei fehlendem E-Mail', async () => {
    const res = mockRes();
    await handler(mockReq({ body: { institution: 'Test GmbH' } }), res);
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.error.toLowerCase().includes('e-mail') || res.body.error.toLowerCase().includes('email'));
  });

  it('gibt 400 zurück bei ungültigem E-Mail-Format', async () => {
    const res = mockRes();
    await handler(mockReq({ body: { ...VALID_BODY, email: 'keineatadresse' } }), res);
    assert.equal(res.statusCode, 400);
  });

  it('gibt 400 zurück wenn Institution fehlt', async () => {
    const res = mockRes();
    await handler(mockReq({ body: { email: 'test@example.com' } }), res);
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.error.toLowerCase().includes('institution'));
  });
});

describe('contact-enterprise – E-Mail-Versand', () => {
  it('gibt 200 ok zurück ohne RESEND_API_KEY (überspringt E-Mails)', async () => {
    // Kein RESEND_API_KEY – E-Mails werden still übersprungen
    const res = mockRes();
    await handler(mockReq({ body: VALID_BODY }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
  });

  it('sendet Admin-Benachrichtigung und Auto-Reply mit RESEND_API_KEY', async () => {
    process.env.RESEND_API_KEY = 'resend_test_key';
    process.env.ADMIN_EMAIL = 'admin@pruefai.ch';

    const sentEmails = [];
    globalThis.fetch = async (url, opts) => {
      if (url.includes('resend.com')) {
        sentEmails.push(JSON.parse(opts.body));
      }
      return { ok: true, json: async () => ({ id: 'email_id_456' }) };
    };

    const res = mockRes();
    await handler(mockReq({ body: VALID_BODY }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
    // Admin notification + Auto-reply to sender
    assert.equal(sentEmails.length, 2);

    // Admin-E-Mail enthält Institution
    const adminHtml = sentEmails[0].html;
    assert.ok(adminHtml.includes('Berufsfachschule Zürich'));
    assert.deepEqual(sentEmails[0].to, ['admin@pruefai.ch']);

    // Auto-Reply geht an den Anfragenden
    assert.deepEqual(sentEmails[1].to, ['kontakt@bfz.ch']);
  });

  it('behandelt HTML-Sonderzeichen in Formular-Feldern sicher (kein XSS)', async () => {
    process.env.RESEND_API_KEY = 'resend_test_key';

    const maliciousBody = {
      ...VALID_BODY,
      institution: '<img src=x onerror=alert(1)>',
      name: '<script>evil()</script>',
    };

    const sentEmails = [];
    globalThis.fetch = async (url, opts) => {
      if (url.includes('resend.com')) sentEmails.push(JSON.parse(opts.body));
      return { ok: true, json: async () => ({}) };
    };

    const res = mockRes();
    await handler(mockReq({ body: maliciousBody }), res);
    assert.equal(res.statusCode, 200);

    const adminHtml = sentEmails[0]?.html || '';
    assert.ok(!adminHtml.includes('<script>'), 'Unescaped <script> in Admin-E-Mail');
    assert.ok(!adminHtml.includes('<img src=x'), 'Unescaped <img> in Admin-E-Mail');
  });
});
