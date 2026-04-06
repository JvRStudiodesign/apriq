import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { HamburgerMenu } from '../components/HamburgerMenu';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { EstimatePDF } from '../components/EstimatePDF';

const card = { background: '#fff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #eeede8', marginBottom: '1rem' };
const lbl  = { display: 'block', fontSize: '0.7rem', fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' };
const inp  = { width: '100%', padding: '0.6rem 0.875rem', border: '1.5px solid #e5e5e3', borderRadius: '10px', fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#1a1a18' };
const sel  = { width: '100%', padding: '0.6rem 0.875rem', border: '1.5px solid #e5e5e3', borderRadius: '10px', fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', color: '#1a1a18', background: '#fff', cursor: 'pointer', boxSizing: 'border-box' };

const FREE_LIMIT = 3;
const PRO_LIMIT  = 30;

function fmtZAR(n) { if (!n || isNaN(n)) return 'R 0'; return 'R ' + Math.round(n).toLocaleString('en-ZA'); }

function PDFBtn({ estimate, project, profile, userEmail }) {
  const inputs = estimate.inputs_json ? JSON.parse(estimate.inputs_json) : {};
  const result = estimate.result_json ? JSON.parse(estimate.result_json) : null;
  if (!result) return null;
  const now = new Date();
  const ds = now.toISOString().slice(0,10);
  const ts = now.toTimeString().slice(0,5).replace(':','-');
  const ref = project.reference_number || 'APRIQ';
  const filename = `APRIQ-${ref}-${ds}-${ts}.pdf`;
  const userDetails = { ...profile, email: userEmail };
  const client = project.clients || null;
  const numCats = [inputs.use1Category,inputs.use2Category,inputs.use3Category].filter(Boolean).length || 1;
  const isReno = inputs.projectTypeKey === 'Renovation';
  return (
    <PDFDownloadLink document={<EstimatePDF inputs={inputs} result={result} userDetails={userDetails} project={project} client={client} reference={ref} numCats={numCats} isRenovation={isReno}/>} fileName={filename} style={{ textDecoration:'none' }}>
      {({ loading }) => (
        <button style={{ padding:'6px 12px', borderRadius:'9px', border:'none', background:'#1a1a18', color:'#fff', fontSize:'0.78rem', fontWeight:'500', cursor: loading?'wait':'pointer', fontFamily:'inherit' }}>
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
  const trialOk = tier === 'trial' && trialEnd && trialEnd > new Date();
  const isPro = tier === 'pro' || trialOk;
  const limit = isPro ? PRO_LIMIT : FREE_LIMIT;

  const [projects, setProjects]     = useState([]);
  const [clients, setClients]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editId, setEditId]         = useState(null);
  const [saving, setSaving]         = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [form, setForm] = useState({ project_name:'', address:'', description:'', reference_number:'', client_id:'' });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('projects').select('*, clients(company_name,contact_name,email), estimates!estimates_project_id_fkey(id,total_project_cost,inputs_json,result_json,created_at,is_latest,reference_number)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('clients').select('id,company_name').eq('user_id', user.id).order('company_name'),
    ]);
    setProjects((p||[]).map(proj => ({ ...proj, latestEstimate: (proj.estimates||[]).find(e=>e.is_latest)||null })));
    setClients(c||[]);
    setLoading(false);
  }

  function startNew() {
    if (projects.length >= limit) { alert(`${isPro?'Pro':'Free'} plan allows max ${limit} projects.${!isPro?' Upgrade to Pro for up to 30.':''}`); return; }
    setForm({ project_name:'', address:'', description:'', reference_number:'', client_id:'' });
    setEditId(null); setShowForm(true);
  }

  function startEdit(proj) {
    setForm({ project_name:proj.project_name, address:proj.address||'', description:proj.description||'', reference_number:proj.reference_number||'', client_id:proj.client_id||'' });
    setEditId(proj.id); setShowForm(true);
  }

  async function addQuickClient() {
    if (!newClientName.trim()) return;
    const { data } = await supabase.from('clients').insert({ user_id:user.id, company_name:newClientName.trim() }).select().single();
    if (data) { setClients(prev => [...prev, data].sort((a,b)=>a.company_name.localeCompare(b.company_name))); setForm(f=>({...f,client_id:data.id})); }
    setNewClientName(''); setShowNewClient(false);
  }

  async function handleSave() {
    if (!form.project_name.trim()) return;
    setSaving(true);
    const payload = { project_name:form.project_name, address:form.address, description:form.description, reference_number:form.reference_number, client_id:form.client_id||null };
    if (editId) { await supabase.from('projects').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editId); }
    else { await supabase.from('projects').insert({ user_id:user.id, ...payload }); }
    setSaving(false); setShowForm(false); setEditId(null); load();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this project and all its saved estimates?')) return;
    await supabase.from('estimates').update({ project_id: null, is_latest: false }).eq('project_id', id);
    await supabase.from('projects').delete().eq('id', id);
    load();
  }

  const fld = (label, field, placeholder, multiline=false) => (
    <div key={field} style={{ marginBottom:'1rem' }}>
      <label style={lbl}>{label}</label>
      {multiline
        ? <textarea value={form[field]} onChange={e=>setForm(p=>({...p,[field]:e.target.value}))} placeholder={placeholder} rows={2} style={{...inp,resize:'vertical'}}/>
        : <input value={form[field]} onChange={e=>setForm(p=>({...p,[field]:e.target.value}))} placeholder={placeholder} style={inp}/>}
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#f5f5f3', fontFamily:'-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div style={{ background:'#fff', borderBottom:'1px solid #eeede8', padding:'0.875rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
          <HamburgerMenu />
          <span style={{ fontWeight:'700', fontSize:'1rem', letterSpacing:'-0.02em', cursor:'pointer' }} onClick={()=>navigate('/')}>AprIQ</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <span style={{ fontSize:'0.72rem', color:'#aaa' }}>{projects.length}/{limit} projects</span>
          <button onClick={startNew} style={{ padding:'6px 14px', background:'#1a1a18', color:'#fff', border:'none', borderRadius:'9px', fontSize:'0.78rem', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }}>+ New project</button>
        </div>
      </div>

      <div style={{ maxWidth:'680px', margin:'0 auto', padding:'2rem 1.25rem' }}>
        <h1 style={{ fontSize:'1.2rem', fontWeight:'700', color:'#1a1a18', marginBottom:'0.25rem' }}>Projects</h1>
        <p style={{ fontSize:'0.78rem', color:'#aaa', marginBottom:'1.5rem' }}>Each project holds one saved estimate. Edit or re-export anytime.</p>

        {showForm && (
          <div style={card}>
            <span style={{ fontSize:'0.85rem', fontWeight:'600', color:'#1a1a18', display:'block', marginBottom:'1.25rem' }}>{editId ? 'Edit project' : 'New project'}</span>
            {fld('Project name *', 'project_name', 'e.g. Sandton Residential Phase 1')}
            {fld('Reference number', 'reference_number', 'e.g. PRJ-2026-001')}
            {fld('Address', 'address', '123 Main Street, Sandton, 2196')}
            {fld('Description', 'description', 'Brief project scope...', true)}
            <div style={{ marginBottom:'1.25rem' }}>
              <label style={lbl}>Client</label>
              <select value={form.client_id} onChange={e=>setForm(p=>({...p,client_id:e.target.value}))} style={sel}>
                <option value="">No client</option>
                {clients.map(c=><option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
              <button onClick={()=>setShowNewClient(v=>!v)} style={{ fontSize:'0.72rem', color:'#888', background:'none', border:'none', cursor:'pointer', padding:'4px 0', marginTop:'4px' }}>
                {showNewClient ? 'Cancel' : '+ Add new client'}
              </button>
              {showNewClient && (
                <div style={{ display:'flex', gap:'8px', marginTop:'6px' }}>
                  <input value={newClientName} onChange={e=>setNewClientName(e.target.value)} placeholder="Client company name" style={{ flex:1, padding:'0.5rem 0.75rem', border:'1.5px solid #e5e5e3', borderRadius:'9px', fontSize:'0.82rem', fontFamily:'inherit', outline:'none' }}/>
                  <button onClick={addQuickClient} style={{ padding:'0.5rem 12px', background:'#1a1a18', color:'#fff', border:'none', borderRadius:'9px', fontSize:'0.78rem', cursor:'pointer', fontFamily:'inherit' }}>Add</button>
                </div>
              )}
            </div>
            <div style={{ display:'flex', gap:'8px' }}>
              <button onClick={handleSave} disabled={saving||!form.project_name.trim()} style={{ flex:1, padding:'0.625rem', background:'#1a1a18', color:'#fff', border:'none', borderRadius:'10px', fontSize:'0.875rem', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }}>{saving?'Saving...':'Save project'}</button>
              <button onClick={()=>{setShowForm(false);setEditId(null);}} style={{ padding:'0.625rem 1rem', background:'#fff', color:'#aaa', border:'1.5px solid #e5e5e3', borderRadius:'10px', fontSize:'0.875rem', cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
            </div>
          </div>
        )}

        {loading ? <p style={{ color:'#aaa', textAlign:'center', padding:'2rem' }}>Loading...</p> :
          projects.length===0 && !showForm ? (
            <div style={{ ...card, textAlign:'center', padding:'3rem 1.5rem' }}>
              <p style={{ color:'#bbb', fontSize:'0.875rem', marginBottom:'1rem' }}>No projects yet. Create a project and run your first estimate.</p>
              <button onClick={startNew} style={{ padding:'8px 16px', background:'#1a1a18', color:'#fff', border:'none', borderRadius:'10px', fontSize:'0.82rem', cursor:'pointer', fontFamily:'inherit' }}>Create first project</button>
            </div>
          ) : projects.map(proj => (
            <div key={proj.id} style={{ background:'#fff', borderRadius:'14px', padding:'1.25rem 1.5rem', border:'1px solid #eeede8', marginBottom:'10px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: proj.latestEstimate ? '0.875rem' : 0 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'2px' }}>
                    <span style={{ fontWeight:'600', fontSize:'0.92rem', color:'#1a1a18' }}>{proj.project_name}</span>
                    {proj.reference_number && <span style={{ fontSize:'0.68rem', background:'#f0f0ee', color:'#888', padding:'1px 6px', borderRadius:'6px' }}>{proj.reference_number}</span>}
                  </div>
                  {proj.clients?.company_name && <p style={{ fontSize:'0.78rem', color:'#888', marginTop:'1px' }}>{proj.clients.company_name}</p>}
                  {proj.address && <p style={{ fontSize:'0.75rem', color:'#aaa', marginTop:'1px' }}>{proj.address}</p>}
                </div>
                <div style={{ display:'flex', gap:'6px' }}>
                  <button onClick={()=>startEdit(proj)} style={{ padding:'4px 10px', borderRadius:'8px', border:'1.5px solid #e5e5e3', background:'#fff', fontSize:'0.72rem', cursor:'pointer', fontFamily:'inherit' }}>Edit</button>
                  <button onClick={()=>handleDelete(proj.id)} style={{ padding:'4px 10px', borderRadius:'8px', border:'1.5px solid #fdecea', background:'#fdecea', color:'#c0392b', fontSize:'0.72rem', cursor:'pointer', fontFamily:'inherit' }}>Delete</button>
                </div>
              </div>
              {proj.latestEstimate ? (
                <div style={{ borderTop:'1px solid #f5f5f3', paddingTop:'0.875rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <p style={{ fontSize:'0.7rem', color:'#aaa', marginBottom:'2px' }}>Latest estimate</p>
                    <p style={{ fontSize:'1rem', fontWeight:'700', color:'#1a1a18' }}>{fmtZAR(proj.latestEstimate.total_project_cost)}</p>
                    <p style={{ fontSize:'0.68rem', color:'#bbb', marginTop:'1px' }}>{new Date(proj.latestEstimate.created_at).toLocaleDateString('en-ZA',{day:'numeric',month:'short',year:'numeric'})}</p>
                  </div>
                  <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                    <button onClick={()=>navigate(`/?edit=${proj.latestEstimate.id}`)} style={{ padding:'6px 12px', borderRadius:'9px', border:'1.5px solid #1a1a18', background:'#fff', fontSize:'0.78rem', fontWeight:'500', cursor:'pointer', fontFamily:'inherit', color:'#1a1a18' }}>Edit estimate</button>
                    {isPro && proj.latestEstimate.inputs_json && proj.latestEstimate.result_json
                      ? <PDFBtn estimate={proj.latestEstimate} project={proj} profile={profile} userEmail={user?.email}/>
                      : <button disabled style={{ padding:'6px 12px', borderRadius:'9px', border:'1.5px solid #e5e5e3', background:'#f9f9f7', fontSize:'0.78rem', cursor:'not-allowed', fontFamily:'inherit', color:'#ccc' }}>PDF · Pro</button>}
                  </div>
                </div>
              ) : (
                <div style={{ borderTop:'1px solid #f5f5f3', paddingTop:'0.75rem' }}>
                  <p style={{ fontSize:'0.78rem', color:'#bbb' }}>No estimate saved yet. <span onClick={()=>navigate('/')} style={{ color:'#185fa5', cursor:'pointer' }}>Open calculator \u2192</span></p>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
