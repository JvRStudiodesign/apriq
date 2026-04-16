const fs = require('fs');
let P = fs.readFileSync('src/pages/UserProfile.jsx', 'utf8');

// Fix all the corrupted closing tags from the regex mess
P = P.replace('</di}', '</div>}');
P = P.replace('<di<button', '</div>\n                  <button');
P = P.replace('</di</di<input', '</div>\n              </div>\n              <input');

fs.writeFileSync('src/pages/UserProfile.jsx', P, 'utf8');
const lines = P.split('\n');
lines.slice(108,125).forEach((l,i)=>console.log(i+109,l));
