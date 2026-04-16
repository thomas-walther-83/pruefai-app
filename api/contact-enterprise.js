export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { institution, kanton, anzahl, fachbereich, starttermin, email, name } = req.body || {};

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Ungültige E-Mail-Adresse.' });
  }
  if (!institution) {
    return res.status(400).json({ error: 'Institution fehlt.' });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL || 'info@lernortai.ch';

  if (resendKey) {
    // Notify admin
    const adminHtml = `<!DOCTYPE html><html lang="de"><body style="font-family:Arial,sans-serif;padding:2rem">
<h2 style="color:#1a56db">Neue Enterprise-Anfrage</h2>
<table style="border-collapse:collapse;font-size:.95rem">
  <tr><td style="padding:.4rem 1rem .4rem 0;font-weight:600;color:#6b7280">Institution</td><td>${institution}</td></tr>
  <tr><td style="padding:.4rem 1rem .4rem 0;font-weight:600;color:#6b7280">Kanton</td><td>${kanton || '–'}</td></tr>
  <tr><td style="padding:.4rem 1rem .4rem 0;font-weight:600;color:#6b7280">Anzahl Lehrpersonen</td><td>${anzahl || '–'}</td></tr>
  <tr><td style="padding:.4rem 1rem .4rem 0;font-weight:600;color:#6b7280">Fachbereich</td><td>${fachbereich || '–'}</td></tr>
  <tr><td style="padding:.4rem 1rem .4rem 0;font-weight:600;color:#6b7280">Gewünschter Start</td><td>${starttermin || '–'}</td></tr>
  <tr><td style="padding:.4rem 1rem .4rem 0;font-weight:600;color:#6b7280">Kontaktperson</td><td>${name || '–'}</td></tr>
  <tr><td style="padding:.4rem 1rem .4rem 0;font-weight:600;color:#6b7280">E-Mail</td><td><a href="mailto:${email}">${email}</a></td></tr>
</table>
</body></html>`;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'LernortAI <noreply@lernortai.ch>',
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
    <p style="margin:0 0 1rem">Guten Tag${name ? ' ' + name : ''},</p>
    <p style="margin:0 0 1rem">Wir haben Ihre Anfrage für <strong>${institution}</strong> erhalten und melden uns innerhalb von <strong>1–2 Werktagen</strong> bei Ihnen.</p>
    <p style="margin:0;font-size:.9rem;color:#6b7280">Mit freundlichen Grüssen<br>Das LernortAI-Team</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:2rem 0">
    <p style="margin:0;font-size:.8rem;color:#9ca3af">Fragen? <a href="mailto:info@lernortai.ch" style="color:#1a56db">info@lernortai.ch</a></p>
  </div>
</div>
</body></html>`;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'LernortAI <noreply@lernortai.ch>',
        to: [email],
        subject: 'Ihre Anfrage bei LernortAI – wir melden uns bald',
        html: autoReplyHtml,
      }),
    }).catch((err) => console.error('Enterprise auto-reply failed:', err.message));
  }

  console.log(`Enterprise inquiry: institution=${institution}, email=${email}`);
  return res.status(200).json({ ok: true });
}
