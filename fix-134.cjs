const fs = require('fs');
let P = fs.readFileSync('src/pages/UserProfile.jsx', 'utf8');
P = P.replace('        </di{/* Details */}', '        </div>\n        {/* Details */}');
fs.writeFileSync('src/pages/UserProfile.jsx', P, 'utf8');
const lines = P.split('\n');
lines.slice(130,140).forEach((l,i)=>console.log(i+131,l));
