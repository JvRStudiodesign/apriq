import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const FREE_LIMIT = 3;
const PRO_LIMIT = 15;

const inp = { width:'100%', padding:'0.6rem 0.875rem', border:'1.5px solid #E4E5E5', borderRadius:'12px', fontSize:'0.875rem', fontFamily:'inherit', outline:'none', color:'#111111', background:'#F9FAFA', boxSizing:'border-box' };
const lbl = { display:'block', fontSize:'0.7rem', fontWeight:'600', color:'#979899', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.4rem' };
const card = { background:'#F9FAFA', borderRadius:'16px', padding:'1.5rem', border:'1px solid #E4E5E5', marginBottom:'1rem' };

// Isolated form component — own state, no parent re-render while typing
function ClientForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || { company_name:'', contact_name:'', email:'', address:'' });
  const upd = (f, v) => setForm(p => ({ ...p, [f]: v }));

  return (
    <div style={card}>
      <span style={{ fontSize:'0.85rem', fontWeight:'600', color:'#111111', display:'block', marginBottom:'1.25rem' }}>
        {initial?.id ? 'Edit client' : 'New client'}
      </span>
      {[
        { label:'Company name *', field:'company_name', placeholder:'ABC Developers' },
        { label:'Contact name', field:'contact_name', placeholder:'John Smith' },
        { label:'Email', field:'email', placeholder:'john@example.co.za' },
      ].map(f => (
        <div key={f.field} style={{ marginBottom:'0.875rem' }}>
          <label style={lbl}>{f.label}</label>
          <input value={form[f.field]} onChange={e => upd(f.field, e.target.value)} placeholder={f.placeholder} style={inp} />
        </div>
      ))}
      <div style={{ marginBottom:'1.25rem' }}>
        <label style={lbl}>Address</label>
        <textarea value={form.address} onChange={e => upd('address', e.target.value)} placeholder="123 Main Street, Sandton, 2196" rows={2} style={{ ...inp, resize:'vertical' }} />
      </div>
      <div style={{ display:'flex', gap:'8px' }}>
        <button onClick={() => onSave(form)} disabled={saving || !form.company_name.trim()}
          style={{ flex:1, padding:'0.625rem', background:'#111111', color:'#F9FAFA', border:'none', borderRadius:'12px', fontSize:'0.875rem', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }}>
          {saving ? 'Saving...' : 'Save client'}
        </button>
        <button onClick={onCancel} style={{ padding:'0.625rem 1rem', background:'#fff', color:'#aaa', border:'1.5px solid #E4E5E5', borderRadius:'12px', fontSize:'0.875rem', cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
      </div>
    </div>
  );
}

export default function Clients() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isPro = profile?.tier === 'pro' || (profile?.tier === 'trial' && profile?.trial_end_date && new Date(profile.trial_end_date) > new Date());
  const limit = isPro ? PRO_LIMIT : FREE_LIMIT;

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase.from('clients').select('*').eq('user_id', user.id).order('company_name');
    setClients(data || []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  async function handleSave(form) {
    if (!form.company_name.trim()) return;
    setSaving(true);
    const payload = { company_name: form.company_name, contact_name: form.contact_name, email: form.email, address: form.address };
    if (editClient?.id) {
      await supabase.from('clients').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editClient.id);
    } else {
      await supabase.from('clients').insert({ user_id: user.id, ...payload });
    }
    setSaving(false);
    setShowForm(false);
    setEditClient(null);
    load();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this client?')) return;
    await supabase.from('clients').delete().eq('id', id);
    load();
  }

  function startNew() {
    if (clients.length >= limit) { alert(`${isPro ? 'Pro' : 'Free'} plan allows max ${limit} clients.${!isPro ? ' Upgrade to Pro for up to 15.' : ''}`); return; }
    setEditClient(null);
    setShowForm(true);
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F9FAFA', fontFamily:"'Roboto', system-ui, sans-serif" }}>

      <div style={{ maxWidth:'960px', margin:'0 auto', padding:'1.5rem 24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.25rem' }}>
          <h1 style={{ fontSize:'1.375rem', fontWeight:'700', color:'#111111', letterSpacing:'-0.01em', fontFamily:"'Roboto', system-ui, sans-serif" }}>Clients</h1>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:'0.72rem', color:'#979899' }}>{clients.length}/{limit}</span>
            <button onClick={startNew} style={{ padding:'6px 14px', background:'#111111', color:'#F9FAFA', border:'none', borderRadius:'10px', fontSize:'0.78rem', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }}>+ Add client</button>
          </div>
        </div>
        <p style={{ fontSize:'0.78rem', color:'#979899', marginBottom:'1.5rem' }}>Client details appear on PDF exports when linked to a project.</p>

        {showForm && (
          <ClientForm
            key={editClient?.id || 'new'}
            initial={editClient ? { ...editClient } : null}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditClient(null); }}
            saving={saving}
          />
        )}

        {loading ? (
          <p style={{ color:'#979899', textAlign:'center', padding:'2rem' }}>Loading...</p>
        ) : clients.length === 0 && !showForm ? (
          <div style={{ ...card, textAlign:'center', padding:'3rem 1.5rem' }}>
            <p style={{ color:'#979899', fontSize:'0.875rem', marginBottom:'1rem' }}>No clients yet.</p>
            <button onClick={startNew} style={{ padding:'8px 16px', background:'#111111', color:'#F9FAFA', border:'none', borderRadius:'12px', fontSize:'0.82rem', fontWeight:'500', cursor:'pointer', fontFamily:'inherit' }}>Add first client</button>
          </div>
        ) : clients.map(c => (
          <div key={c.id} style={{ background:'#F9FAFA', borderRadius:'14px', padding:'1rem 1.25rem', border:'1px solid #E4E5E5', marginBottom:'8px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <p style={{ fontWeight:'600', fontSize:'0.88rem', color:'#111111' }}>{c.company_name}</p>
              {c.contact_name && <p style={{ fontSize:'0.78rem', color:'#979899', marginTop:'1px' }}>{c.contact_name}</p>}
              {c.email && <p style={{ fontSize:'0.75rem', color:'#979899', marginTop:'1px' }}>{c.email}</p>}
              {c.address && <p style={{ fontSize:'0.72rem', color:'#979899', marginTop:'1px' }}>{c.address}</p>}
            </div>
            <div style={{ display:'flex', gap:'6px', flexShrink:0 }}>
              <button onClick={() => { setEditClient(c); setShowForm(true); }} style={{ padding:'4px 10px', borderRadius:'8px', border:'1.5px solid #E4E5E5', background:'#F9FAFA', color:'#111111', fontSize:'0.72rem', cursor:'pointer', fontFamily:'inherit' }}>Edit</button>
              <button onClick={() => handleDelete(c.id)} style={{ padding:'4px 10px', borderRadius:'8px', border:'1.5px solid #E4E5E5', background:'#F9FAFA', color:'#979899', fontSize:'0.72rem', cursor:'pointer', fontFamily:'inherit' }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}