import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', full_name: '', company: '', profession: '', referral_source: '' });
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
        referral_source: form.referral_source || null,
      });
    }
    // Send welcome email
    try {
      fetch('/api/send-email', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name: form.full_name, email: form.email, profession: form.profession }) }).catch(()=>{});
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: form.email, name: form.full_name }),
      });
    } catch (e) { console.error('Welcome email error:', e); }
    navigate('/');
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: 'https://www.apriq.co.za' } });
  }

  const inputStyle = { width: '100%', padding: '0.625rem 0.75rem', border: '1.5px solid #E4E5E5', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.9rem', boxSizing: 'border-box', background: '#F9FAFA', color: '#111111', colorScheme: 'light' };
  const labelStyle = { display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '600', color: '#979899', textTransform: 'uppercase', letterSpacing: '0.04em' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFA' }}>
      <div style={{ background: '#F9FAFA', padding: '2.5rem', borderRadius: '20px', width: '100%', maxWidth: '420px', boxShadow: '0 1px 12px rgba(0,0,0,0.04)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.25rem', color: '#111111' }}>Create your account</h1>
        <p style={{ color: '#979899', marginBottom: '2rem', fontSize: '0.9rem' }}>7-day Pro trial — no card required</p>

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
          <input type="password" value={form.password} onChange={e => update('password', e.target.value)} required minLength={6} style={{ ...inputStyle, marginBottom: '1rem' }} />

          <label style={labelStyle}>How did you hear about us?</label>
          <select value={form.referral_source} onChange={e => update('referral_source', e.target.value)} style={{ ...inputStyle, marginBottom: '1.5rem' }}>
            <option value="">Select an option</option>
            <option value="shared_estimate">Someone shared an estimate with me</option>
            <option value="linkedin">LinkedIn</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="google">Google search</option>
            <option value="word_of_mouth">Word of mouth</option>
            <option value="other">Other</option>
          </select>

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '0.75rem', background: '#111111', color: '#F9FAFA', border: 'none', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer', marginBottom: '0.75rem' }}>
            {loading ? 'Creating account...' : 'Start free trial'}
          </button>
        </form>

        <button onClick={handleGoogle}
          style={{ width: '100%', padding: '0.75rem', background: '#fff', color: '#1a1a18', border: '1.5px solid #E4E5E5', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer', marginBottom: '1.5rem' }}>
          Continue with Google
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#888' }}>
          Already have an account? <Link to="/login" style={{ color: '#0F4C5C', fontWeight: '500' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
