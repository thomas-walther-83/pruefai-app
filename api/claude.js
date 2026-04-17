import crypto from 'crypto';

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const PLAN_LIMITS = { starter: 50, pro: 300, max: 5000, schule: 99999 };
const FREE_TRIAL_LIMIT = 3;
const RATE_LIMIT_MAX = 20; // max unlicensed requests per IP per hour
const RATE_LIMIT_WINDOW_MS = 3_600_000;

// In-memory rate limit store (resets on cold start – intentional, provides abuse protection)
const ipRateMap = new Map();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = ipRateMap.get(ip);
  if (!entry || entry.resetAt < now) {
    ipRateMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

// Trial token: base64url(JSON).HMAC-SHA256
function makeTrialToken(secret, ip, used, month) {
  const payload = Buffer.from(JSON.stringify({ ip, used, month })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return payload + '.' + sig;
}

function parseTrialToken(secret, token) {
  if (!token || typeof token !== 'string') return null;
  const dot = token.lastIndexOf('.');
  if (dot < 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  try {
    const sigBuf = Buffer.from(sig, 'base64url');
    const expBuf = Buffer.from(expected, 'base64url');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

async function findCustomerByMeta(stripeKey, metaKey, metaValue) {
  // Only allow known metadata keys to prevent query injection
  if (metaKey !== 'license_key' && metaKey !== 'schul_code') {
    throw new Error('Invalid metadata key');
  }
  // Stripe metadata query uses single-quoted values; reject values containing single quotes
  if (typeof metaValue !== 'string' || metaValue.includes("'")) {
    return null;
  }
  const query = encodeURIComponent(`metadata['${metaKey}']:'${metaValue}'`);
  const res = await fetch(`https://api.stripe.com/v1/customers/search?query=${query}&limit=1`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Stripe search error');
  return data.data && data.data.length > 0 ? data.data[0] : null;
}

async function incrementUsage(stripeKey, customerId, current, resetDate) {
  const params = new URLSearchParams({
    'metadata[corrections_this_month]': String(current + 1),
    'metadata[corrections_reset_date]': resetDate,
  });
  await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';

  // CORS: only allow configured origins (or same-origin requests with no Origin header)
  if (origin && ALLOWED_ORIGINS.length > 0 && !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: 'Origin not allowed.' });
  }

  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-License-Key, X-Schul-Code, X-Trial-Token');
    res.setHeader('Access-Control-Expose-Headers', 'X-Trial-Token');
    res.setHeader('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured on server.' });

  const { model, max_tokens, system, messages, licenseKey: bodyLicenseKey } = req.body;
  if (!messages) return res.status(400).json({ error: 'Missing required field: messages' });

  // License enforcement is ON by default. Set SKIP_LICENSE=true only for local dev/staging.
  if (process.env.SKIP_LICENSE !== 'true') {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) return res.status(500).json({ error: 'STRIPE_SECRET_KEY not configured on server.' });

    const licenseKey = req.headers['x-license-key'] || bodyLicenseKey || '';
    const schulCode = req.headers['x-schul-code'] || '';

    if (licenseKey || schulCode) {
      // ── Licensed path ──
      let customer;
      try {
        customer = schulCode
          ? await findCustomerByMeta(stripeKey, 'schul_code', schulCode)
          : await findCustomerByMeta(stripeKey, 'license_key', licenseKey);
      } catch (err) {
        console.error('License check failed:', err.message);
        return res.status(502).json({ error: 'Lizenzprüfung fehlgeschlagen.' });
      }

      if (!customer) {
        return res.status(402).json({ error: 'Kein aktiver Plan. Bitte abonnieren.', upgradeUrl: '/landing' });
      }

      const meta = customer.metadata || {};
      const plan = meta.plan || 'none';
      const limit = PLAN_LIMITS[plan] ?? 0;

      if (plan === 'none' || limit === 0) {
        return res.status(402).json({ error: 'Kein aktiver Plan. Bitte abonnieren.', upgradeUrl: '/landing' });
      }

      // Schulcode only works for the schule plan
      if (schulCode && plan !== 'schule') {
        return res.status(402).json({ error: 'Schulcode nur für den Schul-Plan gültig.', upgradeUrl: '/landing' });
      }

      const today = new Date().toISOString().slice(0, 10);
      let correctionsThisMonth = parseInt(meta.corrections_this_month || '0', 10);
      let resetDate = meta.corrections_reset_date || today;

      if (resetDate.slice(0, 7) !== today.slice(0, 7)) {
        correctionsThisMonth = 0;
        resetDate = today;
      }

      if (correctionsThisMonth >= limit) {
        return res.status(429).json({ error: 'Monatliches Limit erreicht.', upgradeUrl: '/landing' });
      }

      // Increment usage fire-and-forget
      incrementUsage(stripeKey, customer.id, correctionsThisMonth, resetDate).catch((err) =>
        console.error('Failed to increment usage:', err.message)
      );
    } else {
      // ── Trial path ──
      const ip = getClientIp(req);

      // IP-based rate limiting: hard ceiling against abuse
      if (!checkRateLimit(ip)) {
        return res.status(429).json({
          error: 'Zu viele Anfragen. Bitte später erneut versuchen.',
          upgradeUrl: '/landing',
        });
      }

      const trialSecret = process.env.TRIAL_SECRET;
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

      if (trialSecret) {
        const tokenStr = req.headers['x-trial-token'] || '';
        const parsed = parseTrialToken(trialSecret, tokenStr);

        // Accept token only if IP and month match (prevents token sharing / forwarding)
        let trialUsed = 0;
        if (parsed && parsed.ip === ip && parsed.month === currentMonth) {
          trialUsed = parsed.used || 0;
        }

        if (trialUsed >= FREE_TRIAL_LIMIT) {
          return res.status(402).json({
            error: 'Gratis-Kontingent aufgebraucht. Bitte Plan wählen.',
            upgradeUrl: '/landing',
          });
        }

        // Issue updated token with incremented count
        const newToken = makeTrialToken(trialSecret, ip, trialUsed + 1, currentMonth);
        res.setHeader('X-Trial-Token', newToken);
      }
      // Without TRIAL_SECRET the IP rate limit above is the only protection.
    }
  }

  let response;
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'claude-opus-4-5',
        max_tokens: max_tokens || 1024,
        system,
        messages,
      }),
    });
  } catch (err) {
    return res.status(502).json({ error: 'Failed to reach Anthropic API: ' + err.message });
  }

  const data = await response.json();
  if (!response.ok) {
    console.error('Anthropic API error', response.status, JSON.stringify(data));
  }
  return res.status(response.status).json(data);
}
