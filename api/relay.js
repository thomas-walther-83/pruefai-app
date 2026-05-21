// Photo relay for the mobile → PC QR-code upload flow.
//
// The mobile POST and the PC GET hit independent, stateless serverless
// invocations, so an in-memory store can never reliably hand a photo from one
// to the other (the previous implementation lost photos on every cold start or
// when the two requests landed on different instances). State now lives in
// Upstash Redis, reached over its HTTP REST API – no npm dependency required.
//
// Required environment variables (either naming scheme works – the Vercel
// "Upstash for Redis" integration provisions the KV_* pair automatically):
//   KV_REST_API_URL        / KV_REST_API_TOKEN
//   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const TTL_SECONDS = 10 * 60;                  // session lifetime, refreshed on every upload
const MAX_PHOTOS_PER_TOKEN = 30;
const MAX_PHOTO_B64_LEN = 1.5 * 1024 * 1024;  // data-URL length cap; the mobile client compresses well below this
const DRAIN_BATCH = 3;                        // photos handed to the PC per poll
const TOKEN_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const config = {
  api: { bodyParser: { sizeLimit: '5mb' } },
};

// Reads the Upstash REST credentials. Accepts the two standard naming schemes
// (Vercel KV and Upstash native) and, as a fallback, auto-detects any env-var
// pair that follows the REST naming convention — Vercel storage integrations
// sometimes assign a project-specific prefix (e.g. "<NAME>_KV_REST_API_URL").
function redisCreds() {
  const env = process.env;
  let url   = env.KV_REST_API_URL   || env.UPSTASH_REDIS_REST_URL   || '';
  let token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN || '';
  if (!url || !token) {
    for (const k of Object.keys(env)) {
      const v = env[k];
      if (!v) continue;
      if (!url   && /_REST_API_URL$|_REST_URL$/.test(k)     && /^https:\/\//.test(v)) url = v;
      if (!token && /_REST_API_TOKEN$|_REST_TOKEN$/.test(k) && !/READ_ONLY/.test(k))  token = v;
    }
  }
  return { url: url, token: token };
}

async function redisCall(path, payload) {
  const { url, token } = redisCreds();
  const r = await fetch(url.replace(/\/+$/, '') + path, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error('Redis HTTP ' + r.status);
  return r.json();
}

// Single Redis command, e.g. ['LLEN', key]
async function redis(command) {
  const json = await redisCall('', command);
  if (json && json.error) throw new Error(String(json.error));
  return json ? json.result : null;
}

// Several commands in one round trip; returns the array of results.
async function redisPipeline(commands) {
  const json = await redisCall('/pipeline', commands);
  if (!Array.isArray(json)) throw new Error('Unexpected pipeline response.');
  return json.map(x => (x && x.result));
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';

  if (origin && ALLOWED_ORIGINS.length > 0 && !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: 'Origin not allowed.' });
  }

  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') return res.status(204).end();

  const { t } = req.query;
  if (!t || typeof t !== 'string' || !TOKEN_RE.test(t)) {
    return res.status(400).json({ error: 'Invalid or missing token.' });
  }

  const { url, token } = redisCreds();
  if (!url || !token) {
    return res.status(503).json({ error: 'Relay storage not configured.' });
  }
  const key = 'relay:' + t.toLowerCase();

  try {
    // ── POST: mobile uploads one photo ──────────────────────────────────────
    if (req.method === 'POST') {
      const { data, mime } = req.body || {};
      if (typeof data !== 'string' || !data.startsWith('data:')) {
        return res.status(400).json({ error: 'Missing photo data.' });
      }
      if (data.length > MAX_PHOTO_B64_LEN) {
        return res.status(413).json({ error: 'Photo too large.' });
      }
      const safeMime = typeof mime === 'string' && mime.startsWith('image/') ? mime : 'image/jpeg';

      const count = Number(await redis(['LLEN', key])) || 0;
      if (count >= MAX_PHOTOS_PER_TOKEN) {
        return res.status(429).json({ error: 'Too many photos for this session.' });
      }
      const photo = JSON.stringify({ data: data, mime: safeMime });
      const [newLen] = await redisPipeline([
        ['RPUSH', key, photo],
        ['EXPIRE', key, String(TTL_SECONDS)],
      ]);
      return res.status(200).json({ ok: true, total: Number(newLen) || count + 1 });
    }

    // ── GET: PC drains the next batch of photos ─────────────────────────────
    if (req.method === 'GET') {
      const popped = await redis(['LPOP', key, String(DRAIN_BATCH)]);
      const list = Array.isArray(popped) ? popped : [];
      const photos = list.map(function(s) {
        try { return JSON.parse(s); } catch (e) { return null; }
      }).filter(Boolean);
      return res.status(200).json({ photos: photos });
    }

    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (e) {
    return res.status(502).json({ error: 'Relay storage unavailable.' });
  }
}
