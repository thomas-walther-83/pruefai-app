// Photo relay for mobile → PC QR-code upload flow.
// Uses an in-memory Map (Vercel reuses warm instances, so this works in practice
// for the short duration of a scan session; if a cold-start occurs the user sees
// an error and can fall back to manual upload).

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_PHOTOS_PER_TOKEN = 30;
const MAX_PHOTO_B64_LEN = 6 * 1024 * 1024; // ~4.5 MB decoded

// Global store: token -> { photos: [{data, mime}], created: number }
const store = new Map();

function cleanup() {
  const cutoff = Date.now() - TTL_MS;
  for (const [k, v] of store) {
    if (v.created < cutoff) store.delete(k);
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '5mb' } },
};

export default function handler(req, res) {
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

  cleanup();

  const { t } = req.query;
  if (!t || typeof t !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t)) {
    return res.status(400).json({ error: 'Invalid or missing token.' });
  }

  // ── POST: mobile uploads a photo ──────────────────────────────────────────
  if (req.method === 'POST') {
    const { data, mime } = req.body || {};
    if (typeof data !== 'string' || !data.startsWith('data:')) {
      return res.status(400).json({ error: 'Missing photo data.' });
    }
    if (data.length > MAX_PHOTO_B64_LEN) {
      return res.status(413).json({ error: 'Photo too large.' });
    }
    const safeMime = typeof mime === 'string' && mime.startsWith('image/') ? mime : 'image/jpeg';

    if (!store.has(t)) store.set(t, { photos: [], created: Date.now() });
    const entry = store.get(t);
    if (entry.photos.length >= MAX_PHOTOS_PER_TOKEN) {
      return res.status(429).json({ error: 'Too many photos for this session.' });
    }
    entry.photos.push({ data, mime: safeMime });
    return res.json({ ok: true, total: entry.photos.length });
  }

  // ── GET: PC polls for new photos ──────────────────────────────────────────
  if (req.method === 'GET') {
    const entry = store.get(t);
    if (!entry || !entry.photos.length) {
      return res.json({ photos: [] });
    }
    const photos = entry.photos.splice(0); // drain queue
    return res.json({ photos });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
