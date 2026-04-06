import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { HamburgerMenu } from '../components/HamburgerMenu';

const card = { background: '#fff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #eeede8', marginBottom: '1rem' };
const lbl = { display: 'block', fontSize: '0.7rem', fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' };
const inp = { width: '100%', padding: '0.6rem 0.875rem', border: '1.5px solid #e5e5e3', borderRadius: '10px', fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#1a1a18', background: '#fff' };

const FREE_LIMIT = 3;
const PRO_LIMIT = 15;

const EMPTY = { company_name: '', contact_name: '', email: '', address: '' };

export default function Clients() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const tier = profile?.tier || 'free';
  const trialEnd = profile?.trial_end_date ? new Date(profile.trial_end_date) : null;
  const isPro = tier === 'pro' || (tier === 'trial' && trialEnd && trialEnd > new Date());
  const limit = isPro ? PRO_LIMIT : FREE_LIMIT;

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form is completely separate state — never touches clients list
  const [form, setForm] = useState(EMPTY);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase.from('clients').select('*').eq('user_id', user.id).order('company_name');
    setClients(data || []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  function startNew() {
    if (clients.length >= limit) {
      alert(`${isPro ? 'Pro' : 'Free'} plan allows max ${limit} clients.${!isPro ? ' Upgrade to Pro for up to 15.' : ''}`);
      return;
    }
    setForm(EMPTY);
    setEditId(null);
    setShowForm(true);
  }

  function startEdit(c) {
    setForm({ company_name: c.company_name, contact_name: c.contact_name || '', email: c.email || '', address: c.address || '' });
    setEditId(c.id);
    setShowForm(true);
  }

  function cancelForm() { setShowForm(false); setEditId(null); setForm(EMPTY); }

  async function handleSave() {
    if (!form.company_name.trim()) return;
    setSaving(true);
    if (editId) {
      await supabase.from('clients').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editId);
    } else {
      await supabase.from('clients').insert({ user_id: user.id, ...form });
    }
    setSaving(false);
    cancelForm();
    load();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this client?')) return;
    await supabase.from('clients').delete().eq('id', id);
    load();
  }

  const Field = ({ label, field, placeholder, multiline }) => (
    <div style={{ marginBottom: '1rem' }}>
      <label style={lbl}>{label}</label>
      {multiline
        ? <textarea value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} placeholder={placeholder} rows={2} style={{ ...inp, resize: 'vertical' }} />
        : <input value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} placeholder={placeholder} style={inp} />}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f3', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #eeede8', padding: '0.875rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <HamburgerMenu />
          <span style={{ fontWeight: '700', fontSize: '1.5rem', letterSpacing: '-0.04em', cursor: 'pointer' }} onClick={() => navigate('/')}><img src="/logo.png" alt="AprIQ" style={{ height: '36px', maxWidth: '120px', objectFit: 'contain' }} /></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.72rem', color: '#aaa' }}>{clients.length}/{limit}</span>
          <button onClick={startNew} style={{ padding: '6px 14px', background: '#1a1a18', color: '#fff', border: 'none', borderRadius: '9px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>+ Add client</button>
        </div>
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <h1 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1a1a18', marginBottom: '0.25rem' }}>Clients</h1>
        <p style={{ fontSize: '0.78rem', color: '#aaa', marginBottom: '1.5rem' }}>Client details appear on PDF exports when linked to a project.</p>

        {showForm && (
          <div style={card}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1a1a18', display: 'block', marginBottom: '1.25rem' }}>{editId ? 'Edit client' : 'New client'}</span>
            <Field label="Company name *" field="company_name" placeholder="ABC Developers" />
            <Field label="Contact name" field="contact_name" placeholder="John Smith" />
            <Field label="Email" field="email" placeholder="john@example.co.za" />
            <Field label="Address" field="address" placeholder="123 Main Street, Sandton, 2196" multiline />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleSave} disabled={saving || !form.company_name.trim()}
                style={{ flex: 1, padding: '0.625rem', background: '#1a1a18', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
                {saving ? 'Saving...' : 'Save client'}
              </button>
              <button onClick={cancelForm} style={{ padding: '0.625rem 1rem', background: '#fff', color: '#aaa', border: '1.5px solid #e5e5e3', borderRadius: '10px', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            </div>
          </div>
        )}

        {loading ? <p style={{ color: '#aaa', textAlign: 'center', padding: '2rem' }}>Loading...</p>
          : clients.length === 0 && !showForm
          ? <div style={{ ...card, textAlign: 'center', padding: '3rem 1.5rem' }}>
              <p style={{ color: '#bbb', fontSize: '0.875rem', marginBottom: '1rem' }}>No clients yet.</p>
              <button onClick={startNew} style={{ padding: '8px 16px', background: '#1a1a18', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit' }}>Add first client</button>
            </div>
          : clients.map(c => (
            <div key={c.id} style={{ background: '#fff', borderRadius: '12px', padding: '1rem 1.25rem', border: '1px solid #eeede8', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: '600', fontSize: '0.88rem', color: '#1a1a18' }}>{c.company_name}</p>
                {c.contact_name && <p style={{ fontSize: '0.78rem', color: '#888', marginTop: '1px' }}>{c.contact_name}</p>}
                {c.email && <p style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '1px' }}>{c.email}</p>}
                {c.address && <p style={{ fontSize: '0.72rem', color: '#bbb', marginTop: '1px' }}>{c.address}</p>}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => startEdit(c)} style={{ padding: '4px 10px', borderRadius: '8px', border: '1.5px solid #e5e5e3', background: '#fff', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
                <button onClick={() => handleDelete(c.id)} style={{ padding: '4px 10px', borderRadius: '8px', border: '1.5px solid #fdecea', background: '#fdecea', color: '#c0392b', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}