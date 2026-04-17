const fs = require('fs');

// ── 1. UPGRADE.JSX: Remove hardcoded merchant credentials ────────────────────
let upgrade = fs.readFileSync('src/pages/Upgrade.jsx', 'utf8');
upgrade = upgrade.replace(
  `const MERCHANT_ID  = import.meta.env.VITE_PAYFAST_MERCHANT_ID  || '34377269';
const MERCHANT_KEY = import.meta.env.VITE_PAYFAST_MERCHANT_KEY || 'vyu9zys41dbon';
const SANDBOX      = true; // flip to false when PayFast approves account`,
  `const MERCHANT_ID  = import.meta.env.VITE_PAYFAST_MERCHANT_ID;
const MERCHANT_KEY = import.meta.env.VITE_PAYFAST_MERCHANT_KEY;
const SANDBOX      = import.meta.env.VITE_PAYFAST_SANDBOX !== 'false';`
);
// Guard against missing credentials
upgrade = upgrade.replace(
  `  function buildForm(plan) {`,
  `  function buildForm(plan) {
    if (!MERCHANT_ID || !MERCHANT_KEY) { alert('Payment configuration error. Please contact support.'); return; }`
);
fs.writeFileSync('src/pages/Upgrade.jsx', upgrade, 'utf8');
console.log('✓ Upgrade.jsx — hardcoded credentials removed');

// ── 2. AUTHCONTEXT: Remove localStorage tier cache + secure email triggers ───
let auth = fs.readFileSync('src/context/AuthContext.jsx', 'utf8');
// Remove localStorage tier caching — tier must come from server only
auth = auth.replace(
  `    if (data?.tier) localStorage.setItem('apriq_tier', data.tier);`,
  `    // Tier is always read from server profile — never cached locally`
);
fs.writeFileSync('src/context/AuthContext.jsx', auth, 'utf8');
console.log('✓ AuthContext.jsx — localStorage tier cache removed');

// ── 3. ADMIN.JSX: Remove admin password from sessionStorage ──────────────────
let admin = fs.readFileSync('src/pages/Admin.jsx', 'utf8');
// Use sessionStorage for auth flag only, never store password
admin = admin.replace(
  `if (r.ok) { sessionStorage.setItem('admin_auth','1'); sessionStorage.setItem('admin_pw', pw); setAuth(true); }`,
  `if (r.ok) { sessionStorage.setItem('admin_auth','1'); setAuth(true); setPw(''); }`
);
// Use header from state not sessionStorage for data fetch
admin = admin.replace(
  `fetch('/api/admin-stats', { headers: { 'x-admin-password': sessionStorage.getItem('admin_pw') || '' } })`,
  `fetch('/api/admin-stats', { headers: { 'x-admin-password': pw || '' } })`
);
// Keep pw in state for refetch but clear on tab close
admin = admin.replace(
  `const [auth, setAuth]    = useState(() => sessionStorage.getItem('admin_auth') === '1');`,
  `const [auth, setAuth]    = useState(false); // Never auto-restore admin auth`
);
// Clear sessionStorage on component mount to prevent stale auth
admin = admin.replace(
  `export default function Admin() {`,
  `export default function Admin() {
  // Clear any stale admin session on mount
  useEffect(() => { sessionStorage.removeItem('admin_auth'); }, []);`
);
fs.writeFileSync('src/pages/Admin.jsx', admin, 'utf8');
console.log('✓ Admin.jsx — password removed from sessionStorage, auto-restore disabled');

// ── 4. API EMAIL ENDPOINTS: Add INTERNAL_API_SECRET check ────────────────────
const emailEndpoints = [
  'api/send-welcome.js',
  'api/send-trial-warning.js', 
  'api/send-trial-expired.js',
  'api/send-payment-confirmed.js',
  'api/send-payment-failed.js',
  'api/send-cancelled.js',
];

const secretGuard = `  // Verify internal secret — prevent unauthenticated calls
  const internalSecret = process.env.INTERNAL_API_SECRET;
  if (!internalSecret || req.headers['x-internal-secret'] !== internalSecret) {
    console.warn('Email endpoint called without valid internal secret from IP:', req.headers['x-forwarded-for'] || 'unknown');
    return res.status(401).end('Unauthorized');
  }
`;

emailEndpoints.forEach(endpoint => {
  if (!fs.existsSync(endpoint)) { console.log(`⚠️  ${endpoint} not found — skipping`); return; }
  let e = fs.readFileSync(endpoint, 'utf8');
  if (e.includes('x-internal-secret')) { console.log(`✓ ${endpoint} — already protected`); return; }
  // Add guard after the method check
  e = e.replace(
    /if \(req\.method !== ['"]POST['"]\)[^;]+;/,
    (m) => m + '\n' + secretGuard
  );
  fs.writeFileSync(endpoint, e, 'utf8');
  console.log(`✓ ${endpoint} — internal secret guard added`);
});

// ── 5. VERCEL.JSON: Harden CSP + add missing security headers ────────────────
let vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));

// Update CSP to remove unsafe-eval where possible, add more restrictions
const existingHeaders = vercel.headers[0].headers;
const cspIdx = existingHeaders.findIndex(h => h.key === 'Content-Security-Policy');
if (cspIdx > -1) {
  existingHeaders[cspIdx].value = "default-src 'self'; script-src 'self' 'unsafe-inline' https://sandbox.payfast.co.za https://www.payfast.co.za; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://*.supabase.co https://supabase.co; connect-src 'self' https://*.supabase.co https://api.resend.com https://eu.posthog.com https://posthog.com; frame-src https://sandbox.payfast.co.za https://www.payfast.co.za; form-action 'self' https://sandbox.payfast.co.za https://www.payfast.co.za; base-uri 'self'; object-src 'none'; upgrade-insecure-requests;";
}

// Add missing headers
const missingHeaders = [
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
];
missingHeaders.forEach(h => {
  if (!existingHeaders.find(e => e.key === h.key)) {
    existingHeaders.push(h);
  }
});

fs.writeFileSync('vercel.json', JSON.stringify(vercel, null, 2), 'utf8');
console.log('✓ vercel.json — CSP hardened, additional security headers added');

// ── 6. PAYFAST-ITN: Harden INTERNAL_API_SECRET fallback ─────────────────────
let itn = fs.readFileSync('api/payfast-itn.js', 'utf8');
itn = itn.replace(
  `'x-internal-secret': process.env.INTERNAL_API_SECRET || '',`,
  `'x-internal-secret': process.env.INTERNAL_API_SECRET || (() => { throw new Error('INTERNAL_API_SECRET not set'); })(),`
);
// Wrap in try/catch since the throw is inside object literal
itn = itn.replace(
  `'x-internal-secret': process.env.INTERNAL_API_SECRET || (() => { throw new Error('INTERNAL_API_SECRET not set'); })(),`,
  `'x-internal-secret': process.env.INTERNAL_API_SECRET || 'missing-secret',`
);
// Add a check before the email fire
itn = itn.replace(
  `    if (u?.email) {`,
  `    if (u?.email && process.env.INTERNAL_API_SECRET) {`
);
fs.writeFileSync('api/payfast-itn.js', itn, 'utf8');
console.log('✓ payfast-itn.js — INTERNAL_API_SECRET guard added');

console.log('\n✅ Security hardening complete.');
