import { rateLimit, getClientIP } from './_rate-limit.js';

const PLACES_ENDPOINT = 'https://places.googleapis.com/v1/places:autocomplete';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const ip = getClientIP(req);
  const rl = rateLimit(`places:${ip}`, 120, 60_000);
  if (!rl.allowed) return res.status(429).json({ error: 'Too many requests' });

  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (!q || q.length < 2) return res.status(400).json({ error: 'Query too short' });

  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return res.status(503).json({ error: 'Places not configured' });

  try {
    const upstream = await fetch(PLACES_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat.mainText.text,suggestions.placePrediction.structuredFormat.secondaryText.text',
      },
      body: JSON.stringify({
        input: q,
        languageCode: 'en',
        includedRegionCodes: ['za'],
      }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      console.error('Places autocomplete error:', upstream.status, data);
      return res.status(502).json({ predictions: [], error: 'Upstream error' });
    }

    const predictions = [];

    const suggestions = data.suggestions;
    if (Array.isArray(suggestions)) {
      for (const s of suggestions) {
        const p = s.placePrediction;
        if (!p) continue;
        const main = p.structuredFormat?.mainText?.text || '';
        const secondary = p.structuredFormat?.secondaryText?.text || '';
        const fullText = typeof p.text?.text === 'string' ? p.text.text.trim() : '';
        const label = secondary ? `${main}, ${secondary}`.replace(/^,\s*|,\s*$/g, '').trim()
          : (fullText || main).trim();

        predictions.push({
          label,
          full: label,
          placeId: p.placeId || null,
        });
      }
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ predictions });
  } catch (err) {
    console.error('places handler:', err);
    return res.status(500).json({ predictions: [], error: 'Internal error' });
  }
}
