import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { InstallPWA } from '../components/InstallPWA';

const card = { background: '#F9FAFA', borderRadius: '16px', padding: '1.5rem', border: '1px solid #E4E5E5', marginBottom: '1rem' };
const lbl = { display: 'block', fontSize: '0.7rem', fontWeight: '600', color: '#979899', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' };
const inp = { width: '100%', padding: '0.6rem 0.875rem', border: '1.5px solid #E4E5E5', borderRadius: '12px', fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#111111', background: '#F9FAFA' };

const PRO_BADGE = <span style={{ marginLeft: '6px', fontSize: '0.6rem', background: '#E4E5E5', color: '#979899', padding: '1px 6px', borderRadius: '6px', fontWeight: '600', verticalAlign: 'middle' }}>PRO</span>;

export default function UserProfile() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const tier = profile?.tier || 'free';
  const trialEnd = profile?.trial_end_date ? new Date(profile.trial_end_date) : null;
  const isPro = tier === 'pro' || (tier === 'trial' && trialEnd && trialEnd > new Date());

  const [form, setForm] = useState({ full_name: '', company_name: '', phone: '', profession: '', address: '', newPassword: '', confirmPassword: '' });
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  // Load profile once — NOT in a dependency loop
  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name || '',
      company_name: profile.company_name || '',
      phone: profile.phone || '',
      profession: profile.profession || '',
      address: profile.address || '',
    });
    if (profile.logo_url) setLogoPreview(profile.logo_url);
  }, [profile?.id]); // only run when profile ID changes, not on every profile update

  function upd(f, v) { setForm(p => ({ ...p, [f]: v })); setSaved(false); }

  function handleLogoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { alert('Logo must be under 3MB'); return; }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);
    setSaved(false);
  }

  async function handleSave() {
    if (!user?.id) return;
    setSaving(true);
    let logo_url = profile?.logo_url || '';

    if (logoFile && isPro) {
      setUploading(true);
      const ext = logoFile.name.split('.').pop().toLowerCase();
      const path = `${user.id}/logo.${ext}`;
      const { error } = await supabase.storage.from('logos').upload(path, logoFile, { upsert: true, contentType: logoFile.type });
      if (!error) {
        const { data } = supabase.storage.from('logos').getPublicUrl(path);
        logo_url = data.publicUrl + '?v=' + Date.now();
      }
      setUploading(false);
      setLogoFile(null);
    }

    const updates = { full_name: form.full_name, company_name: form.company_name, phone: form.phone, profession: form.profession, address: form.address, updated_at: new Date().toISOString() };
    if (isPro) updates.logo_url = logo_url;

    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (error) console.error('Profile save error:', error);
    setSaving(false);
    // Change password if filled
    if (form.newPassword) {
      if (form.newPassword !== form.confirmPassword) {
        alert('Passwords do not match'); setSaving(false); return;
      }
      if (form.newPassword.length < 6) {
        alert('Password must be at least 6 characters'); setSaving(false); return;
      }
      await supabase.auth.updateUser({ password: form.newPassword });
      upd('newPassword', ''); upd('confirmPassword', '');
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFA', fontFamily: "'Roboto', system-ui, sans-serif" }}>


      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: '700', color: '#111111', marginBottom: '0.25rem', letterSpacing: '-0.01em', fontFamily: "'Roboto', system-ui, sans-serif" }}>Profile</h1>
        <p style={{ fontSize: '0.78rem', color: '#979899', marginBottom: '1.5rem' }}>Your details auto-populate on every PDF export.</p>

        {/* Logo */}
        <div style={card}>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#111111', display: 'block', marginBottom: '1rem' }}>
            Company logo {!isPro && PRO_BADGE}
          </span>
          {isPro ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                {logoPreview
                  ? <img src={logoPreview} alt="Logo" style={{ width: '160px', height: '28px', width: 'auto', objectFit: 'contain', borderRadius: '8px', border: '1px solid #eee', background: '#F9FAFA', padding: '8px' }} />
                  : <div style={{ width: '160px', height: '70px', borderRadius: '8px', border: '1.5px dashed #E4E5E5', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFA', colorScheme: 'light' }}>
                      <span style={{ fontSize: '0.65rem', color: '#979899' }}>No logo</span>
                    </div>}
                <div>
                  <button onClick={() => fileRef.current.click()} style={{ padding: '6px 14px', borderRadius: '9px', border: '1.5px solid #E4E5E5', background: '#F9FAFA', color: '#111111', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit', display: 'block', marginBottom: '4px', colorScheme: 'light' }}>
                    {uploading ? 'Uploading...' : logoPreview ? 'Change logo' : 'Upload logo'}
                  </button>
                  <span style={{ fontSize: '0.68rem', color: '#bbb' }}>PNG, SVG or JPEG · max 3MB</span>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={handleLogoChange} style={{ display: 'none' }} />
              {logoPreview && (
                <button onClick={() => { setLogoPreview(null); setLogoFile(null); setSaved(false); }}
                  style={{ fontSize: '0.72rem', color: '#0F4C5C', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  Remove logo
                </button>
              )}
            </>
          ) : (
            <p style={{ fontSize: '0.78rem', color: '#979899', padding: '0.75rem', background: '#F9FAFA', borderRadius: '10px' }}>
              Upgrade to Pro to upload your company logo.
            </p>
          )}
        </div>

        {/* Details */}
        <div style={card}>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#111111', display: 'block', marginBottom: '1.25rem' }}>Your details</span>
          {[
            { label: 'Full name', field: 'full_name', placeholder: 'Name Surname' },
            { label: 'Company / firm name', field: 'company_name', placeholder: 'Your practice or company' },
            { label: 'Phone', field: 'phone', placeholder: '+27 82 000 0000' },
            { label: 'Address', field: 'address', placeholder: '123 Street, City, Province' },
          ].map(f => (
            <div key={f.field} style={{ marginBottom: '1rem' }}>
              <label style={lbl}>{f.label}</label>
              <input style={inp} value={form[f.field]} onChange={e => upd(f.field, e.target.value)} placeholder={f.placeholder} />
            </div>
          ))}
          <div style={{ marginBottom: '1rem' }}>
            <label style={lbl}>Email</label>
            <input style={{ ...inp, background: '#E4E5E5', color: '#979899' }} value={user?.email || ''} disabled />
          </div>
        </div>

        {/* Profession */}
        <div style={card}>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#111111', display: 'block', marginBottom: '1.25rem' }}>Profession</span>
          <select style={inp} value={form.profession} onChange={e => upd('profession', e.target.value)}>
            <option value="">Select your profession</option>
            <option value="Architect">Architect</option>
            <option value="Quantity Surveyor">Quantity Surveyor</option>
            <option value="Property Developer">Property Developer</option>
            <option value="Engineer">Engineer</option>
            <option value="Project Manager">Project Manager</option>
            <option value="Other">Other</option>
          </select>
        </div>
        {/* Change password */}
        <div style={card}>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#111111', display: 'block', marginBottom: '1.25rem' }}>Change password</span>
          <div style={{ marginBottom: '1rem' }}>
            <label style={lbl}>New password</label>
            <input type="password" style={inp} value={form.newPassword} onChange={e => upd('newPassword', e.target.value)} placeholder="Min. 6 characters" />
          </div>
          <div style={{ marginBottom: '0.25rem' }}>
            <label style={lbl}>Confirm new password</label>
            <input type="password" style={inp} value={form.confirmPassword} onChange={e => upd('confirmPassword', e.target.value)} placeholder="Repeat new password" />
          </div>
        </div>
        <button onClick={handleSave} disabled={saving || uploading}
          style={{ width: '100%', padding: '0.875rem', background: saved ? '#0F4C5C' : '#111111', color: '#F9FAFA', border: 'none', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
          {uploading ? 'Uploading logo...' : saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save profile'}
        </button>
        <div style={{ background:'#F9FAFA', borderRadius:'16px', padding:'1.5rem', border:'1px solid #E4E5E5', marginBottom:'1rem', marginTop:'1rem' }}>
          <span style={{ fontSize:'0.85rem', fontWeight:'600', color:'#111111', display:'block', marginBottom:'0.5rem' }}>Install app</span>
          <p style={{ fontSize:'0.78rem', color:'#979899', marginBottom:'0.75rem', lineHeight:'1.5' }}>Add AprIQ to your home screen for instant access and limited offline use.</p>
          <InstallPWA />
        </div>
      </div>
    </div>
  );
}