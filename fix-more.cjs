const fs = require('fs');
let P = fs.readFileSync('src/pages/UserProfile.jsx', 'utf8');
P = P.replace('</di))}', '</div>))}');
P = P.replace('</di</di{/* Profession */}', '</div>\n          </div>\n          {/* Profession */}');
fs.writeFileSync('src/pages/UserProfile.jsx', P, 'utf8');
const lines = P.split('\n');
lines.slice(143,158).forEach((l,i)=>console.log(i+144,l));
