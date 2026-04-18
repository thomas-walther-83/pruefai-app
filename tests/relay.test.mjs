/**
 * Tests für api/relay.js
 *
 * Verwendet Node.js built-in test runner (node:test) – keine externen Abhängigkeiten.
 * Ausführen: node --test tests/relay.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

// Muss vor dem ersten import gesetzt werden (ALLOWED_ORIGINS wird beim Modul-Load gelesen)
process.env.ALLOWED_ORIGINS = '';

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
  it('gibt 400 zurück bei fehlendem Token', () => {
    const res = mockRes();
    handler(mockReq({ query: {} }), res);
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.error);
  });

  it('gibt 400 zurück bei ungültigem Token-Format', () => {
    const res = mockRes();
    handler(mockReq({ query: { t: 'kein-uuid' } }), res);
    assert.equal(res.statusCode, 400);
  });

  it('gibt 400 zurück bei leerem Token-String', () => {
    const res = mockRes();
    handler(mockReq({ query: { t: '' } }), res);
    assert.equal(res.statusCode, 400);
  });
});

describe('relay – HTTP-Methoden', () => {
  it('antwortet mit 204 auf OPTIONS', () => {
    const res = mockRes();
    handler(mockReq({ method: 'OPTIONS', query: { t: randomUUID() } }), res);
    assert.equal(res.statusCode, 204);
  });

  it('gibt 405 zurück für nicht unterstützte Methode (PUT)', () => {
    const res = mockRes();
    handler(mockReq({ method: 'PUT', query: { t: randomUUID() } }), res);
    assert.equal(res.statusCode, 405);
  });

  it('gibt 405 zurück für DELETE', () => {
    const res = mockRes();
    handler(mockReq({ method: 'DELETE', query: { t: randomUUID() } }), res);
    assert.equal(res.statusCode, 405);
  });
});

describe('relay – GET (Foto-Abruf)', () => {
  it('gibt leere Liste zurück für unbekannten Token', () => {
    const res = mockRes();
    handler(mockReq({ method: 'GET', query: { t: randomUUID() } }), res);
    assert.deepEqual(res.body, { photos: [] });
  });
});

describe('relay – POST (Foto-Upload)', () => {
  it('gibt 400 zurück wenn body.data fehlt', () => {
    const res = mockRes();
    handler(mockReq({ method: 'POST', query: { t: randomUUID() }, body: {} }), res);
    assert.equal(res.statusCode, 400);
  });

  it('gibt 400 zurück wenn data kein data:-URI ist', () => {
    const res = mockRes();
    handler(mockReq({ method: 'POST', query: { t: randomUUID() }, body: { data: 'no-data-uri' } }), res);
    assert.equal(res.statusCode, 400);
  });

  it('gibt 413 zurück für zu grosses Foto', () => {
    const bigData = 'data:image/jpeg;base64,' + 'A'.repeat(6 * 1024 * 1024 + 1);
    const res = mockRes();
    handler(mockReq({ method: 'POST', query: { t: randomUUID() }, body: { data: bigData } }), res);
    assert.equal(res.statusCode, 413);
  });

  it('speichert ein gültiges Foto erfolgreich', () => {
    const token = randomUUID();
    const res = mockRes();
    handler(mockReq({
      method: 'POST',
      query: { t: token },
      body: { data: 'data:image/jpeg;base64,/9j/abc123', mime: 'image/jpeg' },
    }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.total, 1);
  });

  it('akzeptiert nur MIME-Types mit image/-Präfix; Fallback auf image/jpeg', () => {
    const token = randomUUID();
    handler(mockReq({
      method: 'POST',
      query: { t: token },
      body: { data: 'data:image/png;base64,abc', mime: 'application/octet-stream' },
    }), mockRes());

    const getRes = mockRes();
    handler(mockReq({ method: 'GET', query: { t: token } }), getRes);
    assert.equal(getRes.body.photos[0].mime, 'image/jpeg');
  });
});

describe('relay – GET nach POST (Round-trip)', () => {
  it('gibt gespeichertes Foto zurück und leert die Queue', () => {
    const token = randomUUID();
    const photoData = 'data:image/jpeg;base64,/9j/testdata';

    handler(mockReq({
      method: 'POST',
      query: { t: token },
      body: { data: photoData, mime: 'image/jpeg' },
    }), mockRes());

    const getRes1 = mockRes();
    handler(mockReq({ method: 'GET', query: { t: token } }), getRes1);
    assert.equal(getRes1.body.photos.length, 1);
    assert.equal(getRes1.body.photos[0].data, photoData);

    // Queue muss nach dem ersten GET geleert sein
    const getRes2 = mockRes();
    handler(mockReq({ method: 'GET', query: { t: token } }), getRes2);
    assert.deepEqual(getRes2.body.photos, []);
  });

  it('akkumuliert mehrere Fotos bis zum GET', () => {
    const token = randomUUID();
    for (let i = 0; i < 3; i++) {
      handler(mockReq({
        method: 'POST',
        query: { t: token },
        body: { data: `data:image/jpeg;base64,img${i}`, mime: 'image/jpeg' },
      }), mockRes());
    }

    const getRes = mockRes();
    handler(mockReq({ method: 'GET', query: { t: token } }), getRes);
    assert.equal(getRes.body.photos.length, 3);
  });

  it('gibt 429 zurück wenn mehr als 30 Fotos hochgeladen werden', () => {
    const token = randomUUID();
    let lastRes;
    for (let i = 0; i <= 30; i++) {
      lastRes = mockRes();
      handler(mockReq({
        method: 'POST',
        query: { t: token },
        body: { data: 'data:image/jpeg;base64,x', mime: 'image/jpeg' },
      }), lastRes);
    }
    assert.equal(lastRes.statusCode, 429);
  });
});

describe('relay – CORS', () => {
  it('gibt Origin-Header zurück wenn ALLOWED_ORIGINS leer (allow all)', () => {
    const res = mockRes();
    handler(mockReq({
      method: 'GET',
      query: { t: randomUUID() },
      headers: { origin: 'https://trusted.pruefai.ch' },
    }), res);
    assert.equal(res.headers['Access-Control-Allow-Origin'], 'https://trusted.pruefai.ch');
  });
});
