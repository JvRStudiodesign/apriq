const fs = require('fs');
const {execSync} = require('child_process');

// ── 1. USERPROFILE: Restore exact original layout, only move h1 below header ──
// Get the clean version
const clean = execSync('git show be10bed:src/pages/UserProfile.jsx').toString();
// Only change: remove borderBottom from the page wrapper div (the sticky div)
let P = clean;
P = P.replace(
  `background: '#F9FAFA', borderBottom: '1px solid #E4E5E5', padding: '0.875rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100`,
  `background: '#F9FAFA', padding: '0.875rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100`
);
// Also remove the old sticky div entirely since Layout already provides the header
P = P.replace(
  /      <div style=\{\{ background: '#F9FAFA', padding: '0\.875rem 1\.5rem'[^}]+\}\}>\s*<div style=\{\{[^}]+\}\}>\s*\{\/\* Header handled by Layout \*\/\}\s*<\/div>\s*<span style=\{\{[^}]+\}\}>User Profile<\/span>\s*<\/div>/s,
  ``
);
fs.writeFileSync('src/pages/UserProfile.jsx', P, 'utf8');
console.log('✓ UserProfile restored clean, sticky header removed');

// ── 2. CALCULATOR: Remove only the TOP simple install block ───────────────────
let C = fs.readFileSync('src/pages/Calculator.jsx', 'utf8');
// The top one is the simple text block, the bottom one has InstallPWA component
// Find and remove only the simple one (has iOS/Android/Windows/Mac plain text)
C = C.replace(
  /\s*\{\/\* How to install AprIQ \*\/\}\s*<div style=\{\{ maxWidth:'1140px', margin:'0 auto', padding:'0 1\.25rem 2\.5rem' \}\}>\s*<div style=\{\{[^}]+\}\}>\s*<p[^<]+<\/p>\s*<p[^<]+<\/p>\s*<p[^>]+>[\s\S]*?<\/p>\s*<\/div>\s*<\/div>/,
  ``
);
fs.writeFileSync('src/pages/Calculator.jsx', C, 'utf8');
console.log('✓ Calculator top simple install block removed');

console.log('\nDone.');
