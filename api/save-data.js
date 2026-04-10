export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // Upsert row with id=1
    const response = await fetch(
      'https://tckdimoqdtzsgvsmrwhl.supabase.co/rest/v1/trip_sync',
      {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({ id: 1, data: body, updated_at: new Date().toISOString() })
      }
    );

    if (response.ok) {
      res.status(200).json({ ok: true });
    } else {
      const err = await response.text();
      res.status(500).json({ error: err });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
