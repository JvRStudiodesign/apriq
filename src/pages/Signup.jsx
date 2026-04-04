import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', full_name: '', company: '', profession: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name, company: form.company, profession: form.profession } }
    });

    if (error) { setError(error.message); setLoading(false); return; }

    if (data.user) {
      await supabase.from('users').upsert({
        id: data.user.id,
        email: form.email,
        full_name: form.full_name,
        company: form.company,
        profession: form.profession,
      });
    }
    navigate('/');
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  }

  const inputStyle = { width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f3' }}>
      <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '12px', width: '100%', maxWidth: '420px', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.25rem' }}>Create your account</h1>
        <p style={{ color: '#888', marginBottom: '2rem', fontSize: '0.9rem' }}>7-day Pro trial — no card required</p>

        {error && <p style={{ color: '#c0392b', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</p>}

        <form onSubmit={handleSignup}>
          <label style={labelStyle}>Full name</label>
          <input type="text" value={form.full_name} onChange={e => update('full_name', e.target.value)} required style={inputStyle} />

          <label style={labelStyle}>Company</label>
          <input type="text" value={form.company} onChange={e => update('company', e.target.value)} style={inputStyle} />

          <label style={labelStyle}>Profession</label>
          <select value={form.profession} onChange={e => update('profession', e.target.value)} style={inputStyle}>
            <option value="">Select your profession</option>
            <option>Architect</option>
            <option>Quantity Surveyor</option>
            <option>Property Developer</option>
            <option>Engineer</option>
            <option>Project Manager</option>
            <option>Other</option>
          </select>

          <label style={labelStyle}>Email</label>
          <input type="email" value={form.email} onChange={e => update('email', e.target.value)} required style={inputStyle} />

          <label style={labelStyle}>Password</label>
          <input type="password" value={form.password} onChange={e => update('password', e.target.value)} required minLength={6} style={{ ...inputStyle, marginBottom: '1.5rem' }} />

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '0.75rem', background: '#1a1a18', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer', marginBottom: '0.75rem' }}>
            {loading ? 'Creating account...' : 'Start free trial'}
          </button>
        </form>

        <button onClick={handleGoogle}
          style={{ width: '100%', padding: '0.75rem', background: '#fff', color: '#1a1a18', border: '1px solid #ddd', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer', marginBottom: '1.5rem' }}>
          Continue with Google
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#888' }}>
          Already have an account? <Link to="/login" style={{ color: '#1a1a18', fontWeight: '500' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
