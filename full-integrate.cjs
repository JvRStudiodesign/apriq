const fs = require('fs');
let layout = fs.readFileSync('src/components/Layout.jsx', 'utf8');
layout = layout.replace(
  "import { useState, useEffect } from 'react';",
  "import { useState, useEffect } from 'react';\nimport { useNavigate } from 'react-router-dom';\nimport { useAuth } from '../hooks/useAuth';"
);
layout = layout.replace(
  "  async function handleSubmit() {",
  "  async function handleGoogle() {\n    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });\n  }\n\n  async function handleSubmit() {"
);
layout = layout.replace(
  "        <p style={m.toggle}>",
  "        {!submitted && (<div style={m.dividerRow}><span style={m.dividerLine}/><span style={m.dividerText}>or</span><span style={m.dividerLine}/></div>)}\n        {!submitted && (<button onClick={handleGoogle} style={m.googleBtn}>Continue with Google</button>)}\n        <p style={m.toggle}>"
);
layout = layout.replace(
  "  toggleLink:{ background:'none', border:'none', color:'#0F4C5C', fontSize:12, fontFamily:\"'Roboto',system-ui,sans-serif\", cursor:'pointer', textDecoration:'underline', padding:0 },",
  "  toggleLink:{ background:'none', border:'none', color:'#0F4C5C', fontSize:12, fontFamily:\"'Roboto',system-ui,sans-serif\", cursor:'pointer', textDecoration:'underline', padding:0 },\n  googleBtn:{ width:'100%', padding:'11px', background:'#F9FAFA', color:'#111111', border:'1px solid #E4E5E5', borderRadius:12, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:\"'Roboto',system-ui,sans-serif\", marginTop:4 },\n  dividerRow:{ display:'flex', alignItems:'center', gap:10, margin:'12px 0 4px' },\n  dividerLine:{ flex:1, height:1, background:'#E4E5E5', display:'block' },\n  dividerText:{ fontFamily:\"'Roboto',system-ui,sans-serif\", fontSize:11, color:'#979899' },"
);
layout = layout.replace(
  "  const isLoggedIn = false;",
  "  const { user } = useAuth();\n  const isLoggedIn = !!user;"
);
layout = layout.replace(
  "                    <Link to=\"/billing\" style={h.dropItem} onClick={() => setProfileOpen(false)}>My Plan</Link>\n                    <Link to=\"/profile\" style={h.dropItem} onClick={() => setProfileOpen(false)}>Profile</Link>\n                    <hr style={h.dropDivider}/>\n                    <button style={{ ...h.dropItem, ...h.dropBtn }}>Sign out</button>",
  "                    <Link to=\"/\" style={h.dropItem} onClick={() => setProfileOpen(false)}>Configurator</Link>\n                    <Link to=\"/projects\" style={h.dropItem} onClick={() => setProfileOpen(false)}>Projects</Link>\n                    <Link to=\"/clients\" style={h.dropItem} onClick={() => setProfileOpen(false)}>Clients</Link>\n                    <hr style={h.dropDivider}/>\n                    <Link to=\"/plans\" style={h.dropItem} onClick={() => setProfileOpen(false)}>My Plan</Link>\n                    <Link to=\"/profile\" style={h.dropItem} onClick={() => setProfileOpen(false)}>Profile</Link>\n                    <hr style={h.dropDivider}/>\n                    <button style={{ ...h.dropItem, ...h.dropBtn }} onClick={async () => { setProfileOpen(false); await supabase.auth.signOut(); }}>Sign out</button>"
);
fs.writeFileSync('src/components/Layout.jsx', layout, 'utf8');
console.log('fixed: Layout.jsx');
let app = fs.readFileSync('src/App.jsx', 'utf8');
app = app.replace(
  `        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<RootRoute />} />
          <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          
          <Route path="/estimate/:token" element={<SharedEstimate />} />
          <Route path="/upgrade" element={<ProtectedRoute><Upgrade /></ProtectedRoute>} />
          <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
          <Route path="/admin" element={<Admin />} />
          <Route element={<Layout />}>
            <Route path="/about" element={<AboutPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/plans" element={<BillingPage />} />
            <Route path="/home" element={<LandingPage />} />
            <Route path="/legal" element={<LegalPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>`,
  `        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin" element={<Admin />} />
          <Route element={<Layout />}>
            <Route path="/" element={<RootRoute />} />
            <Route path="/home" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/legal" element={<LegalPage />} />
            <Route path="/plans" element={<BillingPage />} />
            <Route path="/estimate/:token" element={<SharedEstimate />} />
            <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/upgrade" element={<ProtectedRoute><Upgrade /></ProtectedRoute>} />
            <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>`
);
fs.writeFileSync('src/App.jsx', app, 'utf8');
console.log('fixed: App.jsx');
let calc = fs.readFileSync('src/pages/Calculator.jsx', 'utf8');
calc = calc.replace("import { HamburgerMenu } from '../components/HamburgerMenu';\n", '');
calc = calc.replace(
  "          <HamburgerMenu />\n          <img src=\"/logo-transparent.png\" alt=\"AprIQ\" style={{ height: '88px', width: 'auto', objectFit: 'contain', mixBlendMode: 'multiply' }} />",
  "          {/* Header handled by Layout */}"
);
fs.writeFileSync('src/pages/Calculator.jsx', calc, 'utf8');
console.log('fixed: Calculator.jsx');
console.log('integration complete');
