const fs = require('fs');
let C = fs.readFileSync('src/pages/Calculator.jsx', 'utf8');
const lines = C.split('\n');
// Find line with the simple 'Install AprIQ' heading text (not the component)
const idx = lines.findIndex(l => l.includes('Install AprIQ') && l.includes('fontWeight:600') && !l.includes('InstallPWA'));
if (idx > -1) {
  // The block starts ~2 lines before (the comment + outer div) and ends ~8 lines after
  let blockStart = idx;
  while (blockStart > 0 && !lines[blockStart].includes('{/*')) blockStart--;
  let blockEnd = idx;
  let depth = 0;
  for (let i = blockStart; i < lines.length; i++) {
    depth += (lines[i].match(/<div/g)||[]).length;
    depth -= (lines[i].match(/<\/div/g)||[]).length;
    if (i > blockStart && depth <= 0) { blockEnd = i; break; }
  }
  lines.splice(blockStart, blockEnd - blockStart + 1);
  fs.writeFileSync('src/pages/Calculator.jsx', lines.join('\n'), 'utf8');
  console.log('Removed lines', blockStart+1, 'to', blockEnd+1);
} else {
  console.log('Not found');
}
