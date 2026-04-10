export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { name, parkName } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!name || !parkName) return res.status(400).json({ error: 'name and parkName required' });

    const prompt = `You are a national park trail expert. Research this hike or attraction and return ONLY valid JSON (no markdown, no code fences).

Activity: "${name}"
Park: "${parkName}"
Travel date: July 2026

Return this exact JSON structure:
{"name":"the full proper name","type":"hike or attraction","diff":"Easy or Moderate or Hard (null if attraction)","dist":"X mi RT (null if attraction)","time":"estimated time like 1-2 hrs","desc":"One sentence description, max 100 chars","detail":"2-3 sentences with trailhead location, how to get there, best time in July, permits needed, tips. Use <strong> tags for labels.","gps":"lat,lng decimal format like 37.7453,-119.5948","mapsQuery":"Google Maps searchable name and location","trailMap":"AllTrails or NPS URL if known, empty string if not"}`;

    // Try Anthropic first
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      try {
        const aResp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 500,
            messages: [{ role: 'user', content: prompt }]
          })
        });
        if (aResp.ok) {
          const aData = await aResp.json();
          const text = aData.content[0].text.trim();
          const match = text.match(/\{[\s\S]*\}/);
          if (match) {
            return res.status(200).json(JSON.parse(match[0]));
          }
        }
      } catch (e) { /* fall through to Gemini */ }
    }

    // Fallback: Google Gemini (free tier)
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const gResp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.3, maxOutputTokens: 500 }
            })
          }
        );
        const gText = await gResp.text();
        if (gResp.ok) {
          const gData = JSON.parse(gText);
          const responseText = gData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (responseText) {
            const match = responseText.match(/\{[\s\S]*\}/);
            if (match) {
              return res.status(200).json(JSON.parse(match[0]));
            }
            return res.status(500).json({ error: 'Could not parse Gemini response', raw: responseText.substring(0, 200) });
          }
          return res.status(500).json({ error: 'Empty Gemini response', raw: gText.substring(0, 200) });
        }
        return res.status(500).json({ error: 'Gemini API error: ' + gText.substring(0, 300) });
      } catch (gErr) {
        return res.status(500).json({ error: 'Gemini exception: ' + gErr.message });
      }
    }

    res.status(500).json({ error: 'No AI API keys found in environment' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
