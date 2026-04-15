export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY } = process.env;
  const apiKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !apiKey) {
    return res.status(503).json({ error: 'Supabase nicht konfiguriert.' });
  }

  if (req.method === 'POST' && req.query.action === 'sign') {
    // Parse JSON body manually (bodyParser is disabled)
    const raw = await readBody(req);
    const { bucket, filePath } = JSON.parse(raw);
    if (!bucket || !filePath) return res.status(400).json({ error: 'bucket und filePath erforderlich.' });

    const url = SUPABASE_URL + '/storage/v1/object/sign/' + bucket + '/' + filePath;
    const sbRes = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey':        apiKey,
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ expiresIn: 3600 }),
    });
    if (!sbRes.ok) return res.status(sbRes.status).json({ error: 'Signed URL fehlgeschlagen.' });
    const data = await sbRes.json();
    return res.json({ signedURL: SUPABASE_URL + '/storage/v1' + data.signedURL });
  }

  if (req.method === 'POST' && req.query.action === 'upload') {
    const { bucket, filePath, contentType } = req.query;
    if (!bucket || !filePath) return res.status(400).json({ error: 'bucket und filePath erforderlich.' });

    const url = SUPABASE_URL + '/storage/v1/object/' + bucket + '/' + decodeURIComponent(filePath);
    const sbRes = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey':        apiKey,
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type':  contentType || 'application/octet-stream',
      },
      body: req, // pipe readable stream directly
    });
    if (!sbRes.ok) {
      const errText = await sbRes.text();
      return res.status(sbRes.status).json({ error: 'Upload fehlgeschlagen: ' + errText });
    }
    return res.json({ path: bucket + '/' + decodeURIComponent(filePath) });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

