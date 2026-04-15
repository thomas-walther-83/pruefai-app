export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY } = process.env;
  const apiKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !apiKey) {
    return res.status(503).json({ error: 'Supabase nicht konfiguriert.' });
  }

  const { method = 'GET', path = '', body, prefer } = req.body || {};
  const url = SUPABASE_URL + '/rest/v1/' + path;

  const headers = {
    'apikey':        apiKey,
    'Authorization': 'Bearer ' + apiKey,
    'Content-Type':  'application/json',
    'Prefer':        prefer || 'return=representation',
  };

  const fetchOpts = { method, headers };
  if (body !== undefined && method !== 'GET') {
    fetchOpts.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const sbRes = await fetch(url, fetchOpts);
  const text  = await sbRes.text();
  res.status(sbRes.status);
  res.setHeader('Content-Type', 'application/json');
  res.end(text || '[]');
}

