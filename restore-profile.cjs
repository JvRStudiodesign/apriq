const fs = require('fs');
const {execSync} = require('child_process');

// Get the clean version from before our changes (commit a9e8cc5 = last known good)
const clean = execSync('git show a9e8cc5:src/pages/UserProfile.jsx').toString();

// Find and remove only the install app card — the known safe block
const installStart = clean.indexOf('        <div style={card}>\n          <span style={{ fontSize: \'0.85rem\', fontWeight: \'600\', color: \'#111111\', display: \'block\', marginBottom: \'0.5rem\' }}>Install app</span>');
if (installStart > -1) {
  // Find the closing div of this card
  let depth = 0, pos = installStart, end = -1;
  for (let i = installStart; i < clean.length - 5; i++) {
    if (clean.slice(i, i+4) === '<div') depth++;
    if (clean.slice(i, i+6) === '</div') { depth--; if (depth === 0) { end = i + 6; break; } }
  }
  const withoutInstall = clean.slice(0, installStart) + clean.slice(end);
  fs.writeFileSync('src/pages/UserProfile.jsx', withoutInstall, 'utf8');
  console.log('Restored clean UserProfile, removed install block. Lines:', withoutInstall.split('\n').length);
} else {
  // Just restore clean version as-is
  fs.writeFileSync('src/pages/UserProfile.jsx', clean, 'utf8');
  console.log('Restored clean UserProfile (install block not found). Lines:', clean.split('\n').length);
}
