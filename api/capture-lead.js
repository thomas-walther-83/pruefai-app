export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { name, email } = req.body || {};
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Ungültige E-Mail-Adresse.' });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL || 'info@lernortai.ch';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lernortai.ch';

  if (resendKey) {
    // Welcome email to the trial user
    const welcomeHtml = `<!DOCTYPE html><html lang="de"><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#f9fafb;padding:2rem">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#1a56db,#0d3494);color:#fff;padding:2rem;text-align:center">
    <div style="font-size:2rem;margin-bottom:.5rem">🎓</div>
    <h1 style="margin:0;font-size:1.5rem;font-weight:800">Willkommen bei LernortAI!</h1>
    <p style="margin:.5rem 0 0;opacity:.9">Ihre 3 Gratis-Korrekturen sind freigeschaltet.</p>
  </div>
  <div style="padding:2rem">
    <p style="margin:0 0 1rem">Hallo${name ? ' ' + name : ''},</p>
    <p style="margin:0 0 1rem">Ihre kostenlose Testphase ist jetzt aktiv. Sie haben <strong>3 KI-Korrekturen</strong> gratis – keine Kreditkarte nötig.</p>
    <p style="margin:0 0 1rem;font-size:.9rem">So geht's:</p>
    <ol style="margin:0 0 1.5rem;padding-left:1.25rem;font-size:.9rem;line-height:1.8">
      <li>Klasse und Schüler anlegen</li>
      <li>Prüfung fotografieren und hochladen</li>
      <li>KI-Korrektur mit einem Klick starten</li>
    </ol>
    <a href="${appUrl}" style="display:inline-block;background:#1a56db;color:#fff;padding:.875rem 2rem;border-radius:10px;font-weight:700;font-size:1rem;text-decoration:none">App starten →</a>
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
        subject: 'Willkommen bei LernortAI – Ihre 3 kostenlosen Korrekturen sind aktiv',
        html: welcomeHtml,
      }),
    }).catch((err) => console.error('Welcome email failed:', err.message));

    // Admin notification
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'LernortAI <noreply@lernortai.ch>',
        to: [adminEmail],
        subject: `Neuer Trial-Lead: ${name || email}`,
        html: `<p><strong>Name:</strong> ${name || '–'}</p><p><strong>E-Mail:</strong> ${email}</p>`,
      }),
    }).catch((err) => console.error('Admin notification failed:', err.message));
  }

  return res.status(200).json({ ok: true });
}
