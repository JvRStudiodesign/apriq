const fs = require('fs');
let P = fs.readFileSync('src/pages/UserProfile.jsx', 'utf8');

// Fix all remaining corrupted tags
let fixed = 0;

// Pattern: </di followed by anything that is not v> or alog> or v
const lines = P.split('\n');
const cleaned = lines.map((line, i) => {
  let orig = line;
  // Fix </di} → </div>}
  line = line.replace(/<\/di\}/g, '</div>}');
  // Fix </di> that are incomplete  
  line = line.replace(/<\/di>/g, '</div>');
  // Fix <di< → </div>\n
  line = line.replace(/<di</g, '</div>\n              <');
  // Fix </di</di< 
  line = line.replace(/<\/di<\/di</g, '</div>\n              </div>\n              <');
  if (line !== orig) { fixed++; console.log('Fixed line', i+1, ':', orig.trim().substring(0,60)); }
  return line;
});

P = cleaned.join('\n');
fs.writeFileSync('src/pages/UserProfile.jsx', P, 'utf8');
console.log('Total fixes:', fixed);
