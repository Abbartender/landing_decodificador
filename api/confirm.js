module.exports = async function handler(req, res) {
  const { token } = req.query;

  if (!token) return res.redirect('/');

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const DECODIFICADOR_URL = 'https://agustinbalegnobartender.com/decodificador-balegno-2.html';

  const sbRes = await fetch(
    `${SUPABASE_URL}/rest/v1/leads_libro?token=eq.${token}&select=id,confirmado,token_expires`,
    {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    }
  );

  const data = await sbRes.json();
  const lead = data[0];

  if (!lead) return res.redirect('/');
  if (new Date(lead.token_expires) < new Date()) return res.redirect('/');

  await fetch(`${SUPABASE_URL}/rest/v1/leads_libro?id=eq.${lead.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ confirmado: true })
  });

  return res.redirect(DECODIFICADOR_URL);
};
