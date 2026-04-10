export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const response = await fetch(
      'https://tckdimoqdtzsgvsmrwhl.supabase.co/rest/v1/trip_sync?id=eq.1&select=data',
      {
        headers: {
          'apikey': process.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
        }
      }
    );
    const rows = await response.json();
    if (rows.length > 0) {
      res.status(200).json(rows[0].data);
    } else {
      res.status(200).json({});
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
