// Shared security helpers for API handlers.
// In-memory rate limit resets on cold start – sufficient for casual abuse protection.
// For high-traffic abuse cases, swap to Upstash/Redis.

export const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const ipBuckets = new Map();

/** Test-only helper – clears all rate-limit state. Not exported as a real API. */
export function _resetRateLimitsForTests() {
  ipBuckets.clear();
}

export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * Sliding-window-ish IP rate limit (per bucket key).
 * @returns {boolean} true if request is allowed, false if rate-limited.
 */
export function checkRateLimit(bucketKey, ip, { max, windowMs }) {
  const now = Date.now();
  const key = `${bucketKey}:${ip}`;
  const entry = ipBuckets.get(key);
  if (!entry || entry.resetAt < now) {
    ipBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

/**
 * Apply CORS + Origin allowlist. Returns true if request should continue,
 * false if response was already terminated.
 */
export function applyCors(req, res, { methods = 'POST, OPTIONS', headers = 'Content-Type' } = {}) {
  const origin = req.headers.origin || '';
  if (origin && ALLOWED_ORIGINS.length > 0 && !ALLOWED_ORIGINS.includes(origin)) {
    res.status(403).json({ error: 'Origin not allowed.' });
    return false;
  }
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', methods);
    res.setHeader('Access-Control-Allow-Headers', headers);
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return false;
  }
  return true;
}
