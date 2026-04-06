import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { HamburgerMenu } from '../components/HamburgerMenu';

const card = { background: '#fff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #eeede8', marginBottom: '1rem' };
const lbl = { display: 'block', fontSize: '0.7rem', fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' };
const inp = { width: '100%', padding: '0.6rem 0.875rem', border: '1.5px solid #e5e5e3', borderRadius: '10px', fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#1a1a18', background: '#fff' };

const PRO_BADGE = <span style={{ marginLeft: '6px', fontSize: '0.6rem', background: '#f0f0ee', color: '#aaa', padding: '1px 6px', borderRadius: '6px', fontWeight: '600', verticalAlign: 'middle' }}>PRO</span>;

export default function UserProfile() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const tier = profile?.tier || 'free';
  const trialEnd = profile?.trial_end_date ? new Date(profile.trial_end_date) : null;
  const isPro = tier === 'pro' || (tier === 'trial' && trialEnd && trialEnd > new Date());

  const [form, setForm] = useState({ full_name: '', company_name: '', phone: '' });
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

    const updates = { full_name: form.full_name, company_name: form.company_name, phone: form.phone, updated_at: new Date().toISOString() };
    if (isPro) updates.logo_url = logo_url;

    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (error) console.error('Profile save error:', error);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f3', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #eeede8', padding: '0.875rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <HamburgerMenu />
          <span style={{ fontWeight: '700', fontSize: '1.5rem', letterSpacing: '-0.04em', cursor: 'pointer' }} onClick={() => navigate('/')}><img src="/logo.png" alt="AprIQ" style={{ height: '36px', maxWidth: '120px', objectFit: 'contain' }} /></span>
        </div>
        <span style={{ fontSize: '0.78rem', color: '#aaa' }}>User Profile</span>
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <h1 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1a1a18', marginBottom: '0.25rem' }}>Profile</h1>
        <p style={{ fontSize: '0.78rem', color: '#aaa', marginBottom: '1.5rem' }}>Your details auto-populate on every PDF export.</p>

        {/* Logo */}
        <div style={card}>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1a1a18', display: 'block', marginBottom: '1rem' }}>
            Company logo {!isPro && PRO_BADGE}
          </span>
          {isPro ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                {logoPreview
                  ? <img src={logoPreview} alt="Logo" style={{ width: '160px', height: '70px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #eee', background: '#fafafa', padding: '8px' }} />
                  : <div style={{ width: '160px', height: '70px', borderRadius: '8px', border: '1.5px dashed #e5e5e3', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
                      <span style={{ fontSize: '0.65rem', color: '#ccc' }}>No logo</span>
                    </div>}
                <div>
                  <button onClick={() => fileRef.current.click()} style={{ padding: '6px 14px', borderRadius: '9px', border: '1.5px solid #e5e5e3', background: '#fff', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit', display: 'block', marginBottom: '4px' }}>
                    {uploading ? 'Uploading...' : logoPreview ? 'Change logo' : 'Upload logo'}
                  </button>
                  <span style={{ fontSize: '0.68rem', color: '#bbb' }}>PNG, SVG or JPEG · max 3MB</span>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={handleLogoChange} style={{ display: 'none' }} />
              {logoPreview && (
                <button onClick={() => { setLogoPreview(null); setLogoFile(null); setSaved(false); }}
                  style={{ fontSize: '0.72rem', color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  Remove logo
                </button>
              )}
            </>
          ) : (
            <p style={{ fontSize: '0.78rem', color: '#aaa', padding: '0.75rem', background: '#f9f9f7', borderRadius: '8px' }}>
              Upgrade to Pro to upload your company logo.
            </p>
          )}
        </div>

        {/* Details */}
        <div style={card}>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1a1a18', display: 'block', marginBottom: '1.25rem' }}>Your details</span>
          {[
            { label: 'Full name', field: 'full_name', placeholder: 'Name Surname' },
            { label: 'Company / firm name', field: 'company_name', placeholder: 'Your practice or company' },
            { label: 'Phone', field: 'phone', placeholder: '+27 82 000 0000' },
          ].map(f => (
            <div key={f.field} style={{ marginBottom: '1rem' }}>
              <label style={lbl}>{f.label}</label>
              <input style={inp} value={form[f.field]} onChange={e => upd(f.field, e.target.value)} placeholder={f.placeholder} />
            </div>
          ))}
          <div style={{ marginBottom: '1rem' }}>
            <label style={lbl}>Email</label>
            <input style={{ ...inp, background: '#f9f9f7', color: '#aaa' }} value={user?.email || ''} disabled />
          </div>
        </div>

        <button onClick={handleSave} disabled={saving || uploading}
          style={{ width: '100%', padding: '0.875rem', background: saved ? '#27ae60' : '#1a1a18', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
          {uploading ? 'Uploading logo...' : saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save profile'}
        </button>
      </div>
    </div>
  );
}