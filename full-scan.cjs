const fs = require('fs');
const P = fs.readFileSync('src/pages/UserProfile.jsx', 'utf8');
const lines = P.split('\n');
lines.forEach((l, i) => {
  const t = l.trim();
  if (
    (t.includes('</di') && !t.startsWith('//') && !t.match(/<\/div>|<\/dialog|<\/dif/)) ||
    (t.match(/<di[^avlo]/) && !t.startsWith('//'))
  ) {
    console.log('LINE', i+1, ':', l);
  }
});
console.log('Scan complete');
