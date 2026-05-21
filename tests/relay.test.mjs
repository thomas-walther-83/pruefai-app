/**
 * Tests für api/relay.js
 *
 * Verwendet Node.js built-in test runner (node:test) – keine externen Abhängigkeiten.
 * Ausführen: node --test tests/relay.test.mjs
 *
 * relay.js spricht Upstash Redis über dessen HTTP-REST-API an. Für die Tests
 * wird `globalThis.fetch` durch einen In-Memory-Redis-Mock ersetzt, der die
 * benötigten Kommandos (LLEN, RPUSH, EXPIRE, LPOP) nachbildet.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

// Muss vor dem ersten import gesetzt werden (ALLOWED_ORIGINS wird beim Modul-Load gelesen)
process.env.ALLOWED_ORIGINS = '';
process.env.KV_REST_API_URL = 'https://mock.upstash.io';
process.env.KV_REST_API_TOKEN = 'mock-token';

// ── In-Memory-Redis-Mock ─────────────────────────────────────────────────────

function installRedisMock() {
  const store = new Map(); // key -> string[]

  function exec(cmd) {
    const op = String(cmd[0]).toUpperCase();
    const key = cmd[1];
    if (op === 'LLEN') return (store.get(key) || []).length;
    if (op === 'RPUSH') {
      const arr = store.get(key) || [];
      for (let i = 2; i < cmd.length; i++) arr.push(cmd[i]);
      store.set(key, arr);
      return arr.length;
    }
    if (op === 'EXPIRE') return store.has(key) ? 1 : 0;
    if (op === 'LPOP') {
      const arr = store.get(key) || [];
      if (!arr.length) return null;
      const hasCount = cmd[2] != null;
      const count = hasCount ? Number(cmd[2]) : 1;
      const out = arr.splice(0, count);
      if (!arr.length) store.delete(key);
      return hasCount ? out : out[0];
    }
    throw new Error('Mock: unsupported command ' + op);
  }

  globalThis.fetch = async function fetchMock(url, opts) {
    const payload = JSON.parse(opts.body);
    const result = String(url).endsWith('/pipeline')
      ? payload.map(c => ({ result: exec(c) }))
      : { result: exec(payload) };
    return { ok: true, status: 200, json: async () => result };
  };
}

installRedisMock();

const { default: handler } = await import('../api/relay.js');

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
    method:  opts.method  ?? 'GET',
    headers: opts.headers ?? {},
    query:   opts.query   ?? {},
    body:    opts.body    ?? {},
    socket:  { remoteAddress: '127.0.0.1' },
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('relay – Token-Validierung', () => {
  it('gibt 400 zurück bei fehlendem Token', async () => {
    const res = mockRes();
    await handler(mockReq({ query: {} }), res);
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.error);
  });

  it('gibt 400 zurück bei ungültigem Token-Format', async () => {
    const res = mockRes();
    await handler(mockReq({ query: { t: 'kein-uuid' } }), res);
    assert.equal(res.statusCode, 400);
  });

  it('gibt 400 zurück bei leerem Token-String', async () => {
    const res = mockRes();
    await handler(mockReq({ query: { t: '' } }), res);
    assert.equal(res.statusCode, 400);
  });
});

describe('relay – HTTP-Methoden', () => {
  it('antwortet mit 204 auf OPTIONS', async () => {
    const res = mockRes();
    await handler(mockReq({ method: 'OPTIONS', query: { t: randomUUID() } }), res);
    assert.equal(res.statusCode, 204);
  });

  it('gibt 405 zurück für nicht unterstützte Methode (PUT)', async () => {
    const res = mockRes();
    await handler(mockReq({ method: 'PUT', query: { t: randomUUID() } }), res);
    assert.equal(res.statusCode, 405);
  });

  it('gibt 405 zurück für DELETE', async () => {
    const res = mockRes();
    await handler(mockReq({ method: 'DELETE', query: { t: randomUUID() } }), res);
    assert.equal(res.statusCode, 405);
  });
});

describe('relay – Storage-Konfiguration', () => {
  it('gibt 503 zurück, wenn keine Redis-Zugangsdaten gesetzt sind', async () => {
    const savedUrl = process.env.KV_REST_API_URL;
    const savedTok = process.env.KV_REST_API_TOKEN;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    const res = mockRes();
    await handler(mockReq({ method: 'GET', query: { t: randomUUID() } }), res);
    assert.equal(res.statusCode, 503);
    process.env.KV_REST_API_URL = savedUrl;
    process.env.KV_REST_API_TOKEN = savedTok;
  });

  it('erkennt Redis-Zugangsdaten auch mit projektspezifischem Präfix', async () => {
    const savedUrl = process.env.KV_REST_API_URL;
    const savedTok = process.env.KV_REST_API_TOKEN;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    process.env.MYSTORE_KV_REST_API_URL = 'https://prefixed.upstash.io';
    process.env.MYSTORE_KV_REST_API_TOKEN = 'prefixed-token';
    const res = mockRes();
    await handler(mockReq({ method: 'GET', query: { t: randomUUID() } }), res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { photos: [] });
    delete process.env.MYSTORE_KV_REST_API_URL;
    delete process.env.MYSTORE_KV_REST_API_TOKEN;
    process.env.KV_REST_API_URL = savedUrl;
    process.env.KV_REST_API_TOKEN = savedTok;
  });
});

describe('relay – GET (Foto-Abruf)', () => {
  it('gibt leere Liste zurück für unbekannten Token', async () => {
    const res = mockRes();
    await handler(mockReq({ method: 'GET', query: { t: randomUUID() } }), res);
    assert.deepEqual(res.body, { photos: [] });
  });
});

describe('relay – POST (Foto-Upload)', () => {
  it('gibt 400 zurück wenn body.data fehlt', async () => {
    const res = mockRes();
    await handler(mockReq({ method: 'POST', query: { t: randomUUID() }, body: {} }), res);
    assert.equal(res.statusCode, 400);
  });

  it('gibt 400 zurück wenn data kein data:-URI ist', async () => {
    const res = mockRes();
    await handler(mockReq({ method: 'POST', query: { t: randomUUID() }, body: { data: 'no-data-uri' } }), res);
    assert.equal(res.statusCode, 400);
  });

  it('gibt 413 zurück für zu grosses Foto', async () => {
    const bigData = 'data:image/jpeg;base64,' + 'A'.repeat(6 * 1024 * 1024 + 1);
    const res = mockRes();
    await handler(mockReq({ method: 'POST', query: { t: randomUUID() }, body: { data: bigData } }), res);
    assert.equal(res.statusCode, 413);
  });

  it('speichert ein gültiges Foto erfolgreich', async () => {
    const token = randomUUID();
    const res = mockRes();
    await handler(mockReq({
      method: 'POST',
      query: { t: token },
      body: { data: 'data:image/jpeg;base64,/9j/abc123', mime: 'image/jpeg' },
    }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.total, 1);
  });

  it('akzeptiert nur MIME-Types mit image/-Präfix; Fallback auf image/jpeg', async () => {
    const token = randomUUID();
    await handler(mockReq({
      method: 'POST',
      query: { t: token },
      body: { data: 'data:image/png;base64,abc', mime: 'application/octet-stream' },
    }), mockRes());

    const getRes = mockRes();
    await handler(mockReq({ method: 'GET', query: { t: token } }), getRes);
    assert.equal(getRes.body.photos[0].mime, 'image/jpeg');
  });
});

describe('relay – GET nach POST (Round-trip)', () => {
  it('gibt gespeichertes Foto zurück und leert die Queue', async () => {
    const token = randomUUID();
    const photoData = 'data:image/jpeg;base64,/9j/testdata';

    await handler(mockReq({
      method: 'POST',
      query: { t: token },
      body: { data: photoData, mime: 'image/jpeg' },
    }), mockRes());

    const getRes1 = mockRes();
    await handler(mockReq({ method: 'GET', query: { t: token } }), getRes1);
    assert.equal(getRes1.body.photos.length, 1);
    assert.equal(getRes1.body.photos[0].data, photoData);

    // Queue muss nach dem ersten GET geleert sein
    const getRes2 = mockRes();
    await handler(mockReq({ method: 'GET', query: { t: token } }), getRes2);
    assert.deepEqual(getRes2.body.photos, []);
  });

  it('liefert Fotos in Batches von max. 3 pro GET', async () => {
    const token = randomUUID();
    for (let i = 0; i < 5; i++) {
      await handler(mockReq({
        method: 'POST',
        query: { t: token },
        body: { data: `data:image/jpeg;base64,img${i}`, mime: 'image/jpeg' },
      }), mockRes());
    }

    const getRes1 = mockRes();
    await handler(mockReq({ method: 'GET', query: { t: token } }), getRes1);
    assert.equal(getRes1.body.photos.length, 3);

    const getRes2 = mockRes();
    await handler(mockReq({ method: 'GET', query: { t: token } }), getRes2);
    assert.equal(getRes2.body.photos.length, 2);
  });

  it('gibt 429 zurück wenn mehr als 30 Fotos hochgeladen werden', async () => {
    const token = randomUUID();
    let lastRes;
    for (let i = 0; i <= 30; i++) {
      lastRes = mockRes();
      await handler(mockReq({
        method: 'POST',
        query: { t: token },
        body: { data: 'data:image/jpeg;base64,x', mime: 'image/jpeg' },
      }), lastRes);
    }
    assert.equal(lastRes.statusCode, 429);
  });
});

describe('relay – CORS', () => {
  it('gibt Origin-Header zurück wenn ALLOWED_ORIGINS leer (allow all)', async () => {
    const res = mockRes();
    await handler(mockReq({
      method: 'GET',
      query: { t: randomUUID() },
      headers: { origin: 'https://trusted.pruefai.ch' },
    }), res);
    assert.equal(res.headers['Access-Control-Allow-Origin'], 'https://trusted.pruefai.ch');
  });
});
