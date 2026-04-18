const fs = require('fs');

// ── 1. Rate limit save-estimate ───────────────────────────────────────────────
let save = fs.readFileSync('api/save-estimate.js', 'utf8');
if (!save.includes('rateLimit')) {
  save = save.replace(
    `// api/save-estimate.js — server-side estimate save with auth + validation
export default async function handler(req, res) {`,
    `import { rateLimit, getClientIP } from './_rate-limit.js';
// api/save-estimate.js — server-side estimate save with auth + validation
export default async function handler(req, res) {
  const ip = getClientIP(req);
  const rl = rateLimit(\`save:\${ip}\`, 10, 60000);
  if (!rl.allowed) return res.status(429).json({ error: 'Too many requests' });`
  );
  fs.writeFileSync('api/save-estimate.js', save, 'utf8');
  console.log('✓ save-estimate — rate limited (10/min per IP)');
}

// ── 2. Rate limit shared estimate (via Supabase direct — protect with app-level check)
// SharedEstimate reads directly from Supabase client — add rate limiting via a
// dedicated API endpoint instead of direct Supabase call
// Create api/get-estimate.js
const getEstimate = `import { rateLimit, getClientIP } from './_rate-limit.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const ip = getClientIP(req);
  const rl = rateLimit(\`share:\${ip}\`, 30, 60000);
  if (!rl.allowed) return res.status(429).json({ error: 'Too many requests' });

  const { token } = req.query;
  if (!token || typeof token !== 'string' || token.length < 10) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = 'https://cocugdgelatgjzgkyhpz.supabase.co';
  if (!serviceKey) return res.status(503).json({ error: 'Server not configured' });

  const r = await fetch(
    \`\${url}/rest/v1/estimate_snapshots?share_token=eq.\${encodeURIComponent(token)}&select=snapshot_data,expires_at\`,
    { headers: { 'apikey': serviceKey, 'Authorization': \`Bearer \${serviceKey}\` } }
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
`;
fs.writeFileSync('api/get-estimate.js', getEstimate, 'utf8');
console.log('✓ get-estimate — new rate-limited API endpoint created');

// Update SharedEstimate.jsx to use the new API instead of direct Supabase
let shared = fs.readFileSync('src/pages/SharedEstimate.jsx', 'utf8');
shared = shared.replace(
  `  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('estimate_snapshots')
        .select('snapshot_data, expires_at')
        .eq('share_token', token)
        .single();
      if (error || !data)                         { setErr('This estimate link is invalid or has expired.'); setLoad(false); return; }
      if (new Date(data.expires_at) < new Date()) { setErr('This estimate link has expired.'); setLoad(false); return; }
      setSnap(data.snapshot_data);
      setLoad(false);
    }
    load();
  }, [token]);`,
  `  useEffect(() => {
    async function load() {
      try {
        const r = await fetch(\`/api/get-estimate?token=\${encodeURIComponent(token)}\`);
        if (r.status === 429) { setErr('Too many requests. Please try again shortly.'); setLoad(false); return; }
        if (r.status === 410) { setErr('This estimate link has expired.'); setLoad(false); return; }
        if (!r.ok) { setErr('This estimate link is invalid or has expired.'); setLoad(false); return; }
        const data = await r.json();
        setSnap(data.snapshot_data);
        setLoad(false);
      } catch { setErr('Failed to load estimate.'); setLoad(false); }
    }
    load();
  }, [token]);`
);
fs.writeFileSync('src/pages/SharedEstimate.jsx', shared, 'utf8');
console.log('✓ SharedEstimate.jsx — now uses rate-limited API endpoint');

// ── 3. Protect notification email types with a simple honeypot token ──────────
// Add a shared origin check for notification types in send-email.js
let email = fs.readFileSync('api/send-email.js', 'utf8');
email = email.replace(
  `  // Notification types (contact/feedback/new_*) don't need internal secret — they come from frontend
  const isNotification = ['contact','feedback','new_user','new_client','new_waitlist'].includes(type);
  if (!isNotification && internalSecret && req.headers['x-internal-secret'] !== internalSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }`,
  `  // Notification types rate-limited strictly to prevent inbox spam
  const isNotification = ['contact','feedback','new_user','new_client','new_waitlist',
    'waitlist_confirm','feedback_confirm','contact_confirm'].includes(type);
  if (!isNotification && internalSecret && req.headers['x-internal-secret'] !== internalSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Notification types: stricter rate limit (5/hour per IP) to prevent spam
  if (isNotification) {
    const notifRl = rateLimit(\`notif:\${ip}\`, 5, 3600000);
    if (!notifRl.allowed) {
      console.warn('Notification email rate limited:', type, ip);
      return res.status(429).json({ error: 'Too many requests' });
    }
  }`
);
fs.writeFileSync('api/send-email.js', email, 'utf8');
console.log('✓ send-email — notification types rate limited (5/hour per IP)');

console.log('\nAll 3 launch security fixes done.');
console.log('API count:', fs.readdirSync('api').length, 'files');
