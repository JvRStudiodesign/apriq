import { OfflineBanner } from './components/OfflineBanner';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Calculator from './pages/Calculator';
import ComingSoon from './pages/ComingSoon';
import LegalPage from './pages/LegalPage';
import UserProfile from './pages/UserProfile';
import Clients from './pages/Clients';
import Projects from './pages/Projects';
import SharedEstimate from './pages/SharedEstimate';
import Upgrade from './pages/Upgrade';
import Billing from './pages/Billing';
import Admin from './pages/Admin';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import HowItWorksPage from './pages/HowItWorksPage';
import FeaturesPage from './pages/FeaturesPage';
import FAQPage from './pages/FAQPage';
import BillingPage from './pages/BillingPage';


function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (user) return <Calculator />;
  return <Navigate to="/home" replace />;
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
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
        </Routes>
      </AuthProvider>
      <OfflineBanner />
    </BrowserRouter>
  );
}
