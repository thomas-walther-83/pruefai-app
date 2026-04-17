export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const sessionId = req.query.session_id;
  if (!sessionId || !sessionId.startsWith('cs_')) {
    return res.status(400).json({ error: 'Invalid or missing session_id.' });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return res.status(500).json({ error: 'STRIPE_SECRET_KEY not configured.' });
  }

  let session;
  try {
    const sessionRes = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      {
        headers: { Authorization: `Bearer ${stripeKey}` },
      }
    );
    const data = await sessionRes.json();
    if (!sessionRes.ok) {
      return res.status(sessionRes.status).json({ error: data.error?.message || 'Stripe error' });
    }
    session = data;
  } catch (err) {
    return res.status(502).json({ error: 'Failed to reach Stripe API: ' + err.message });
  }

  const customerId = session.customer;
  if (!customerId) {
    return res.status(404).json({ error: 'No customer found for this session.' });
  }

  let customer;
  try {
    const customerRes = await fetch(
      `https://api.stripe.com/v1/customers/${encodeURIComponent(customerId)}`,
      {
        headers: { Authorization: `Bearer ${stripeKey}` },
      }
    );
    const data = await customerRes.json();
    if (!customerRes.ok) {
      return res.status(customerRes.status).json({ error: data.error?.message || 'Stripe error' });
    }
    customer = data;
  } catch (err) {
    return res.status(502).json({ error: 'Failed to reach Stripe API: ' + err.message });
  }

  const licenseKey = customer.metadata?.license_key || null;
  const rawPlan = customer.metadata?.plan || session.metadata?.plan || null;
  const plan = rawPlan === 'schule' ? 'max' : rawPlan;

  return res.status(200).json({ licenseKey, plan });
}
