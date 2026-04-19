import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', full_name: '', company: '', profession: '', referral_source: '' });
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError('');
    if (!acceptedLegal) {
      setError('Please confirm you have read and agree to the Terms of Service and Privacy Policy.');
      return;
    }
    setLoading(true);

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
      // Notify founder of new signup
      fetch('/api/send-email', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'new_user', name: form.full_name, email: form.email, profession: form.profession }) }).catch(()=>{});
      // Send welcome email to user
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type:'welcome', to: form.email, name: form.full_name }),
      });
    } catch (e) { console.error('Welcome email error:', e); }
    // Show email confirmation message instead of navigating
    setLoading(false);
    setError('');
    navigate('/');
  }

  async function handleGoogle() {
    setError('');
    if (!acceptedLegal) {
      setError('Please confirm you have read and agree to the Terms of Service and Privacy Policy.');
      return;
    }
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: 'https://www.apriq.co.za' } });
  }

  const inputStyle = { width: '100%', padding: '0.625rem 0.75rem', border: '1.5px solid #E4E5E5', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.9rem', boxSizing: 'border-box', background: '#F9FAFA', color: '#111111', colorScheme: 'light' };
  const labelStyle = { display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '600', color: '#979899', textTransform: 'uppercase', letterSpacing: '0.04em' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFA' }}>
      <div style={{ background: '#F9FAFA', padding: '2.5rem', borderRadius: '20px', width: '100%', maxWidth: '420px', boxShadow: '0 1px 12px rgba(0,0,0,0.04)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.25rem', color: '#111111' }}>Create your account</h1>
        <p style={{ color: '#979899', marginBottom: '2rem', fontSize: '0.9rem' }}>30-day Pro trial — no card required</p>

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
          <select value={form.referral_source} onChange={e => update('referral_source', e.target.value)} style={{ ...inputStyle, marginBottom: '1rem' }}>
            <option value="">Select an option</option>
            <option value="shared_estimate">Someone shared an estimate with me</option>
            <option value="linkedin">LinkedIn</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="google">Google search</option>
            <option value="word_of_mouth">Word of mouth</option>
            <option value="other">Other</option>
          </select>

          <div style={{ background: '#f9f9f7', borderRadius: '10px', padding: '0.75rem 0.875rem', marginBottom: '1.25rem', border: '1.5px solid #E4E5E5' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '0.78rem', color: '#979899', lineHeight: 1.5 }}>
              <input
                type="checkbox"
                checked={acceptedLegal}
                onChange={e => setAcceptedLegal(e.target.checked)}
                required
                aria-required="true"
                style={{ cursor: 'pointer', marginTop: '2px', flexShrink: 0, accentColor: '#FF8210', colorScheme: 'light' }}
              />
              <span style={{ color: '#111111' }}>
                I have read and agree to the{' '}
                <Link to="/legal" target="_blank" rel="noopener noreferrer" style={{ color: '#FF8210', fontWeight: '600' }} onClick={e => e.stopPropagation()}>
                  Terms of Service and Privacy Policy
                </Link>
                .
              </span>
            </label>
          </div>

          <button type="submit" disabled={loading || !acceptedLegal}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: acceptedLegal && !loading ? '#111111' : '#979899',
              color: '#F9FAFA',
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.9rem',
              fontWeight: '500',
              cursor: acceptedLegal && !loading ? 'pointer' : 'not-allowed',
              marginBottom: '0.75rem',
            }}>
            {loading ? 'Creating account...' : 'Start free trial'}
          </button>
        </form>

        <button type="button" onClick={handleGoogle} disabled={!acceptedLegal}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: '#fff',
            color: '#1a1a18',
            border: '1.5px solid #E4E5E5',
            borderRadius: '12px',
            fontSize: '0.9rem',
            fontWeight: '500',
            cursor: acceptedLegal ? 'pointer' : 'not-allowed',
            marginBottom: '1.5rem',
            opacity: acceptedLegal ? 1 : 0.55,
          }}>
          Continue with Google
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#888' }}>
          Already have an account? <Link to="/login" style={{ color: '#FF8210', fontWeight: '500' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
