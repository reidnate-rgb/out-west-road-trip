export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { name, parkName, dayDate } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (!name || !parkName) {
      return res.status(400).json({ error: 'name and parkName required' });
    }

    const prompt = `You are a national park trail and activity expert. Research this hike or attraction and return ONLY a JSON object (no markdown, no code fences, just raw JSON).

Activity: "${name}"
Park: "${parkName}"
Travel date: July 2026

Return this exact JSON structure:
{
  "name": "the full proper name",
  "type": "hike" or "attraction",
  "diff": "Easy" or "Moderate" or "Hard" (null if attraction),
  "dist": "X mi RT" (null if attraction),
  "time": "estimated time like 1-2 hrs",
  "desc": "One sentence description, max 100 chars",
  "detail": "2-3 sentences with: trailhead location, how to get there, best time to go in July, any permits needed, tips. Use <strong> tags for labels like <strong>Trailhead:</strong>",
  "gps": "lat,lng in decimal format like 37.7453,-119.5948",
  "mapsQuery": "Google Maps searchable name and location",
  "trailMap": "AllTrails or NPS URL if you know it, empty string if not"
}

If you cannot find this specific activity, make your best guess based on the park location and similar activities. Always provide GPS coordinates for the park area at minimum.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: 'Anthropic API error: ' + err });
    }

    const data = await response.json();
    const text = data.content[0].text.trim();

    // Parse the JSON from the response
    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      // Try to extract JSON from the response if it has extra text
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        result = JSON.parse(match[0]);
      } else {
        return res.status(500).json({ error: 'Failed to parse AI response', raw: text });
      }
    }

    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
