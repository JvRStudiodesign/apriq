const fs = require('fs');
const {execSync} = require('child_process');

// Restore clean FeaturesPage from last known good commit
const clean = execSync('git show a9e8cc5:src/pages/FeaturesPage.jsx').toString();

// Remove ONLY the Core Features section — the last <section> block
const lastSection = clean.lastIndexOf('<section style={{...s.section,paddingBottom:80}}');
if (lastSection > -1) {
  // Find what comes just before it to cleanly close
  const beforeLastSection = clean.lastIndexOf('</section>', lastSection - 1);
  const closePoint = beforeLastSection + '</section>'.length;
  // Rebuild: everything up to end of Free/Pro section + close the wrap div + component end
  const fixed = clean.slice(0, closePoint) + '\n    </div>\n  );\n}' + 
    clean.slice(clean.indexOf('\nconst s = '));
  fs.writeFileSync('src/pages/FeaturesPage.jsx', fixed, 'utf8');
  console.log('Fixed FeaturesPage — Core Features section removed, styles preserved');
} else {
  console.log('Pattern not found');
}
