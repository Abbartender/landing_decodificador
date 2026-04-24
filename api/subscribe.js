const { randomUUID } = require('crypto');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { nombre, email } = req.body || {};

  if (!nombre || !email || !email.includes('@')) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const BASE_URL = process.env.BASE_URL;

  const token = randomUUID();
  const expires = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/leads_libro`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ nombre, email, token, token_expires: expires, confirmado: false, fuente: 'libro_qr' })
  });

  if (!sbRes.ok) {
    const err = await sbRes.text();
    console.error('Supabase error:', err);
    return res.status(500).json({ error: 'Error al guardar' });
  }

  const confirmUrl = `${BASE_URL}/api/confirm?token=${token}`;

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Tu acceso al Decodificador — Agustín Balegno',
      html: `<div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;color:#1a1a1a;">
        <p style="font-size:14px;color:#888;letter-spacing:1px;text-transform:uppercase;">Academia de Bartenders</p>
        <h1 style="font-size:28px;line-height:1.2;">Hola, ${nombre}.</h1>
        <p style="font-size:16px;line-height:1.7;color:#444;">Gracias por tener el libro. Tu acceso al Decodificador está listo.</p>
        <p style="margin:2rem 0;">
          <a href="${confirmUrl}" style="background:#C8442A;color:white;padding:14px 28px;text-decoration:none;border-radius:4px;font-family:sans-serif;font-size:15px;">Confirmar y acceder al Decodificador</a>
        </p>
        <p style="font-size:13px;color:#888;">Este link es válido por 48 horas.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:2rem 0;">
        <p style="font-size:12px;color:#bbb;">Agustín Balegno · agustinbalegnobartender.com</p>
      </div>`
    })
  });

  if (!resendRes.ok) {
    const err = await resendRes.text();
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Error al enviar email' });
  }

  return res.status(200).json({ ok: true });
};
