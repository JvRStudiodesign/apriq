import { useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Upgrade() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { openUpgrade } = useOutletContext() || {};
  const tier = profile?.tier || 'free';
  const isPro = tier === 'pro';

  useEffect(() => {
    if (isPro) return;
    if (typeof openUpgrade === 'function') openUpgrade();
  }, [isPro, openUpgrade]);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.25rem 4rem', fontFamily: "'Roboto', system-ui, sans-serif" }}>
      <h1 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111111' }}>Upgrade</h1>
      {isPro ? (
        <div style={{ background: '#BFD1D6', border: '1px solid #0F4C5C', borderRadius: 16, padding: '1.25rem 1.5rem', color: '#0F4C5C', fontSize: '0.9rem' }}>
          You are already on Pro. <span onClick={() => navigate('/plans')} style={{ fontWeight: 600, cursor: 'pointer', color: '#0F4C5C', textDecoration: 'underline' }}>Manage your plan →</span>
        </div>
      ) : (
        <p style={{ color: '#979899', fontSize: '0.9rem' }}>
          Opening upgrade options…
        </p>
      )}
    </div>
  );
}
