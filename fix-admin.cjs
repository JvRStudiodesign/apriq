const fs = require('fs');
let A = fs.readFileSync('src/pages/Admin.jsx', 'utf8');

// Keep pw in a ref so it persists after state update
A = A.replace(
  `import { useState, useEffect } from 'react';`,
  `import { useState, useEffect, useRef } from 'react';`
);

// Add a ref to store password
A = A.replace(
  `  const [auth, setAuth]    = useState(false); // Never auto-restore admin auth`,
  `  const [auth, setAuth]    = useState(false); // Never auto-restore admin auth
  const pwRef = useRef('');`
);

// Store in ref on successful login, clear state pw
A = A.replace(
  `if (r.ok) { sessionStorage.setItem('admin_auth','1'); setAuth(true); setPw(''); }`,
  `if (r.ok) { pwRef.current = pw; setAuth(true); setPw(''); }`
);

// Use ref in the data fetch
A = A.replace(
  `fetch('/api/admin-stats', { headers: { 'x-admin-password': pw || '' } })`,
  `fetch('/api/admin-stats', { headers: { 'x-admin-password': pwRef.current || '' } })`
);

fs.writeFileSync('src/pages/Admin.jsx', A, 'utf8');
console.log('done');
