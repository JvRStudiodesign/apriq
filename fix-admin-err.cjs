const fs = require('fs');
let A = fs.readFileSync('src/pages/Admin.jsx', 'utf8');
A = A.replace(
  `if (r.ok) { pwRef.current = pw; setAuth(true); setPw(''); }
      else setErr('Incorrect password');`,
  `if (r.ok) { pwRef.current = pw; setAuth(true); setPw(''); }
      else if (r.status === 503) setErr('Server configuration error — check SUPABASE_SERVICE_ROLE_KEY in Vercel');
      else if (r.status === 429) setErr('Too many attempts — wait 1 minute');
      else setErr('Incorrect password');`
);
fs.writeFileSync('src/pages/Admin.jsx', A, 'utf8');
console.log('done');
