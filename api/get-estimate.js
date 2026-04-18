import { rateLimit, getClientIP } from './_rate-limit.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const ip = getClientIP(req);
  const rl = rateLimit(`share:${ip}`, 30, 60000);
  if (!rl.allowed) return res.status(429).json({ error: 'Too many requests' });

  const { token } = req.query;
  if (!token || typeof token !== 'string' || token.length < 10) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = 'https://cocugdgelatgjzgkyhpz.supabase.co';
  if (!serviceKey) return res.status(503).json({ error: 'Server not configured' });

  const r = await fetch(
    `${url}/rest/v1/estimate_snapshots?share_token=eq.${encodeURIComponent(token)}&select=snapshot_data,expires_at`,
    { headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` } }
  );
  const data = await r.json();
  if (!Array.isArray(data) || data.length === 0) {
    return res.status(404).json({ error: 'Estimate not found or expired' });
  }
  const snap = data[0];
  if (new Date(snap.expires_at) < new Date()) {
    return res.status(410).json({ error: 'This estimate link has expired' });
  }
  return res.status(200).json({ snapshot_data: snap.snapshot_data });
}
