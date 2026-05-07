import { rateLimitAsync, getClientIP } from './_rate-limit.js';

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const ip = getClientIP(req);
  const rl = await rateLimitAsync(`places:${ip}`, 60, 60000);
  if (!rl.allowed) return res.status(429).json({ error: 'Too many requests' });

  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (!q || q.length < 2) return res.status(400).json({ error: 'Query too short' });
  if (q.length > 120) return res.status(413).json({ error: 'Query too long' });

  const key = process.env.GOOGLE_PLACES_KEY;
  if (!key) return res.status(503).json({ error: 'Places not configured' });

  try {
    const url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json?' + new URLSearchParams({
      input: q,
      key,
      components: 'country:za',
      language: 'en',
      types: 'geocode',
    });
    const upstream = await fetch(url);
    const data = await upstream.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Places error:', data.status, data.error_message);
      return res.status(502).json({ predictions: [], error: data.status });
    }

    const predictions = (data.predictions || []).map(p => ({
      label: p.description.replace(/, South Africa$/, '').trim(),
      full: p.description,
    }));

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ predictions });
  } catch (err) {
    console.error('places handler:', err);
    return res.status(500).json({ predictions: [], error: 'Internal error' });
  }
}
