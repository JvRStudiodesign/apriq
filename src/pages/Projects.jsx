import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { HamburgerMenu } from '../components/HamburgerMenu';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { EstimatePDF } from '../components/EstimatePDF';

const card = { background: '#fff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #eeede8', marginBottom: '1rem' };
const lbl = { display: 'block', fontSize: '0.7rem', fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' };
const inp = { width: '100%', padding: '0.6rem 0.875rem', border: '1.5px solid #e5e5e3', borderRadius: '10px', fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#1a1a18', background: '#fff' };
const sel = { width: '100%', padding: '0.6rem 0.875rem', border: '1.5px solid #e5e5e3', borderRadius: '10px', fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', color: '#1a1a18', background: '#fff', cursor: 'pointer', boxSizing: 'border-box' };

const FREE_LIMIT = 3;
const PRO_LIMIT = 30;

function fmtZAR(n) { if (!n || isNaN(n)) return 'R 0'; return 'R ' + Math.round(n).toLocaleString('en-ZA'); }

const EMPTY_PROJECT = { project_name: '', address: '', description: '', reference_number: '', client_id: '' };
const EMPTY_CLIENT = { company_name: '', contact_name: '', email: '', address: '' };

function PDFBtn({ estimate, project, profile, userEmail }) {
  const inputs = estimate.inputs_json ? (typeof estimate.inputs_json === 'string' ? JSON.parse(estimate.inputs_json) : estimate.inputs_json) : {};
  const result = estimate.result_json ? (typeof estimate.result_json === 'string' ? JSON.parse(estimate.result_json) : estimate.result_json) : null;
  if (!result) return null;
  const now = new Date();
  const ds = now.toISOString().slice(0, 10);
  const ts = now.toTimeString().slice(0, 5).replace(':', '-');
  const ref = project.reference_number || 'APRIQ';
  const filename = `APRIQ-${ref}-${ds}-${ts}.pdf`;
  const userDetails = { ...profile, email: userEmail };
  const client = project.clients || null;
  const numCats = [inputs.use1Category, inputs.use2Category, inputs.use3Category].filter(Boolean).length || 1;
  const isReno = inputs.projectTypeKey === 'Renovation';
  return (
    <PDFDownloadLink document={<EstimatePDF inputs={inputs} result={result} userDetails={userDetails} project={project} client={client} reference={ref} numCats={numCats} isRenovation={isReno} />} fileName={filename} style={{ textDecoration: 'none' }}>
      {({ loading }) => (
        <button style={{ padding: '6px 12px', borderRadius: '9px', border: 'none', background: '#1a1a18', color: '#fff', fontSize: '0.78rem', fontWeight: '500', cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
          {loading ? 'Preparing...' : 'Export PDF'}
        </button>
      )}
    </PDFDownloadLink>
  );
}

export default function Projects() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const tier = profile?.tier || 'free';
  const trialEnd = profile?.trial_end_date ? new Date(profile.trial_end_date) : null;
  const isPro = tier === 'pro' || (tier === 'trial' && trialEnd && trialEnd > new Date());
  const limit = isPro ? PRO_LIMIT : FREE_LIMIT;

  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientForm, setNewClientForm] = useState(EMPTY_CLIENT);
  const [savingClient, setSavingClient] = useState(false);
  const [form, setForm] = useState(EMPTY_PROJECT);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('projects')
        .select('*, clients(company_name,contact_name,email,address), project_estimates(id,total_project_cost,inputs_json,result_json,saved_at,is_latest)')
        .eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('clients').select('id,company_name').eq('user_id', user.id).order('company_name'),
    ]);
    setProjects((p || []).map(proj => ({ ...proj, latestEstimate: (proj.project_estimates || []).find(e => e.is_latest) || null })));
    setClients(c || []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  function startNew() {
    if (projects.length >= limit) { alert(`${isPro ? 'Pro' : 'Free'} plan allows max ${limit} projects.`); return; }
    setForm(EMPTY_PROJECT);
    setEditId(null);
    setShowForm(true);
    setShowNewClient(false);
    setNewClientForm(EMPTY_CLIENT);
  }

  function startEdit(proj) {
    setForm({ project_name: proj.project_name, address: proj.address || '', description: proj.description || '', reference_number: proj.reference_number || '', client_id: proj.client_id || '' });
    setEditId(proj.id);
    setShowForm(true);
    setShowNewClient(false);
  }

  function cancelForm() { setShowForm(false); setEditId(null); setForm(EMPTY_PROJECT); setShowNewClient(false); setNewClientForm(EMPTY_CLIENT); }

  async function addQuickClient() {
    if (!newClientForm.company_name.trim()) return;
    setSavingClient(true);
    const { data } = await supabase.from('clients').insert({ user_id: user.id, ...newClientForm }).select().single();
    if (data) {
      setClients(prev => [...prev, data].sort((a, b) => a.company_name.localeCompare(b.company_name)));
      setForm(f => ({ ...f, client_id: data.id }));
    }
    setNewClientForm(EMPTY_CLIENT);
    setShowNewClient(false);
    setSavingClient(false);
  }

  async function handleSave() {
    if (!form.project_name.trim()) return;
    setSaving(true);
    const payload = { project_name: form.project_name, address: form.address, description: form.description, reference_number: form.reference_number, client_id: form.client_id || null };
    if (editId) {
      await supabase.from('projects').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editId);
    } else {
      await supabase.from('projects').insert({ user_id: user.id, ...payload });
    }
    setSaving(false);
    cancelForm();
    load();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this project and all its saved estimates?')) return;
    await supabase.from('project_estimates').update({ is_latest: false }).eq('project_id', id);
    await supabase.from('projects').delete().eq('id', id);
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
          <span style={{ fontWeight: '700', fontSize: '1.5rem', letterSpacing: '-0.04em', cursor: 'pointer' }} onClick={() => navigate('/')}><img src="/logo.png" alt="AprIQ" style={{ height: '36px', width: '120px', objectFit: 'contain' }} /></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.72rem', color: '#aaa' }}>{projects.length}/{limit} projects</span>
          <button onClick={startNew} style={{ padding: '6px 14px', background: '#1a1a18', color: '#fff', border: 'none', borderRadius: '9px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>+ New project</button>
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <h1 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1a1a18', marginBottom: '0.25rem' }}>Projects</h1>
        <p style={{ fontSize: '0.78rem', color: '#aaa', marginBottom: '1.5rem' }}>Each project holds its saved estimate. Edit or re-export anytime.</p>

        {showForm && (
          <div style={card}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1a1a18', display: 'block', marginBottom: '1.25rem' }}>{editId ? 'Edit project' : 'New project'}</span>
            <Field label="Project name *" field="project_name" placeholder="e.g. Sandton Residential Phase 1" />
            <Field label="Reference number" field="reference_number" placeholder="e.g. PRJ-2026-001" />
            <Field label="Address" field="address" placeholder="123 Main Street, Sandton, 2196" />
            <Field label="Description" field="description" placeholder="Brief project scope..." multiline />

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={lbl}>Client</label>
              <select value={form.client_id} onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))} style={sel}>
                <option value="">No client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
              <button onClick={() => setShowNewClient(v => !v)} style={{ fontSize: '0.72rem', color: '#185fa5', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginTop: '4px' }}>
                {showNewClient ? 'Cancel' : '+ Add new client'}
              </button>
              {showNewClient && (
                <div style={{ marginTop: '8px', padding: '1rem', background: '#f9f9f7', borderRadius: '10px' }}>
                  <p style={{ fontSize: '0.72rem', color: '#888', marginBottom: '0.75rem', fontWeight: '600' }}>NEW CLIENT</p>
                  {[
                    { label: 'Company name *', field: 'company_name', placeholder: 'ABC Developers' },
                    { label: 'Contact name', field: 'contact_name', placeholder: 'John Smith' },
                    { label: 'Email', field: 'email', placeholder: 'john@example.co.za' },
                    { label: 'Address', field: 'address', placeholder: '123 Main St, City' },
                  ].map(f => (
                    <div key={f.field} style={{ marginBottom: '0.75rem' }}>
                      <label style={lbl}>{f.label}</label>
                      <input value={newClientForm[f.field]} onChange={e => setNewClientForm(p => ({ ...p, [f.field]: e.target.value }))} placeholder={f.placeholder} style={inp} />
                    </div>
                  ))}
                  <button onClick={addQuickClient} disabled={savingClient || !newClientForm.company_name.trim()}
                    style={{ padding: '0.5rem 14px', background: '#1a1a18', color: '#fff', border: 'none', borderRadius: '9px', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {savingClient ? 'Adding...' : 'Add client'}
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleSave} disabled={saving || !form.project_name.trim()}
                style={{ flex: 1, padding: '0.625rem', background: '#1a1a18', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
                {saving ? 'Saving...' : 'Save project'}
              </button>
              <button onClick={cancelForm} style={{ padding: '0.625rem 1rem', background: '#fff', color: '#aaa', border: '1.5px solid #e5e5e3', borderRadius: '10px', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            </div>
          </div>
        )}

        {loading ? <p style={{ color: '#aaa', textAlign: 'center', padding: '2rem' }}>Loading...</p>
          : projects.length === 0 && !showForm
          ? <div style={{ ...card, textAlign: 'center', padding: '3rem 1.5rem' }}>
              <p style={{ color: '#bbb', fontSize: '0.875rem', marginBottom: '1rem' }}>No projects yet.</p>
              <button onClick={startNew} style={{ padding: '8px 16px', background: '#1a1a18', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit' }}>Create first project</button>
            </div>
          : projects.map(proj => (
            <div key={proj.id} style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #eeede8', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: proj.latestEstimate ? '0.875rem' : 0 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.92rem', color: '#1a1a18' }}>{proj.project_name}</span>
                    {proj.reference_number && <span style={{ fontSize: '0.68rem', background: '#f0f0ee', color: '#888', padding: '1px 6px', borderRadius: '6px' }}>{proj.reference_number}</span>}
                  </div>
                  {proj.clients?.company_name && <p style={{ fontSize: '0.78rem', color: '#888', marginTop: '1px' }}>{proj.clients.company_name}</p>}
                  {proj.address && <p style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '1px' }}>{proj.address}</p>}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => startEdit(proj)} style={{ padding: '4px 10px', borderRadius: '8px', border: '1.5px solid #e5e5e3', background: '#fff', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
                  <button onClick={() => handleDelete(proj.id)} style={{ padding: '4px 10px', borderRadius: '8px', border: '1.5px solid #fdecea', background: '#fdecea', color: '#c0392b', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
                </div>
              </div>
              {proj.latestEstimate ? (
                <div style={{ borderTop: '1px solid #f5f5f3', paddingTop: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '0.7rem', color: '#aaa', marginBottom: '2px' }}>Latest estimate</p>
                    <p style={{ fontSize: '1rem', fontWeight: '700', color: '#1a1a18' }}>{fmtZAR(proj.latestEstimate.total_project_cost)}</p>
                    <p style={{ fontSize: '0.68rem', color: '#bbb', marginTop: '1px' }}>{new Date(proj.latestEstimate.saved_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button onClick={() => navigate(`/?edit=${proj.latestEstimate.id}`)} style={{ padding: '6px 12px', borderRadius: '9px', border: '1.5px solid #1a1a18', background: '#fff', fontSize: '0.78rem', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit', color: '#1a1a18' }}>
                      Edit estimate
                    </button>
                    {isPro && proj.latestEstimate.inputs_json && proj.latestEstimate.result_json
                      ? <PDFBtn estimate={proj.latestEstimate} project={proj} profile={profile} userEmail={user?.email} />
                      : <button disabled style={{ padding: '6px 12px', borderRadius: '9px', border: '1.5px solid #e5e5e3', background: '#f9f9f7', fontSize: '0.78rem', cursor: 'not-allowed', fontFamily: 'inherit', color: '#ccc' }}>PDF · Pro</button>}
                  </div>
                </div>
              ) : (
                <div style={{ borderTop: '1px solid #f5f5f3', paddingTop: '0.75rem' }}>
                  <p style={{ fontSize: '0.78rem', color: '#bbb' }}>No estimate yet. <span onClick={() => navigate('/')} style={{ color: '#185fa5', cursor: 'pointer' }}>Open configurator →</span></p>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}