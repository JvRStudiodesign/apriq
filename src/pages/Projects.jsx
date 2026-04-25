import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const FREE_LIMIT = 3;
const PRO_LIMIT = 30;

function fmtZAR(n) {
  if (!n || isNaN(n)) return 'R 0';
  return 'R ' + Math.round(n).toLocaleString('en-ZA');
}

const inp = { width:'100%', padding:'0.6rem 0.875rem', border:'1.5px solid #E4E5E5', borderRadius:'12px', fontSize:'0.875rem', fontFamily:'inherit', outline:'none', color:'#111111', background:'#F9FAFA', boxSizing:'border-box' };
const lbl = { display:'block', fontSize:'0.7rem', fontWeight:'600', color:'#979899', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.4rem' };
const sel = { ...inp, cursor:'pointer' };
const card = { background:'#F9FAFA', borderRadius:'16px', padding:'1.5rem', border:'1px solid #E4E5E5', marginBottom:'1rem' };

// Isolated form component — own state, never causes parent re-render while typing
function ProjectForm({ initial, clients, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || { project_name:'', reference_number:'', address:'', description:'', client_id:'' });
  const upd = (f, v) => setForm(p => ({ ...p, [f]: v }));

  return (
    <div style={card}>
      <span style={{ fontSize:'0.85rem', fontWeight:'600', color:'#111111', display:'block', marginBottom:'1.25rem' }}>
        {initial?.id ? 'Edit project' : 'New project'}
      </span>
      {[
        { label:'Project name *', field:'project_name', placeholder:'e.g. Sandton Residential Phase 1' },
        { label:'Reference number', field:'reference_number', placeholder:'e.g. PRJ-2026-001' },
        { label:'Address', field:'address', placeholder:'123 Main Street, Sandton' },
      ].map(f => (
        <div key={f.field} style={{ marginBottom:'0.875rem' }}>
          <label style={lbl}>{f.label}</label>
          <input value={form[f.field]} onChange={e => upd(f.field, e.target.value)} placeholder={f.placeholder} style={inp} />
        </div>
      ))}
      <div style={{ marginBottom:'0.875rem' }}>
        <label style={lbl}>Description</label>
        <textarea value={form.description} onChange={e => upd('description', e.target.value)} placeholder="Brief project scope..." rows={2} style={{ ...inp, resize:'vertical' }} />
      </div>
      <div style={{ marginBottom:'1.25rem' }}>
        <label style={lbl}>Client</label>
        <select value={form.client_id} onChange={e => upd('client_id', e.target.value)} style={sel}>
          <option value="">No client</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
        </select>
      </div>
      <div style={{ display:'flex', gap:'8px' }}>
        <button onClick={() => onSave(form)} disabled={saving || !form.project_name.trim()}
          style={{ flex:1, padding:'0.625rem', background:'#111111', color:'#F9FAFA', border:'none', borderRadius:'12px', fontSize:'0.875rem', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }}>
          {saving ? 'Saving...' : 'Save project'}
        </button>
        <button onClick={onCancel} style={{ padding:'0.625rem 1rem', background:'#fff', color:'#aaa', border:'1.5px solid #E4E5E5', borderRadius:'12px', fontSize:'0.875rem', cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
      </div>
    </div>
  );
}

function PDFBtn({ estimate, project, profile, userEmail }) {
  const inputs = estimate.inputs_json ? (typeof estimate.inputs_json === 'string' ? JSON.parse(estimate.inputs_json) : estimate.inputs_json) : {};
  const result = estimate.result_json ? (typeof estimate.result_json === 'string' ? JSON.parse(estimate.result_json) : estimate.result_json) : null;
  if (!result) return null;
  const [downloading, setDownloading] = useState(false);
  const now = new Date();
  const ref = project.reference_number || 'APRIQ';
  const filename = `APRIQ-${ref}-${now.toISOString().slice(0,10)}-${now.toTimeString().slice(0,5).replace(':','-')}.pdf`;
  const numCats = [inputs.use1Category, inputs.use2Category, inputs.use3Category].filter(Boolean).length || 1;

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    try {
      const [{ pdf }, { EstimatePDF: EstimatePDFComponent }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../components/EstimatePDF'),
      ]);
      const doc = (
        <EstimatePDFComponent
          inputs={inputs}
          result={result}
          userDetails={{ ...profile, email: userEmail }}
          project={project}
          client={project.clients || null}
          reference={ref}
          numCats={numCats}
          isRenovation={inputs.projectTypeKey === 'Renovation'}
        />
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('PDF export failed:', e);
      alert('Unable to generate PDF right now. Please try again.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      style={{ padding:'6px 12px', borderRadius:'9px', border:'none', background:'#111111', color:'#F9FAFA', fontSize:'0.78rem', fontWeight:'500', cursor:downloading?'wait':'pointer', fontFamily:'inherit', opacity: downloading ? 0.9 : 1 }}
    >
      {downloading ? 'Preparing...' : 'Export PDF'}
    </button>
  );
}

export default function Projects() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isPro = profile?.tier === 'pro' || (profile?.tier === 'trial' && profile?.trial_end_date && new Date(profile.trial_end_date) > new Date());
  const limit = isPro ? PRO_LIMIT : FREE_LIMIT;

  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('projects').select('*, clients(company_name,contact_name,email,address), project_estimates(id,total_project_cost,inputs_json,result_json,saved_at,is_latest)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('clients').select('id,company_name').eq('user_id', user.id).order('company_name'),
    ]);
    setProjects((p || []).map(proj => ({ ...proj, latestEstimate: (proj.project_estimates || []).find(e => e.is_latest) || null })));
    setClients(c || []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  async function handleSave(form) {
    if (!form.project_name.trim()) return;
    setSaving(true);
    const payload = { project_name: form.project_name, address: form.address, description: form.description, reference_number: form.reference_number, client_id: form.client_id || null };
    if (editProject?.id) {
      await supabase.from('projects').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editProject.id);
    } else {
      await supabase.from('projects').insert({ user_id: user.id, ...payload });
    }
    setSaving(false);
    setShowForm(false);
    setEditProject(null);
    load();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this project and all its saved estimates?')) return;
    await supabase.from('project_estimates').delete().eq('project_id', id);
    await supabase.from('projects').delete().eq('id', id);
    load();
  }

  function startNew() {
    if (projects.length >= limit) { alert(`${isPro ? 'Pro' : 'Free'} plan allows max ${limit} projects.`); return; }
    setEditProject(null);
    setShowForm(true);
  }

  function startEdit(proj) {
    setEditProject(proj);
    setShowForm(true);
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F9FAFA', fontFamily:"'Roboto', system-ui, sans-serif" }}>


      <div style={{ maxWidth:'960px', margin:'0 auto', padding:'1.5rem 24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.25rem' }}>
          <h1 style={{ fontSize:'1.375rem', fontWeight:'700', color:'#111111', letterSpacing:'-0.01em', fontFamily:"'Roboto', system-ui, sans-serif" }}>Projects</h1>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:'0.72rem', color:'#979899' }}>{projects.length}/{limit}</span>
            <button onClick={startNew} style={{ padding:'6px 14px', background:'#111111', color:'#F9FAFA', border:'none', borderRadius:'10px', fontSize:'0.78rem', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }}>+ New project</button>
          </div>
        </div>
        <p style={{ fontSize:'0.78rem', color:'#979899', marginBottom:'1.5rem' }}>Each project holds its saved estimate. Edit or re-export anytime.</p>

        {showForm && (
          <ProjectForm
            key={editProject?.id || 'new'}
            initial={editProject ? { project_name: editProject.project_name, reference_number: editProject.reference_number || '', address: editProject.address || '', description: editProject.description || '', client_id: editProject.client_id || '', id: editProject.id } : null}
            clients={clients}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditProject(null); }}
            saving={saving}
          />
        )}

        {loading ? (
          <p style={{ color:'#979899', textAlign:'center', padding:'2rem' }}>Loading...</p>
        ) : projects.length === 0 && !showForm ? (
          <div style={{ ...card, textAlign:'center', padding:'3rem 1.5rem' }}>
            <p style={{ color:'#979899', fontSize:'0.875rem', marginBottom:'1rem' }}>No projects yet.</p>
            <button onClick={startNew} style={{ padding:'8px 16px', background:'#111111', color:'#F9FAFA', border:'none', borderRadius:'12px', fontSize:'0.82rem', fontWeight:'500', cursor:'pointer', fontFamily:'inherit' }}>Create first project</button>
          </div>
        ) : projects.map(proj => (
          <div key={proj.id} style={{ background:'#F9FAFA', borderRadius:'16px', padding:'1.25rem 1.5rem', border:'1px solid #E4E5E5', marginBottom:'10px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: proj.latestEstimate ? '0.875rem' : 0 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'2px' }}>
                  <span style={{ fontWeight:'600', fontSize:'0.92rem', color:'#111111' }}>{proj.project_name}</span>
                  {proj.reference_number && <span style={{ fontSize:'0.68rem', background:'#E4E5E5', color:'#979899', padding:'1px 6px', borderRadius:'6px' }}>{proj.reference_number}</span>}
                </div>
                {proj.clients?.company_name && <p style={{ fontSize:'0.78rem', color:'#979899', marginTop:'1px' }}>{proj.clients.company_name}</p>}
                {proj.address && <p style={{ fontSize:'0.75rem', color:'#aaa', marginTop:'1px' }}>{proj.address}</p>}
              </div>
              <div style={{ display:'flex', gap:'6px', flexShrink:0 }}>
                <button onClick={() => startEdit(proj)} style={{ padding:'4px 10px', borderRadius:'8px', border:'1.5px solid #E4E5E5', background:'#F9FAFA', color:'#111111', fontSize:'0.72rem', cursor:'pointer', fontFamily:'inherit' }}>Edit</button>
                <button onClick={() => handleDelete(proj.id)} style={{ padding:'4px 10px', borderRadius:'8px', border:'1.5px solid #E4E5E5', background:'#F9FAFA', color:'#979899', fontSize:'0.72rem', cursor:'pointer', fontFamily:'inherit' }}>Delete</button>
              </div>
            </div>
            {proj.latestEstimate ? (
              <div style={{ borderTop:'1px solid #f5f5f3', paddingTop:'0.875rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <p style={{ fontSize:'0.7rem', color:'#aaa', marginBottom:'2px' }}>Latest estimate</p>
                  <p style={{ fontSize:'1rem', fontWeight:'700', color:'#111111' }}>{fmtZAR(proj.latestEstimate.total_project_cost)}</p>
                  <p style={{ fontSize:'0.68rem', color:'#bbb', marginTop:'1px' }}>{new Date(proj.latestEstimate.saved_at).toLocaleDateString('en-ZA', { day:'numeric', month:'short', year:'numeric' })}</p>
                </div>
                <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                  <button onClick={() => navigate(`/?edit=${proj.latestEstimate.id}`)} style={{ padding:'6px 12px', borderRadius:'9px', border:'1.5px solid #111111', background:'#F9FAFA', fontSize:'0.78rem', fontWeight:'500', cursor:'pointer', fontFamily:'inherit', color:'#111111' }}>
                    Edit estimate
                  </button>
                  {isPro ? <PDFBtn estimate={proj.latestEstimate} project={proj} profile={profile} userEmail={user?.email} /> : (
                    <button disabled style={{ padding:'6px 12px', borderRadius:'9px', border:'1.5px solid #e5e5e3', background:'#f9f9f7', fontSize:'0.78rem', cursor:'not-allowed', fontFamily:'inherit', color:'#ccc' }}>PDF · Pro</button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ borderTop:'1px solid #f5f5f3', paddingTop:'0.75rem' }}>
                <p style={{ fontSize:'0.78rem', color:'#bbb' }}>No estimate saved yet. <span onClick={() => navigate('/')} style={{ color:'#185fa5', cursor:'pointer' }}>Open configurator →</span></p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}