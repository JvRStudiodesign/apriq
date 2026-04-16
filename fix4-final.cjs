const fs = require('fs');

// ── Configurator: centre-align Total Project Cost bubble ──────────────────────
let calc = fs.readFileSync('src/pages/Calculator.jsx', 'utf8');
calc = calc.replace(
  `TOTAL PROJECT COST`,
  `TOTAL PROJECT COST`
);
// Find the total project cost card and add textAlign center
calc = calc.replace(
  `<div style={{ fontSize: '0.7rem', fontWeight: '600', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>TOTAL PROJECT COST</div>`,
  `<div style={{ fontSize: '0.7rem', fontWeight: '600', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem', textAlign:'center' }}>TOTAL PROJECT COST</div>`
);
calc = calc.replace(
  `style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: '700', color: '#F9FAFA', letterSpacing: '-0.03em', lineHeight: 1 }}>`,
  `style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: '700', color: '#F9FAFA', letterSpacing: '-0.03em', lineHeight: 1, textAlign:'center' }}>`
);
calc = calc.replace(
  `style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.35rem' }}>Updates live as you adjust inputs</div>`,
  `style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.35rem', textAlign:'center' }}>Updates live as you adjust inputs</div>`
);
fs.writeFileSync('src/pages/Calculator.jsx', calc, 'utf8');
console.log('✓ Calculator.jsx — total cost centred');

// ── Create contact_submissions table note ─────────────────────────────────────
// (reminder to create this in Supabase SQL editor)
const note = `-- Run this in your Supabase SQL editor:
-- create table if not exists contact_submissions (
--   id uuid default gen_random_uuid() primary key,
--   name text, surname text, email text, message text,
--   created_at timestamptz default now()
-- );
-- alter table contact_submissions enable row level security;
-- create policy "insert anon" on contact_submissions for insert to anon with check (true);
-- create policy "insert auth" on contact_submissions for insert to authenticated with check (true);
`;
fs.writeFileSync('SUPABASE_CONTACT_TABLE.sql', note, 'utf8');
console.log('✓ SUPABASE_CONTACT_TABLE.sql created — run this in your Supabase SQL editor');

console.log('\nScript 4 done.');
