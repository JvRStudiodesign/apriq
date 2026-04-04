import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); }
    else navigate('/');
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f3' }}>
      <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.25rem' }}>AprIQ</h1>
        <p style={{ color: '#888', marginBottom: '2rem', fontSize: '0.9rem' }}>Construction Cost Intelligence</p>

        {error && <p style={{ color: '#c0392b', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</p>}

        <form onSubmit={handleLogin}>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
            style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', boxSizing: 'border-box' }} />

          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
            style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', boxSizing: 'border-box' }} />

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '0.75rem', background: '#1a1a18', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer', marginBottom: '0.75rem' }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <button onClick={handleGoogle}
          style={{ width: '100%', padding: '0.75rem', background: '#fff', color: '#1a1a18', border: '1px solid #ddd', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer', marginBottom: '1.5rem' }}>
          Continue with Google
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#888' }}>
          No account? <Link to="/signup" style={{ color: '#1a1a18', fontWeight: '500' }}>Sign up free</Link>
        </p>
      </div>
    </div>
  );
}
