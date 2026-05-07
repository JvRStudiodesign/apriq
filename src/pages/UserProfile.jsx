import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { InstallPWA } from '../components/InstallPWA';
import PlacesAutocomplete from '../components/PlacesAutocomplete';
import { isPro as isProUser } from '../utils/tier';

const card = { background: '#F9FAFA', borderRadius: '16px', padding: '1.5rem', border: '1px solid #E4E5E5', marginBottom: '1rem' };
const lbl = { display: 'block', fontSize: '0.7rem', fontWeight: '600', color: '#979899', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' };
const inp = { width: '100%', padding: '0.6rem 0.875rem', border: '1.5px solid #E4E5E5', borderRadius: '12px', fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#111111', background: '#F9FAFA' };

const PRO_BADGE = <span style={{ marginLeft: '6px', fontSize: '0.6rem', background: '#E4E5E5', color: '#979899', padding: '1px 6px', borderRadius: '6px', fontWeight: '600', verticalAlign: 'middle' }}>PRO</span>;

export default function UserProfile() {
  const { user, profile } = useAuth();
  const isPro = isProUser(profile);

  const [form, setForm] = useState({ full_name: '', company_name: '', phone: '', profession: '', address: '' });
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  // Password change is fully decoupled from profile save. Browsers were
  // autofilling the New password field on profile load, which then triggered
  // a "passwords don't match" alert when the user clicked Save profile after
  // editing their address / name / profession. Splitting into a separate
  // form + button removes that footgun completely.
  const [pwForm, setPwForm] = useState({ newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSaved, setPwSaved] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteErr, setDeleteErr] = useState('');
  const [deleting, setDeleting] = useState(false);

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
        // No cache-buster: react-pdf's <Image src> is happier with a stable
        // URL, and the bucket is upserted so the public URL is canonical.
        logo_url = data.publicUrl;
      }
      setUploading(false);
      setLogoFile(null);
    } else if (logoPreview === null && profile?.logo_url) {
      // User clicked "Remove logo" — clear the URL.
      logo_url = '';
    }

    const updates = { full_name: form.full_name, company_name: form.company_name, phone: form.phone, profession: form.profession, address: form.address, updated_at: new Date().toISOString() };
    if (isPro) updates.logo_url = logo_url;

    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (error) console.error('Profile save error:', error);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleChangePassword() {
    if (pwSaving) return;
    setPwError('');
    setPwSaved(false);
    if (!pwForm.newPassword || !pwForm.confirmPassword) {
      setPwError('Enter and confirm your new password.');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('Passwords do not match.');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwError('Password must be at least 6 characters.');
      return;
    }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPassword });
    setPwSaving(false);
    if (error) {
      setPwError(error.message || 'Could not update password. Please try again.');
      return;
    }
    setPwForm({ newPassword: '', confirmPassword: '' });
    setPwSaved(true);
    setTimeout(() => setPwSaved(false), 3000);
  }

  async function handleDeleteAccount() {
    if (!user?.id || deleting) return;
    setDeleting(true);
    setDeleteErr('');
    try {
      // All app tables (estimates, saved_estimates, estimate_snapshots,
      // projects, clients, profiles, etc.) are FK'd to auth.users(id) with
      // ON DELETE CASCADE. So we just need to delete the auth.users row and
      // every owned row goes with it. The `delete_user` RPC must be set up
      // in Supabase as a SECURITY DEFINER function calling
      // `auth.admin.deleteUser(auth.uid())`.
      const rpc = await supabase.rpc('delete_user');
      if (rpc?.error) throw rpc.error;

      await supabase.auth.signOut();
      window.location.replace('/home');
    } catch (e) {
      console.error('Delete account failed:', e);
      setDeleteErr('Something went wrong. Please try again or contact hello@apriq.co.za');
      setDeleting(false);
      return;
    }
    setDeleting(false);
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
                  ? <img src={logoPreview} alt="Logo" style={{ height: '28px', width: 'auto', objectFit: 'contain', borderRadius: '8px', border: '1px solid #eee', background: '#F9FAFA', padding: '8px' }} />
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
          ].map(f => (
            <div key={f.field} style={{ marginBottom: '1rem' }}>
              <label style={lbl}>{f.label}</label>
              <input style={inp} value={form[f.field]} onChange={e => upd(f.field, e.target.value)} placeholder={f.placeholder} />
            </div>
          ))}
          <div style={{ marginBottom: '1rem' }}>
            <label style={lbl}>Address</label>
            <PlacesAutocomplete
              value={form.address}
              onChange={(v) => upd('address', v)}
              onSelect={(v) => upd('address', v)}
              placeholder="123 Street, City, Province"
              style={inp}
            />
          </div>
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
        <button onClick={handleSave} disabled={saving || uploading}
          style={{ width: '100%', padding: '0.875rem', background: saved ? '#0F4C5C' : '#111111', color: '#F9FAFA', border: 'none', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
          {uploading ? 'Uploading logo...' : saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save profile'}
        </button>

        {/* Change password — fully decoupled from profile save */}
        <form
          autoComplete="off"
          onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }}
          style={{ ...card, marginTop: '1rem' }}
        >
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#111111', display: 'block', marginBottom: '1.25rem' }}>Change password</span>
          {/* Hidden honeypot fields stop Chrome/Safari/iOS from autofilling
              the visible password fields with the user's saved login.
              See https://stackoverflow.com/a/44004531 — same-origin trick. */}
          <input type="text" name="username" autoComplete="username" defaultValue={user?.email || ''} style={{ display: 'none' }} readOnly />
          <input type="password" name="password" autoComplete="current-password" defaultValue="" style={{ display: 'none' }} readOnly />
          {pwError && (
            <div style={{ background: 'rgba(255, 130, 16, 0.30)', border: '1px solid rgba(255, 130, 16, 0.55)', borderRadius: 10, padding: '0.625rem 0.875rem', marginBottom: '0.875rem', fontSize: '0.8rem', color: '#111111' }}>
              {pwError}
            </div>
          )}
          <div style={{ marginBottom: '1rem' }}>
            <label style={lbl}>New password</label>
            <input
              type="password"
              autoComplete="new-password"
              name="apriq-new-password"
              style={inp}
              value={pwForm.newPassword}
              onChange={e => { setPwForm(p => ({ ...p, newPassword: e.target.value })); setPwError(''); setPwSaved(false); }}
              placeholder="Min. 6 characters"
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={lbl}>Confirm new password</label>
            <input
              type="password"
              autoComplete="new-password"
              name="apriq-confirm-password"
              style={inp}
              value={pwForm.confirmPassword}
              onChange={e => { setPwForm(p => ({ ...p, confirmPassword: e.target.value })); setPwError(''); setPwSaved(false); }}
              placeholder="Repeat new password"
            />
          </div>
          <button
            type="submit"
            disabled={pwSaving || !pwForm.newPassword}
            style={{
              width: '100%', padding: '0.75rem',
              background: pwSaved ? '#0F4C5C' : '#111111',
              color: '#F9FAFA', border: 'none', borderRadius: '12px',
              fontSize: '0.85rem', fontWeight: '600',
              cursor: pwSaving || !pwForm.newPassword ? 'not-allowed' : 'pointer',
              opacity: pwSaving || !pwForm.newPassword ? 0.6 : 1,
              fontFamily: 'inherit',
            }}
          >
            {pwSaving ? 'Updating...' : pwSaved ? 'Password updated ✓' : 'Update password'}
          </button>
        </form>
        <div style={{ background:'#F9FAFA', borderRadius:'16px', padding:'1.5rem', border:'1px solid #E4E5E5', marginBottom:'1rem', marginTop:'1rem' }}>
          <span style={{ fontSize:'0.85rem', fontWeight:'600', color:'#111111', display:'block', marginBottom:'0.5rem' }}>Install app</span>
          <p style={{ fontSize:'0.78rem', color:'#979899', marginBottom:'0.75rem', lineHeight:'1.5' }}>Add AprIQ to your home screen for instant access and limited offline use.</p>
          <InstallPWA />
        </div>

        {/* Danger zone */}
        <div style={{ borderTop: '1px solid #E4E5E5', marginTop: 32, paddingTop: 32 }}>
          <div style={{ fontFamily: "'Aptos', 'Segoe UI', system-ui, sans-serif", fontSize: '0.85rem', fontWeight: 600, color: '#979899', marginBottom: 16 }}>
            Danger zone
          </div>
          <button
            type="button"
            onClick={() => { setDeleteErr(''); setDeleteOpen(true); }}
            style={{
              background: 'transparent',
              color: '#CC3333',
              border: '1.5px solid #CC3333',
              borderRadius: 10,
              padding: '0.75rem 1.5rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#FFF0F0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            Delete my account
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteOpen(false); }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              background: '#F9FAFA',
              border: '1px solid #E4E5E5',
              borderRadius: 16,
              padding: 32,
              width: '100%',
              maxWidth: 420,
            }}
          >
            <div style={{ fontFamily: "'Aptos', 'Segoe UI', system-ui, sans-serif", fontSize: '1.1rem', fontWeight: 600, color: '#111111', marginBottom: 10 }}>
              Delete your account?
            </div>
            <div style={{ fontFamily: "'Roboto', 'Segoe UI', system-ui, sans-serif", fontSize: '0.9rem', color: '#979899', lineHeight: 1.6, marginBottom: 18 }}>
              This will permanently delete your account and all saved estimates. This cannot be undone.
            </div>

            {deleteErr && (
              <div style={{ fontFamily: "'Roboto', 'Segoe UI', system-ui, sans-serif", fontSize: '0.9rem', color: '#CC3333', marginBottom: 12 }}>
                {deleteErr}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
                style={{
                  background: 'transparent',
                  color: '#111111',
                  border: '1.5px solid #111111',
                  borderRadius: 10,
                  padding: '0.75rem 1.5rem',
                  fontWeight: 600,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 150ms ease',
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                style={{
                  background: 'transparent',
                  color: '#CC3333',
                  border: '1.5px solid #CC3333',
                  borderRadius: 10,
                  padding: '0.75rem 1.5rem',
                  fontWeight: 600,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 150ms ease',
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? 'Deleting…' : 'Yes, delete my account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}