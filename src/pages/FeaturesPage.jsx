import { useFadeIn } from '../hooks/useFadeIn';

const BENEFIT_PILLS = ['Faster Early Decisions','Structured Cost Guidance','Instant Cost Breakdown','Clearer Feasibility Planning'];
const FEATURE_PILLS = ['ROM Estimates','Feasibility Planning','Building Types','Project Types','Cost Adjustments','Element Breakdowns','Rate Summaries','AprIQ Intelligence'];

const AI_CARDS = [
  {
    title: 'Estimate summary',
    body: 'Plain-language breakdown of your total cost, rate per m², and the dominant cost drivers by rand value — in one clear paragraph.',
    color: '#0F4C5C',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F4C5C" strokeWidth="1.5" strokeLinecap="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    ),
  },
  {
    title: 'Risk flagging',
    body: 'Escalation exposure in rands over the build period, adequacy of contingency for the project type, and specification decisions that carry cost risk.',
    color: '#FF8210',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  {
    title: 'Market benchmarking',
    body: 'Contextualises your cost rate against current South African market ranges for this building type and specification — low, mid-range, or premium, and why.',
    color: '#0F4C5C',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F4C5C" strokeWidth="1.5" strokeLinecap="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
  {
    title: 'Escalation analysis',
    body: 'Quantifies the rand impact of your escalation rate over the build programme — and shows what a start date slip would cost you.',
    color: '#FF8210',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    title: 'Cost lever guidance',
    body: 'Names the single most impactful change you could make to reduce cost, and points you to the relevant slider to apply it immediately.',
    color: '#0F4C5C',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F4C5C" strokeWidth="1.5" strokeLinecap="round">
        <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
        <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
        <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/>
        <line x1="17" y1="16" x2="23" y2="16"/>
      </svg>
    ),
  },
  {
    title: 'Open Q&A',
    body: 'Ask anything about your estimate — why the rate is high, what contractor profit covers, whether contingency is adequate, and more.',
    color: '#FF8210',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
];

const COMPARISON = [
  { feature:'Estimates',       desc:'Create structured early-stage cost estimates',              free:'Basic',   pro:'Full'  },
  { feature:'AprIQ advisor',   desc:'AI-powered cost insight, risk flagging, and benchmarking', free:'No',      pro:'Yes'   },
  { feature:'Projects',        desc:'Save and manage project workspaces',                       free:'Limited', pro:'More'  },
  { feature:'Clients',         desc:'Manage client details for linked project use',             free:'Limited', pro:'More'  },
  { feature:'Exports',         desc:'Generate professional PDF estimates',                      free:'No',      pro:'Yes'   },
  { feature:'Sharing',         desc:'Generate shareable link estimates for stakeholders',       free:'No',      pro:'Yes'   },
  { feature:'Access',          desc:'Unlock the full AprIQ workflow',                           free:'Basic',   pro:'Full'  },
  { feature:'Storage',         desc:'Save more working data over time',                         free:'Limited', pro:'More'  },
];

const FaceIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24">
    <circle cx="9" cy="10" r="1.4" fill="#FF8210"/>
    <circle cx="15" cy="10" r="1.4" fill="#FF8210"/>
    <path d="M8 14.5c1.2 1.8 6 1.8 8 0" fill="none" stroke="#FF8210" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);

export default function FeaturesPage() {
  const r1 = useFadeIn(), r2 = useFadeIn(), r3 = useFadeIn(), r4 = useFadeIn();
  return (
    <div>
      <div style={s.pageTop}/>

      {/* ── Features overview ── */}
      <section style={s.section}><div className="wrap" ref={r1}><div style={s.panel} className="fi-group">
        <h1 style={s.h1} className="fi">Features</h1>
        <p style={s.body} className="fi">AprIQ combines speed, structure, and clarity to support early-stage construction cost planning. Key features include building and project type selection, structured cost adjustments, rate summaries, elemental breakdowns, and clear total project cost outputs.</p>
        <p style={{...s.body, marginTop:12}} className="fi">AprIQ also supports practical workflow needs by allowing estimates to be saved, linked to projects and clients, and used to support early feasibility discussions, budget planning, and decision-making.</p>
        <div style={s.pillRow} className="fi">{BENEFIT_PILLS.map((p) => <span key={p} style={s.pill}>{p}</span>)}</div>
        <div style={{...s.pillRow, marginTop:8}} className="fi">
          {FEATURE_PILLS.map((p) => (
            p === 'AprIQ Intelligence'
              ? <span key={p} style={{...s.pill, display:'inline-flex', alignItems:'center', gap:'6px', borderColor:'#0F4C5C', color:'#0F4C5C'}}>
                  <FaceIcon/>{p}
                </span>
              : <span key={p} style={s.pill}>{p}</span>
          ))}
        </div>
      </div></div></section>

      {/* ── AprIQ Intelligence ── */}
      <section style={s.section}><div className="wrap" ref={r2}><div style={s.panel} className="fi-group">

        <div style={s.aiHeader} className="fi">
          <h2 style={{...s.h2, marginBottom:0}}>AI-powered cost intelligence</h2>
          <span style={s.proTag}>Pro feature</span>
        </div>

        <p style={{...s.body, marginTop:16}} className="fi">AprIQ Intelligence is the AI layer built into AprIQ. It reads your live estimate and responds with precision — interpreting what the numbers mean, flagging risks, contextualising your rate against the South African market, and suggesting levers to manage cost. It does not generate numbers of its own. It interprets yours.</p>
        <p style={{...s.body, marginTop:10}} className="fi">On the landing page, AprIQ Intelligence answers general construction cost questions for South Africa — open to anyone, no account required, five questions per session.</p>

        <div style={s.divider} className="fi"/>

        <div style={s.caps} className="fi">What AprIQ Intelligence can do</div>

        <div style={s.cardGrid} className="fi">
          {AI_CARDS.map((card) => (
            <div key={card.title} style={s.card}>
              <div style={s.cardIcon}>{card.icon}</div>
              <div style={s.cardTitle}>{card.title}</div>
              <div style={s.cardBody}>{card.body}</div>
            </div>
          ))}
        </div>

        <div style={s.divider} className="fi"/>

        <div style={s.caps} className="fi">Location-based costing context</div>
        <p style={s.body} className="fi">South African construction rates are not uniform. AprIQ Intelligence contextualises your estimate against regional market realities — coastal premium builds in the Western Cape, Gauteng commercial rates, KwaZulu-Natal residential norms, and the cost impact of remote or difficult-access sites. It draws on current market knowledge to give rate guidance grounded in South African conditions, not generic benchmarks.</p>

        <div style={s.pillRow} className="fi">
          {['Western Cape','Gauteng','KwaZulu-Natal','Remote sites','Escalation rates','Material costs','Specification risk','Budget pressure'].map((p) => (
            <span key={p} style={s.pill}>{p}</span>
          ))}
        </div>

        <div style={s.divider} className="fi"/>

        <div style={s.splitRow} className="fi">
          <div style={s.splitCard}>
            <div style={s.splitHead}>
              <span style={s.cardTitle}>AprIQ advisor</span>
              <span style={s.proTag}>Pro</span>
            </div>
            <p style={{...s.cardBody, marginTop:8}}>Available inside the calculator for logged-in Pro users. Reads your live estimate in full and provides contextual, interactive cost advice. 20 questions per day.</p>
          </div>
          <div style={s.splitCard}>
            <div style={s.splitHead}>
              <span style={s.cardTitle}>AprIQ Intelligence</span>
              <span style={s.pubTag}>Public</span>
            </div>
            <p style={{...s.cardBody, marginTop:8}}>Available on the landing page to any visitor, no account required. Answers general South African construction cost questions. 5 questions per session.</p>
          </div>
        </div>

      </div></div></section>

      {/* ── Free vs Pro ── */}
      <section style={s.section}><div className="wrap" ref={r3}><div style={s.panel} className="fi-group">
        <h2 style={s.h2} className="fi">Free and Pro</h2>
        <p style={s.body} className="fi">Choose the plan that fits how you work.</p>
        <p style={{...s.body, marginTop:8}} className="fi">Free is designed for getting started with AprIQ and exploring the platform's early-stage estimating workflow. Pro is built for users who need a more complete working setup, with expanded access for ongoing project use, saved workflows, and professional output needs.</p>
        <div style={s.tableWrap} className="fi">
          <div style={s.tableHead}>
            <div style={s.colFeature}>Feature</div>
            <div style={s.colFree}>Free</div>
            <div style={s.colPro}>Pro</div>
          </div>
          {COMPARISON.map((row, i) => (
            <div key={row.feature} style={{...s.tableRow, background: i % 2 === 0 ? '#F9FAFA' : '#F4F4F2'}}>
              <div style={s.colFeature}>
                <span style={s.rowFeature}>{row.feature}</span>
                <span style={s.rowDesc}>{row.desc}</span>
              </div>
              <div style={s.colFree}>
                <span style={{fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, color: row.free === 'No' ? '#979899' : '#111111'}}>{row.free}</span>
              </div>
              <div style={s.colPro}>
                <span style={{fontFamily:"'Roboto',system-ui,sans-serif", fontSize:13, color: ['Yes','Full','More'].includes(row.pro) ? '#0F4C5C' : '#979899', fontWeight:500}}>{row.pro}</span>
              </div>
            </div>
          ))}
        </div>
      </div></div></section>
    </div>
  );
}

const s = {
  pageTop:   { height: 48 },
  section:   { padding: '0 0 20px' },
  panel:     { background: '#F9FAFA', border: '1px solid #E4E5E5', borderRadius: 16, padding: 32 },
  h1:        { fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize: 28, fontWeight: 700, color: '#111111', marginBottom: 20 },
  h2:        { fontFamily:"'Aptos','Segoe UI',system-ui,sans-serif", fontSize: 22, fontWeight: 600, color: '#111111', marginBottom: 16 },
  body:      { fontFamily:"'Roboto',system-ui,sans-serif", fontSize: 14, color: '#979899', lineHeight: 1.72 },
  pillRow:   { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20 },
  pill:      { display: 'inline-flex', alignItems: 'center', padding: '6px 16px', borderRadius: 100, border: '1px solid #FF8210', fontFamily:"'Roboto',system-ui,sans-serif", fontSize: 13, color: '#111111', background: '#F9FAFA', whiteSpace: 'nowrap' },
  divider:   { height: 1, background: '#E4E5E5', margin: '28px 0' },
  caps:      { fontFamily:"'Roboto',system-ui,sans-serif", fontSize: 11, fontWeight: 600, color: '#979899', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 20 },
  aiHeader:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  proTag:    { display: 'inline-flex', alignItems: 'center', padding: '3px 12px', borderRadius: 100, border: '1px solid #0F4C5C', fontFamily:"'Roboto',system-ui,sans-serif", fontSize: 11, fontWeight: 500, color: '#0F4C5C', background: '#F9FAFA', whiteSpace: 'nowrap' },
  pubTag:    { display: 'inline-flex', alignItems: 'center', padding: '3px 12px', borderRadius: 100, border: '1px solid #E4E5E5', fontFamily:"'Roboto',system-ui,sans-serif", fontSize: 11, fontWeight: 500, color: '#979899', background: '#F9FAFA', whiteSpace: 'nowrap' },
  cardGrid:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  card:      { background: '#F9FAFA', border: '1px solid #E4E5E5', borderRadius: 12, padding: '18px 20px' },
  cardIcon:  { width: 32, height: 32, borderRadius: 8, border: '1px solid #E4E5E5', background: '#F9FAFA', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, flexShrink: 0 },
  cardTitle: { fontFamily:"'Roboto',system-ui,sans-serif", fontSize: 13, fontWeight: 500, color: '#111111', marginBottom: 6 },
  cardBody:  { fontFamily:"'Roboto',system-ui,sans-serif", fontSize: 12, color: '#979899', lineHeight: 1.6 },
  splitRow:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  splitCard: { background: '#F9FAFA', border: '1px solid #E4E5E5', borderRadius: 12, padding: '16px 18px' },
  splitHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  tableWrap: { marginTop: 28, border: '1px solid #E4E5E5', borderRadius: 12, overflow: 'hidden' },
  tableHead: { display: 'grid', gridTemplateColumns: '1fr 120px 120px', background: '#111111', padding: '12px 20px', gap: 16 },
  tableRow:  { display: 'grid', gridTemplateColumns: '1fr 120px 120px', padding: '14px 20px', gap: 16, borderBottom: '1px solid #E4E5E5', alignItems: 'center' },
  colFeature:{ display: 'flex', flexDirection: 'column', gap: 2, fontFamily:"'Roboto',system-ui,sans-serif", fontSize: 12, color: '#F9FAFA', fontWeight: 500 },
  colFree:   { fontFamily:"'Roboto',system-ui,sans-serif", fontSize: 12, color: '#F9FAFA', fontWeight: 500, display: 'flex', alignItems: 'center' },
  colPro:    { fontFamily:"'Roboto',system-ui,sans-serif", fontSize: 12, color: '#FF8210', fontWeight: 600, display: 'flex', alignItems: 'center' },
  rowFeature:{ fontFamily:"'Roboto',system-ui,sans-serif", fontSize: 13, color: '#111111', fontWeight: 500 },
  rowDesc:   { fontFamily:"'Roboto',system-ui,sans-serif", fontSize: 12, color: '#979899', lineHeight: 1.4 },
};
