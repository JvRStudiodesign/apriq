import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); }
    else navigate('/');
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: 'https://apriq.vercel.app' } });
  }

  async function handleReset(e) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: 'https://apriq.vercel.app' });
    setLoading(false);
    if (error) setError(error.message);
    else setResetSent(true);
  }

  const inp = { width: '100%', padding: '0.65rem 0.875rem', border: '1.5px solid #e5e5e3', borderRadius: '10px', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', color: '#1a1a18', background: '#fff', colorScheme: 'light' };
  const lbl = { display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' };
  const btnP = { width: '100%', padding: '0.75rem', background: '#1a1a18', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' };
  const btnS = { width: '100%', padding: '0.75rem', background: '#fff', color: '#1a1a18', border: '1.5px solid #e5e5e3', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f3', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 2px 24px rgba(0,0,0,0.06)' }}>
        <img src="/logo.jpg" alt="AprIQ" style={{ height:'36px', objectFit:'contain', marginBottom:'0.5rem', display:'block' }} />
        <p style={{ color: '#555', marginBottom: '2rem', fontSize: '0.85rem' }}>Construction Cost Intelligence</p>
        {error && <p style={{ color: '#c0392b', background: '#fdecea', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.8rem', marginBottom: '1rem' }}>{error}</p>}
        {!showReset ? (
          <>
            <form onSubmit={handleLogin}>
              <label style={lbl}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ ...inp, marginBottom: '1rem' }} />
              <label style={lbl}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ ...inp, marginBottom: '0.5rem' }} />
              <div style={{ textAlign: 'right', marginBottom: '1.25rem' }}>
                <button type="button" onClick={() => { setShowReset(true); setError(''); }}
                  style={{ background: 'none', border: 'none', fontSize: '0.8rem', color: '#aaa', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                  Forgot password?
                </button>
              </div>
              <button type="submit" disabled={loading} style={{ ...btnP, marginBottom: '0.75rem' }}>{loading ? 'Signing in...' : 'Sign in'}</button>
            </form>
            <button onClick={handleGoogle} style={{ ...btnS, marginBottom: '1.5rem' }}>Continue with Google</button>
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#aaa' }}>
              No account? <Link to="/signup" style={{ color: '#1a1a18', fontWeight: '500' }}>Start free trial</Link>
            </p>
          </>
        ) : (
          <>
            {resetSent ? (
              <p style={{ color: '#27ae60', background: '#eaf3de', borderRadius: '8px', padding: '0.75rem', fontSize: '0.875rem', marginBottom: '1rem' }}>Check your inbox for a reset link.</p>
            ) : (
              <form onSubmit={handleReset}>
                <p style={{ fontSize: '0.875rem', color: '#888', marginBottom: '1.25rem' }}>Enter your email and we will send a reset link.</p>
                <label style={lbl}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ ...inp, marginBottom: '1.25rem' }} />
                <button type="submit" disabled={loading} style={{ ...btnP, marginBottom: '0.75rem' }}>{loading ? 'Sending...' : 'Send reset link'}</button>
              </form>
            )}
            <button onClick={() => { setShowReset(false); setResetSent(false); setError(''); }}
              style={{ background: 'none', border: 'none', fontSize: '0.85rem', color: '#aaa', cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'center', paddingTop: '0.5rem' }}>
              Back to sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
}