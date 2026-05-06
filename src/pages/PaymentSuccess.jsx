// src/pages/PaymentSuccess.jsx
// PayFast redirects here after a successful payment. We poll the user's
// profile for up to 60s waiting for the ITN handler to flip tier→pro;
// if the ITN is delayed or failed, the user gets a clear "still processing"
// message with their reference, instead of being silently dropped on a
// non-Pro account.

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const POLL_INTERVAL_MS = 2500;
const MAX_WAIT_MS      = 60_000;

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { user, profile, fetchProfile } = useAuth();
  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'timeout'
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (!user?.id) return;
    if (profile?.tier === 'pro') {
      setStatus('success');
      const t = setTimeout(() => navigate('/plans'), 2000);
      return () => clearTimeout(t);
    }

    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      try { await fetchProfile?.(user.id); } catch { /* ignore */ }
      if (cancelled) return;
      if (Date.now() - startRef.current >= MAX_WAIT_MS) {
        setStatus('timeout');
        return;
      }
      setTimeout(tick, POLL_INTERVAL_MS);
    };
    setTimeout(tick, POLL_INTERVAL_MS);
    return () => { cancelled = true; };
  }, [user?.id, profile?.tier, fetchProfile, navigate]);

  return (
    <div style={wrap}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{status === 'timeout' ? '⏳' : '✓'}</div>

      {status === 'processing' && (
        <>
          <h1 style={h1}>Payment received</h1>
          <p style={body}>
            Welcome to AprIQ Pro. We are activating your account — this usually takes a few seconds.
          </p>
          <div style={spinner} />
        </>
      )}

      {status === 'success' && (
        <>
          <h1 style={h1}>You are now on Pro</h1>
          <p style={body}>Redirecting you to your plan…</p>
        </>
      )}

      {status === 'timeout' && (
        <>
          <h1 style={h1}>Payment received — activation pending</h1>
          <p style={body}>
            PayFast confirmed your payment but our activation hasn't come through yet.
            This is usually a delay of a few minutes. Please email{' '}
            <a href="mailto:apriq@apriq.co.za" style={{ color: '#0F4C5C' }}>apriq@apriq.co.za</a>{' '}
            with your account email if you still aren't on Pro in 10 minutes — we'll fix it manually right away.
          </p>
          <button style={btn} onClick={() => navigate('/plans')}>Back to plan</button>
        </>
      )}
    </div>
  );
}

const wrap = {
  minHeight: '100vh',
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  background: '#F9FAFA', fontFamily: 'Roboto, sans-serif', padding: '2rem', textAlign: 'center',
};
const h1   = { color: '#0F4C5C', fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.75rem' };
const body = { color: '#979899', fontSize: '1rem', maxWidth: 480, lineHeight: 1.6 };
const spinner = {
  marginTop: '1.5rem', width: 28, height: 28, borderRadius: '50%',
  border: '3px solid #E4E5E5', borderTopColor: '#0F4C5C',
  animation: 'apr-spin 0.8s linear infinite',
};
const btn = {
  marginTop: '1.5rem', padding: '10px 22px',
  background: '#111111', color: '#F9FAFA',
  border: 'none', borderRadius: 12,
  fontSize: 14, fontWeight: 500, cursor: 'pointer',
};

if (typeof document !== 'undefined' && !document.getElementById('apr-spin-keyframes')) {
  const style = document.createElement('style');
  style.id = 'apr-spin-keyframes';
  style.textContent = '@keyframes apr-spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(style);
}
