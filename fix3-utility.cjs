const fs = require('fs');

// ── UserProfile ────────────────────────────────────────────────────────────────
let profile = fs.readFileSync('src/pages/UserProfile.jsx', 'utf8');
profile = profile.replace("import { HamburgerMenu } from '../components/HamburgerMenu';\n", '');
profile = profile.replace(
  `          <HamburgerMenu />
          <span style={{ fontWeight: '700', fontSize: '1.5rem', letterSpacing: '-0.04em', cursor: 'pointer' }} onClick={() => navigate('/')}><img src="/logo-transparent.png" alt="AprIQ" style={{ height: '88px', width: 'auto', objectFit: 'contain', mixBlendMode: 'multiply' }} /></span>`,
  `          {/* Header handled by Layout */}`
);
fs.writeFileSync('src/pages/UserProfile.jsx', profile, 'utf8');
console.log('✓ UserProfile.jsx');

// ── Projects ────────────────────────────────────────────────────────────────────
let projects = fs.readFileSync('src/pages/Projects.jsx', 'utf8');
projects = projects.replace("import { HamburgerMenu } from '../components/HamburgerMenu';\n", '');
projects = projects.replace(
  `          <HamburgerMenu />
          <img src="/logo.jpg" alt="AprIQ" onClick={() => navigate('/')} style={{ height:'36px', width:'auto', objectFit:'contain', cursor:'pointer' }} />`,
  `          {/* Header handled by Layout */}`
);
fs.writeFileSync('src/pages/Projects.jsx', projects, 'utf8');
console.log('✓ Projects.jsx');

// ── Clients ─────────────────────────────────────────────────────────────────────
let clients = fs.readFileSync('src/pages/Clients.jsx', 'utf8');
clients = clients.replace("import { HamburgerMenu } from '../components/HamburgerMenu';\n", '');
clients = clients.replace(
  `          <HamburgerMenu />
          <img src="/logo.jpg" alt="AprIQ" onClick={() => navigate('/')} style={{ height:'36px', width:'auto', objectFit:'contain', cursor:'pointer' }} />`,
  `          {/* Header handled by Layout */}`
);
fs.writeFileSync('src/pages/Clients.jsx', clients, 'utf8');
console.log('✓ Clients.jsx');

console.log('\nScript 3 done.');
