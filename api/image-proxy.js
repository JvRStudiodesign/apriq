// Proxies a remote image for same-origin fetch (e.g. PDF logo embedding).
// Allowlist only Supabase Storage public URLs to avoid open-proxy abuse.

export const config = { runtime: 'nodejs' };
  try {
    const u = new URL(target);
    if (u.protocol !== 'https:') return false;
    if (!/\.supabase\.co$/i.test(u.hostname)) return false;
    return /^\/storage\/v1\/object\/public\//i.test(u.pathname);
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const raw = req.query?.u || req.query?.url;
  const target = typeof raw === 'string' ? raw.trim() : '';
  if (!target || !allowlisted(target)) {
    return res.status(400).json({ error: 'Invalid or disallowed URL' });
  }

  try {
    const r = await fetch(target, { redirect: 'follow' });
    if (!r.ok) return res.status(502).json({ error: 'Upstream fetch failed' });
    const buf = Buffer.from(await r.arrayBuffer());
    const ct = (r.headers.get('content-type') || 'application/octet-stream').split(';')[0].trim();
    if (!/^image\//i.test(ct)) {
      return res.status(400).json({ error: 'Not an image' });
    }
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'private, max-age=300');
    return res.status(200).send(buf);
  } catch (e) {
    console.error('image-proxy:', e);
    return res.status(502).json({ error: 'Proxy failed' });
  }
}
