import { put, del } from '@vercel/blob';

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'DELETE') {
    try {
      const { url } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!url) return res.status(400).json({ error: 'url required' });
      await del(url);
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { filename, data, dayNum } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!filename || !data) return res.status(400).json({ error: 'filename and data required' });

    const buffer = Buffer.from(data, 'base64');
    const blob = await put(`camp-reservations/day${dayNum}/${filename}`, buffer, {
      access: 'public',
      addRandomSuffix: true
    });

    res.status(200).json({ url: blob.url, filename });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
