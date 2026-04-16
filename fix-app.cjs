const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

// Find and replace everything between <Routes> and </Routes>
const start = app.indexOf('        <Routes>');
const end = app.indexOf('        </Routes>') + '        </Routes>'.length;

const newRoutes = `        <Routes>
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
        </Routes>`;

app = app.substring(0, start) + newRoutes + app.substring(end);
fs.writeFileSync('src/App.jsx', app, 'utf8');
console.log('done');
