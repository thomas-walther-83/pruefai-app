const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 3_600_000;
const ipRateMap = new Map();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
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

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (origin && ALLOWED_ORIGINS.length > 0 && !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: 'Origin not allowed.' });
  }
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!checkRateLimit(getClientIp(req))) {
    return res.status(429).json({ error: 'Zu viele Anfragen. Bitte später erneut versuchen.' });
  }

  const { institution, kanton, anzahl, fachbereich, starttermin, email, name } = req.body || {};

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Ungültige E-Mail-Adresse.' });
  }
  if (!institution) {
    return res.status(400).json({ error: 'Institution fehlt.' });
  }

  function escHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  const safeInstitution = escHtml(institution);
  const safeKanton = escHtml(kanton);
  const safeAnzahl = escHtml(anzahl);
  const safeFachbereich = escHtml(fachbereich);
  const safeStarttermin = escHtml(starttermin);
  const safeName = escHtml(name);
  const safeEmail = escHtml(email);

  const resendKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL || 'info@pruefai.ch';

  if (resendKey) {
    // Notify admin
    const adminHtml = `<!DOCTYPE html><html lang="de"><body style="font-family:Arial,sans-serif;padding:2rem">
<h2 style="color:#1a56db">Neue Enterprise-Anfrage</h2>
<table style="border-collapse:collapse;font-size:.95rem">
  <tr><td style="padding:.4rem 1rem .4rem 0;font-weight:600;color:#6b7280">Institution</td><td>${safeInstitution}</td></tr>
  <tr><td style="padding:.4rem 1rem .4rem 0;font-weight:600;color:#6b7280">Kanton</td><td>${safeKanton || '–'}</td></tr>
  <tr><td style="padding:.4rem 1rem .4rem 0;font-weight:600;color:#6b7280">Anzahl Lehrpersonen</td><td>${safeAnzahl || '–'}</td></tr>
  <tr><td style="padding:.4rem 1rem .4rem 0;font-weight:600;color:#6b7280">Fachbereich</td><td>${safeFachbereich || '–'}</td></tr>
  <tr><td style="padding:.4rem 1rem .4rem 0;font-weight:600;color:#6b7280">Gewünschter Start</td><td>${safeStarttermin || '–'}</td></tr>
  <tr><td style="padding:.4rem 1rem .4rem 0;font-weight:600;color:#6b7280">Kontaktperson</td><td>${safeName || '–'}</td></tr>
  <tr><td style="padding:.4rem 1rem .4rem 0;font-weight:600;color:#6b7280">E-Mail</td><td><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
</table>
</body></html>`;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Pruefai <noreply@pruefai.ch>',
        to: [adminEmail],
        replyTo: email,
        subject: `Enterprise-Anfrage: ${institution}`,
        html: adminHtml,
      }),
    }).catch((err) => console.error('Enterprise admin email failed:', err.message));

    // Auto-reply to the sender
    const autoReplyHtml = `<!DOCTYPE html><html lang="de"><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#f9fafb;padding:2rem">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#1a56db,#0d3494);color:#fff;padding:2rem;text-align:center">
    <div style="font-size:2rem;margin-bottom:.5rem">🎓</div>
    <h1 style="margin:0;font-size:1.5rem;font-weight:800">Vielen Dank für Ihre Anfrage!</h1>
  </div>
  <div style="padding:2rem">
    <p style="margin:0 0 1rem">Guten Tag${safeName ? ' ' + safeName : ''},</p>
    <p style="margin:0 0 1rem">Wir haben Ihre Anfrage für <strong>${safeInstitution}</strong> erhalten und melden uns innerhalb von <strong>1–2 Werktagen</strong> bei Ihnen.</p>
    <p style="margin:0;font-size:.9rem;color:#6b7280">Mit freundlichen Grüssen<br>Das Pruefai-Team</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:2rem 0">
    <p style="margin:0;font-size:.8rem;color:#9ca3af">Fragen? <a href="mailto:info@pruefai.ch" style="color:#1a56db">info@pruefai.ch</a></p>
  </div>
</div>
</body></html>`;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Pruefai <noreply@pruefai.ch>',
        to: [email],
        subject: 'Ihre Anfrage bei Pruefai – wir melden uns bald',
        html: autoReplyHtml,
      }),
    }).catch((err) => console.error('Enterprise auto-reply failed:', err.message));
  }

  console.log(`Enterprise inquiry: institution=${institution}, email=${email}`);
  return res.status(200).json({ ok: true });
}
