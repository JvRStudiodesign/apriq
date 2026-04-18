const fs = require('fs');

// ── 1. SIGNUP: Fix undefined variables in send-new-user call ─────────────────
let S = fs.readFileSync('src/pages/Signup.jsx', 'utf8');
S = S.replace(
  `fetch('/api/send-new-user', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, email, profession }) }).catch(()=>{});`,
  `fetch('/api/send-new-user', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name: form.full_name, email: form.email, profession: form.profession }) }).catch(()=>{});`
);
fs.writeFileSync('src/pages/Signup.jsx', S, 'utf8');
console.log('✓ Signup.jsx — send-new-user variables fixed');

// ── 2. CALCULATOR: Remove estimate delete + add PDF tracking ──────────────────
let C = fs.readFileSync('src/pages/Calculator.jsx', 'utf8');

// Remove the project_estimates delete — estimates must never be deleted
C = C.replace(
  `    await supabase.from('project_estimates').delete().eq('project_id', selectedProjectId).eq('user_id', user.id);\n    await supabase.from('project_estimates').insert({`,
  `    // Never delete estimates — keep full history\n    await supabase.from('project_estimates').insert({`
);
console.log('✓ Calculator — project_estimates delete removed');

// Add PDF download tracking via onClick on PDFDownloadLink wrapper
C = C.replace(
  `<PDFDownloadLink document={<EstimatePDF inputs={inputs} result={result} userDetails={userDetails} project={selectedProject} client={selectedClient} reference={pdfRef_display} numCats={numCats} isRenovation={isRenovation}/>} fileName={pdfFilename} style={{ display:'block', textDecoration:'none', marginBottom:'0.5rem' }}>`,
  `<PDFDownloadLink document={<EstimatePDF inputs={inputs} result={result} userDetails={userDetails} project={selectedProject} client={selectedClient} reference={pdfRef_display} numCats={numCats} isRenovation={isRenovation}/>} fileName={pdfFilename} style={{ display:'block', textDecoration:'none', marginBottom:'0.5rem' }} onClick={() => {
                  if (result) {
                    supabase.from('pdf_exports').insert({
                      user_id: user?.id,
                      reference_number: pdfRef_display,
                      project_id: selectedProjectId || null,
                      building_category: inputs.use1Category,
                      building_subtype: inputs.use1Subtype,
                      floor_area: inputs.floorArea,
                      total_project_cost: result.totalProjectCost,
                      is_mixed_use: numCats > 1,
                      exported_at: new Date().toISOString(),
                    }).then(({ error }) => { if (error) console.error('PDF export log error:', error); });
                  }
                }}>`
);
console.log('✓ Calculator — PDF download tracking added');

fs.writeFileSync('src/pages/Calculator.jsx', C, 'utf8');

console.log('\nAll done.');
