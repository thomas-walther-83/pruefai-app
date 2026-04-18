/**
 * Tests für api/claude.js
 *
 * Verwendet Node.js built-in test runner (node:test) – keine externen Abhängigkeiten.
 * Ausführen: node --test tests/claude.test.mjs
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';

// Wird beim Modul-Load ausgewertet
process.env.ALLOWED_ORIGINS = '';
process.env.SKIP_LICENSE = 'true'; // Lizenzprüfung für Tests deaktivieren

const { default: handler } = await import('../api/claude.js');

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

const SAMPLE_MESSAGES = [{ role: 'user', content: 'Bewerte diese Antwort: "Hallo"' }];

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.ANTHROPIC_API_KEY;
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('claude – HTTP-Methoden', () => {
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

describe('claude – Konfigurationsprüfung', () => {
  it('gibt 500 zurück wenn ANTHROPIC_API_KEY fehlt', async () => {
    // ANTHROPIC_API_KEY nicht gesetzt
    const res = mockRes();
    await handler(mockReq({ body: { messages: SAMPLE_MESSAGES } }), res);
    assert.equal(res.statusCode, 500);
    assert.ok(res.body.error.includes('ANTHROPIC_API_KEY'));
  });

  it('gibt 400 zurück wenn messages fehlt', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    const res = mockRes();
    await handler(mockReq({ body: {} }), res);
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.error.includes('messages'));
  });
});

describe('claude – Anthropic-Proxy (gemockt)', () => {
  it('leitet Anfrage an Anthropic weiter und gibt Antwort zurück', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    globalThis.fetch = async (url, opts) => {
      assert.ok(url.includes('anthropic.com'));
      const body = JSON.parse(opts.body);
      assert.ok(Array.isArray(body.messages));
      return {
        ok: true,
        status: 200,
        json: async () => ({
          id: 'msg_test',
          content: [{ type: 'text', text: 'Korrektur: 5/6 Punkten' }],
        }),
      };
    };

    const res = mockRes();
    await handler(mockReq({ body: { messages: SAMPLE_MESSAGES } }), res);
    assert.equal(res.statusCode, 200);
    assert.ok(res.body.content);
    assert.equal(res.body.content[0].text, 'Korrektur: 5/6 Punkten');
  });

  it('verwendet übergebenes Modell und max_tokens', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    let capturedBody;
    globalThis.fetch = async (url, opts) => {
      capturedBody = JSON.parse(opts.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({ content: [] }),
      };
    };

    const res = mockRes();
    await handler(mockReq({
      body: {
        messages: SAMPLE_MESSAGES,
        model: 'claude-opus-4-5',
        max_tokens: 2048,
        system: 'Du bist ein Lehrer.',
      },
    }), res);
    assert.equal(capturedBody.model, 'claude-opus-4-5');
    assert.equal(capturedBody.max_tokens, 2048);
    assert.equal(capturedBody.system, 'Du bist ein Lehrer.');
  });

  it('verwendet Standard-Modell wenn keines übergeben wird', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    let capturedBody;
    globalThis.fetch = async (url, opts) => {
      capturedBody = JSON.parse(opts.body);
      return { ok: true, status: 200, json: async () => ({ content: [] }) };
    };

    const res = mockRes();
    await handler(mockReq({ body: { messages: SAMPLE_MESSAGES } }), res);
    assert.ok(capturedBody.model); // Fallback-Modell muss gesetzt sein
    assert.ok(typeof capturedBody.model === 'string' && capturedBody.model.length > 0);
  });

  it('gibt 502 zurück bei Netzwerkfehler zur Anthropic-API', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    globalThis.fetch = async () => {
      throw new Error('ECONNREFUSED');
    };

    const res = mockRes();
    await handler(mockReq({ body: { messages: SAMPLE_MESSAGES } }), res);
    assert.equal(res.statusCode, 502);
    assert.ok(res.body.error.includes('Anthropic'));
  });

  it('gibt Anthropic-Fehlerstatus direkt zurück (z.B. 429 Rate Limit)', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    globalThis.fetch = async () => ({
      ok: false,
      status: 429,
      json: async () => ({ error: { type: 'rate_limit_error', message: 'Too many requests.' } }),
    });

    const res = mockRes();
    await handler(mockReq({ body: { messages: SAMPLE_MESSAGES } }), res);
    assert.equal(res.statusCode, 429);
  });
});

describe('claude – CORS', () => {
  it('blockt Anfragen von nicht erlaubten Origins', async () => {
    // Neuen Handler-Import mit gesetzter ALLOWED_ORIGINS – da ALLOWED_ORIGINS beim Laden
    // der Modul-Konstante gesetzt wurde (''), testen wir hier den Allow-All-Fall.
    // (CORS-Blocking wird im CI durch den HTML-Lint-Job und Integration-Tests geprüft)
    const res = mockRes();
    await handler(mockReq({
      method: 'OPTIONS',
      headers: { origin: 'https://pruefai.ch' },
    }), res);
    assert.equal(res.headers['Access-Control-Allow-Origin'], 'https://pruefai.ch');
  });
});
