import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { calculate } from '../engine/calculator';
import { CATEGORIES, QUALITY, SITE_ACCESS, PROJECT_TYPE, RENOVATION_COMPLEXITY, COMPLEXITY, LAND_PROCUREMENT, LAND_SLOPE, BREAKDOWN_ELEMENTS } from '../engine/rates';

const card={background:'#fff',borderRadius:'14px',padding:'1.5rem',border:'1px solid #eeede8',marginBottom:'1rem'};
const lbl={display:'block',fontSize:'0.7rem',fontWeight:'600',color:'#999',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'0.5rem'};
const sel={width:'100%',padding:'0.6rem 0.875rem',border:'1.5px solid #e5e5e3',borderRadius:'10px',fontSize:'0.875rem',background:'#fff',color:'#1a1a18',fontFamily:'inherit',outline:'none',cursor:'pointer'};
const divider={borderTop:'1px solid #f0f0ee',margin:'1.25rem 0'};
const rowStyle={display:'flex',justifyContent:'space-between',padding:'0.45rem 0',borderBottom:'1px solid #f5f5f3',fontSize:'0.82rem'};
const rowLbl={color:'#555'};
const rowVal={fontWeight:'600',color:'#1a1a18'};
const PRO_BADGE=<span style={{marginLeft:'5px',fontSize:'0.6rem',background:'#f0f0ee',color:'#aaa',padding:'1px 5px',borderRadius:'6px',verticalAlign:'middle',fontWeight:'600'}}>PRO</span>;

function fmtZAR(n){if(!n||isNaN(n)||n===0)return 'R 0';return 'R '+Math.round(n).toLocaleString('en-ZA');}
function pctFmt(p){return (p*100).toFixed(1)+'%';}

function BtnGroup({label,value,onChange,options,locked,cols,getDesc}){
  const desc=getDesc?getDesc(value):options.find(o=>o.value===value)?.desc||null;
  const gridCols=cols||options.length;
  return(
    <div style={{marginBottom:'1.1rem'}}>
      {label&&<label style={lbl}>{label}{locked&&PRO_BADGE}</label>}
      <div style={{display:'grid',gridTemplateColumns:'repeat('+gridCols+', 1fr)',gap:'6px'}}>
        {options.map(o=>(
          <button key={o.value} onClick={()=>!locked&&onChange(o.value)} disabled={locked}
            style={{padding:'0.5rem 0.35rem',borderRadius:'9px',border:value===o.value?'1.5px solid #1a1a18':'1.5px solid #e5e5e3',background:value===o.value?'#1a1a18':'#fff',color:value===o.value?'#fff':'#666',fontSize:'0.78rem',fontWeight:'500',cursor:locked?'not-allowed':'pointer',fontFamily:'inherit',transition:'all 0.12s',opacity:locked?0.45:1}}>
            {o.label}
          </button>
        ))}
      </div>
      {desc&&<p style={{fontSize:'0.72rem',color:'#aaa',marginTop:'0.4rem',marginBottom:0}}>{desc}</p>}
    </div>
  );
}

function Slider({label,value,min,max,step,onChange,fmtFn,locked}){
  const pct=Math.round(((value-min)/(max-min))*100);
  return(
    <div style={{marginBottom:'1.1rem',opacity:locked?0.4:1}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:'0.5rem'}}>
        {label&&<label style={{...lbl,marginBottom:0}}>{label}{locked&&PRO_BADGE}</label>}
        <span style={{fontSize:'0.875rem',fontWeight:'600',color:'#1a1a18'}}>{fmtFn?fmtFn(value):value}</span>
      </div>
      <div style={{position:'relative',height:'28px',display:'flex',alignItems:'center'}}>
        <div style={{position:'absolute',left:0,right:0,height:'4px',background:'#eee',borderRadius:'4px'}}/>
        <div style={{position:'absolute',left:0,width:pct+'%',height:'4px',background:locked?'#ddd':'#1a1a18',borderRadius:'4px'}}/>
        <div style={{position:'absolute',left:'calc('+pct+'% - 10px)',width:'20px',height:'20px',background:'#fff',border:'2px solid '+(locked?'#ddd':'#1a1a18'),borderRadius:'50%',pointerEvents:'none',boxShadow:'0 1px 4px rgba(0,0,0,0.12)',zIndex:1}}/>
        <input type="range" min={min} max={max} step={step} value={value} disabled={locked}
          onChange={e=>!locked&&onChange(parseFloat(e.target.value))}
          style={{position:'absolute',width:'100%',opacity:0,height:'28px',cursor:locked?'not-allowed':'pointer',margin:0,zIndex:2}}/>
      </div>
    </div>
  );
}

function NumBox({label,value,onChange,suffix}){
  return(
    <div style={{marginBottom:'1.1rem'}}>
      {label&&<label style={lbl}>{label}</label>}
      <div style={{display:'flex',alignItems:'center',border:'1.5px solid #e5e5e3',borderRadius:'10px',overflow:'hidden'}}>
        <input type="number" value={value} onChange={e=>onChange(parseFloat(e.target.value)||0)}
          style={{flex:1,padding:'0.6rem 0.875rem',border:'none',outline:'none',fontSize:'0.875rem',fontFamily:'inherit',color:'#1a1a18',background:'#fff'}}/>
        {suffix&&<span style={{padding:'0.6rem 0.875rem',background:'#f5f5f3',fontSize:'0.8rem',color:'#aaa',borderLeft:'1px solid #e5e5e3'}}>{suffix}</span>}
      </div>
    </div>
  );
}

function RateRow({rawRate,adjustedRate,adjustField,toggleField,adjValue,adjToggle,isPro,upd}){
  if(!isPro||!rawRate) return null;
  return(
    <div style={{background:'#f9f9f7',borderRadius:'10px',padding:'0.65rem 0.875rem',marginTop:'0.35rem',marginBottom:'0.75rem'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontSize:'0.72rem',color:'#aaa'}}>Base rate</span>
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          {adjToggle&&adjValue!==0&&<span style={{fontSize:'0.72rem',color:adjValue>0?'#27ae60':'#e74c3c',fontWeight:'600'}}>{adjValue>0?'+':''}{adjValue}%</span>}
          <span style={{fontSize:'0.82rem',fontWeight:'600',color:'#1a1a18'}}>{fmtZAR(adjustedRate)} /m2</span>
          <label style={{display:'flex',alignItems:'center',gap:'4px',cursor:'pointer',fontSize:'0.7rem',color:'#aaa'}}>
            <input type="checkbox" checked={adjToggle} onChange={e=>upd(toggleField,e.target.checked)} style={{cursor:'pointer'}}/>
            Adjust
          </label>
        </div>
      </div>
      {adjToggle&&(
        <div style={{marginTop:'0.5rem'}}>
          <Slider label="" value={adjValue} min={-30} max={30} step={1} onChange={v=>upd(adjustField,v)} fmtFn={v=>(v>0?'+':'')+v+'%'}/>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.72rem',color:'#aaa',marginTop:'-0.5rem'}}>
            <span>-30%</span>
            <span style={{color:'#1a1a18',fontWeight:'600'}}>{fmtZAR(rawRate*(1+adjValue/100))} /m2</span>
            <span>+30%</span>
          </div>
        </div>
      )}
    </div>
  );
}

const qualityOpts=Object.entries(QUALITY).map(([k,v])=>({value:k,label:v.label}));
const projectOpts=[{value:'New',label:'New',desc:'Full new construction on a clear site'},{value:'Renovation',label:'Renovation',desc:'Works to existing structure'},{value:'Addition',label:'Addition',desc:'Adding to existing building (x1.15)'}];
const renovOpts=Object.entries(RENOVATION_COMPLEXITY).map(([k,v])=>({value:k,label:v.label,desc:v.description}));
const complexityOpts=[{value:'Low Complexity',label:'Low',desc:'Simple, functional, low-tech'},{value:'Medium Complexity',label:'Medium',desc:'Standard structural works'},{value:'High Complexity',label:'High',desc:'Complex structural requirements'}];
const siteOpts=[{value:'Urban Setting',label:'Urban',desc:'0-10 km from city'},{value:'Suburban Setting',label:'Suburban',desc:'10-30 km from city'},{value:'Peri-Urban Setting',label:'Peri-Urban',desc:'30-60 km from city'},{value:'Rural Setting',label:'Rural',desc:'60-150 km from city'},{value:'Exurban Setting',label:'Exurban',desc:'150-300 km from city'},{value:'Specialized/Natural Setting',label:'Specialized',desc:'Remote or restricted access'}];
const slopeOpts=[{value:'Flat Land (0-5%)',label:'Flat',desc:'0-5% slope'},{value:'Moderately Sloped Land (5-15%)',label:'Moderate',desc:'5-15% slope'},{value:'Steep / Hilly Land (15%+)',label:'Steep',desc:'15%+ slope'},{value:'Irregular / Constrained Land',label:'Irregular',desc:'Rocky or constrained'}];
const landOpts=Object.entries(LAND_PROCUREMENT).map(([k,v])=>({value:k,label:v.label}));
const categoryOpts=CATEGORIES.map(c=>({value:c.key,label:c.label}));
const qualityDesc={Low:'Budget spec (x0.85)',Medium:'Standard spec (x1.0)',High:'High-end (x1.25)',Premium:'Luxury spec (x1.6)'};
const DEFAULT_PCTS=BREAKDOWN_ELEMENTS.map(e=>e.pct);

const DEFAULT={
  use1Category:'Residential',use1Subtype:'Single Dwelling',use1Allocation:1,
  use2Category:null,use2Subtype:null,use2Allocation:0,
  use3Category:null,use3Subtype:null,use3Allocation:0,
  floorArea:200,complexityKey:'Low Complexity',siteAccessKey:'Urban Setting',
  projectTypeKey:'New',renovationArea:0,renovationComplexityKey:'Low',qualityKey:'Medium',
  contingencyPct:0.10,profitPct:0.10,preliminariesPct:0.05,feesPct:0.12,vatPct:0.15,
  landProcurementType:'N/A',landArea:0,landSlopeKey:'Flat Land (0-5%)',
  escalationRate:7,estimatedStartDate:null,includeEscalation:false,
  useCustomSplit:false,customElementPcts:DEFAULT_PCTS,
  adjustRate1:false,rate1Adjustment:0,
  adjustRate2:false,rate2Adjustment:0,
  adjustRate3:false,rate3Adjustment:0,
};

export default function Calculator(){
  const {user,profile}=useAuth();
  const [inputs,setInputs]=useState(DEFAULT);
  const [numCats,setNumCats]=useState(1);
  const [result,setResult]=useState(null);
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [feedback,setFeedback]=useState(false);
  const [fbText,setFbText]=useState('');
  const [fbSent,setFbSent]=useState(false);

  const tier=profile?.tier||'free';
  const trialEnd=profile?.trial_end_date?new Date(profile.trial_end_date):null;
  const trialOk=tier==='trial'&&trialEnd&&trialEnd>new Date();
  const isPro=tier==='pro'||trialOk;
  const daysLeft=trialEnd?Math.ceil((trialEnd-new Date())/(1000*60*60*24)):0;

  useEffect(()=>{if(isPro)setResult(calculate(inputs));},[inputs,isPro]);

  function upd(field,val){setInputs(p=>({...p,[field]:val}));setSaved(false);}
  function updCat(n,catKey){const cat=CATEGORIES.find(c=>c.key===catKey);setInputs(p=>({...p,['use'+n+'Category']:catKey,['use'+n+'Subtype']:cat?.subtypes[0]?.key||''}));}
  function resetAll(){setInputs(DEFAULT);setNumCats(1);setResult(null);setSaved(false);}

  function setAlloc1(pct){
    const v=pct/100;
    if(numCats===2)setInputs(p=>({...p,use1Allocation:v,use2Allocation:Math.round((1-v)*100)/100}));
    else if(numCats===3){const rem=1-v;const r2=inputs.use2Allocation/((inputs.use2Allocation+inputs.use3Allocation)||1)||0.5;setInputs(p=>({...p,use1Allocation:v,use2Allocation:Math.round(rem*r2*100)/100,use3Allocation:Math.round(rem*(1-r2)*100)/100}));}
    setSaved(false);
  }
  function setAlloc2(pct){const v=pct/100;const max=1-inputs.use1Allocation;const c=Math.min(v,max);setInputs(p=>({...p,use2Allocation:c,use3Allocation:numCats===3?Math.round((max-c)*100)/100:0}));setSaved(false);}

  function addCategory(){
    if(!isPro){alert('Upgrade to Pro to use mixed-use projects.');return;}
    if(numCats>=3)return;
    const next=numCats+1;setNumCats(next);
    if(next===2){const c2=CATEGORIES.find(c=>c.key!==inputs.use1Category)||CATEGORIES[1];setInputs(p=>({...p,use2Category:c2.key,use2Subtype:c2.subtypes[0].key,use1Allocation:0.7,use2Allocation:0.3}));}
    else{const c3=CATEGORIES.find(c=>c.key!==inputs.use1Category&&c.key!==inputs.use2Category)||CATEGORIES[2];setInputs(p=>({...p,use3Category:c3.key,use3Subtype:c3.subtypes[0].key,use1Allocation:0.6,use2Allocation:0.3,use3Allocation:0.1}));}
  }
  function removeCategory(n){
    if(n===3){setNumCats(2);setInputs(p=>({...p,use3Category:null,use3Subtype:null,use3Allocation:0}));}
    else{setNumCats(1);setInputs(p=>({...p,use2Category:null,use2Subtype:null,use2Allocation:0,use3Category:null,use3Subtype:null,use3Allocation:0,use1Allocation:1}));}
  }
  function updateCustomPct(i,val){const arr=[...inputs.customElementPcts];arr[i]=Math.max(0,Math.min(1,parseFloat(val)||0));upd('customElementPcts',arr);}
  function handleCalc(){setResult(calculate(inputs));setSaved(false);}

  async function handleSave(){
    if(!result)return;setSaving(true);
    const ref='APR-'+Date.now().toString(36).toUpperCase();
    await supabase.from('estimates').insert({
      user_id:user.id,reference_number:ref,
      building_category:inputs.use1Category,building_subtype:inputs.use1Subtype,
      floor_area:inputs.floorArea,is_mixed_use:numCats>1,
      quality_multiplier:result.qualityMultiplier,site_access_multiplier:result.siteMultiplier,
      project_type_multiplier:result.projectTypeMultiplier,complexity_multiplier:result.complexityMultiplier,
      land_type:inputs.landProcurementType,land_area:inputs.landArea,
      contingency_pct:inputs.contingencyPct*100,profit_pct:inputs.profitPct*100,
      fees_pct:inputs.feesPct*100,vat_pct:inputs.vatPct*100,
      base_construction_cost:result.constructionCost,
      land_cost:result.landProcurementCost,contingency_amount:result.contingencyAmount,
      profit_amount:result.contractorProfit,fees_amount:result.professionalFees,
      vat_amount:result.vatAmount,total_project_cost:result.totalProjectCost,
      escalated_total:result.escalatedTotal,cost_breakdown:result.elementBreakdown,
    });
    setSaving(false);setSaved(true);
  }

  async function handleLogout(){await supabase.auth.signOut();}

  const subtypes1=CATEGORIES.find(c=>c.key===inputs.use1Category)?.subtypes||[];
  const subtypes2=CATEGORIES.find(c=>c.key===inputs.use2Category)?.subtypes||[];
  const subtypes3=CATEGORIES.find(c=>c.key===inputs.use3Category)?.subtypes||[];
  const allocTotal=inputs.use1Allocation+inputs.use2Allocation+inputs.use3Allocation;
  const allocOk=Math.abs(allocTotal-1)<0.01;
  const customPctSum=inputs.customElementPcts?.reduce((s,p)=>s+p,0)||0;
  const customPctOk=Math.abs(customPctSum-1)<0.005;
  const showEscalation=inputs.includeEscalation&&result?.escalationYears?.length>0;

  const Summary=()=>!result?null:(<>
    <div style={{background:'#1a1a18',borderRadius:'14px',padding:'1.5rem',marginBottom:'1rem',color:'#fff'}}>
      <p style={{fontSize:'0.68rem',color:'#888',marginBottom:'0.3rem',textTransform:'uppercase',letterSpacing:'0.05em'}}>Total project cost</p>
      <p style={{fontSize:'2rem',fontWeight:'700',letterSpacing:'-1px',lineHeight:1.1,color:'#fff'}}>{fmtZAR(result.totalProjectCost)}</p>
      {isPro&&<p style={{fontSize:'0.68rem',color:'#555',marginTop:'0.5rem'}}>Updates live as you adjust inputs</p>}
    </div>

    <div style={card}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
        <span style={{fontSize:'0.85rem',fontWeight:'600',color:'#1a1a18'}}>Element breakdown</span>
        <label style={{display:'flex',alignItems:'center',gap:'6px',cursor:isPro?'pointer':'not-allowed',fontSize:'0.72rem',color:'#888',opacity:isPro?1:0.5}}>
          <input type="checkbox" checked={inputs.useCustomSplit} onChange={e=>isPro&&upd('useCustomSplit',e.target.checked)} disabled={!isPro}/>
          Custom split{!isPro&&PRO_BADGE}
        </label>
      </div>
      {result.elementBreakdown.map((el,i)=>(
        <div key={el.key} style={{display:'flex',alignItems:'center',padding:'0.4rem 0',borderBottom:'1px solid #f5f5f3',fontSize:'0.82rem',gap:'0.5rem'}}>
          <span style={{flex:1,color:'#555'}}>{el.label}</span>
          {inputs.useCustomSplit&&isPro?(
            <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
              <input type="number" min={0} max={100} step={0.1} value={Math.round(el.effectivePct*1000)/10}
                onChange={e=>updateCustomPct(i,parseFloat(e.target.value)/100)}
                style={{width:'56px',padding:'2px 6px',border:'1px solid #e5e5e3',borderRadius:'6px',fontSize:'0.78rem',textAlign:'right',fontFamily:'inherit'}}/>
              <span style={{color:'#aaa',fontSize:'0.75rem'}}>%</span>
            </div>
          ):(
            <span style={{color:'#aaa',fontSize:'0.75rem',minWidth:'36px',textAlign:'right'}}>{pctFmt(el.defaultPct)}</span>
          )}
          <span style={{fontWeight:'600',color:'#1a1a18',minWidth:'90px',textAlign:'right'}}>{fmtZAR(el.amount)}</span>
        </div>
      ))}
      {inputs.useCustomSplit&&(
        <div style={{marginTop:'0.75rem',borderRadius:'8px',padding:'0.45rem 0.875rem',background:customPctOk?'#eaf3de':'#fdecea',fontSize:'0.78rem',color:customPctOk?'#27500a':'#c0392b'}}>
          {customPctOk?'Element split totals 100%':'Element split totals '+(customPctSum*100).toFixed(1)+'% - must equal 100%'}
        </div>
      )}
      <div style={{display:'flex',justifyContent:'space-between',paddingTop:'0.75rem',fontSize:'0.875rem',fontWeight:'700',color:'#1a1a18'}}>
        <span>Construction cost</span><span>{fmtZAR(result.constructionCost)}</span>
      </div>
    </div>

    <div style={card}>
      <span style={{fontSize:'0.85rem',fontWeight:'600',color:'#1a1a18',display:'block',marginBottom:'1rem'}}>Financial additions</span>
      {[
        {label:'Contingency ('+Math.round(inputs.contingencyPct*100)+'%)',value:result.contingencyAmount},
        {label:'Contractor profit ('+Math.round(inputs.profitPct*100)+'%)',value:result.contractorProfit},
        {label:'Preliminaries ('+Math.round(inputs.preliminariesPct*100)+'%)',value:result.preliminaries},
        {label:'Professional fees ('+Math.round(inputs.feesPct*100)+'%)',value:result.professionalFees},
        {label:'VAT ('+Math.round(inputs.vatPct*100)+'%)',value:result.vatAmount},
      ].map(r=>(<div key={r.label} style={rowStyle}><span style={rowLbl}>{r.label}</span><span style={rowVal}>{fmtZAR(r.value)}</span></div>))}
    </div>

    <div style={{...card,background:'#f9f9f7'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontSize:'0.95rem',fontWeight:'700',color:'#1a1a18'}}>Total project cost</span>
        <span style={{fontSize:'1.1rem',fontWeight:'700',color:'#1a1a18'}}>{fmtZAR(result.totalProjectCost)}</span>
      </div>
    </div>

    {showEscalation&&(
      <div style={card}>
        <span style={{fontSize:'0.85rem',fontWeight:'600',color:'#1a1a18',display:'block',marginBottom:'0.25rem'}}>Escalation at {inputs.escalationRate}% p.a.</span>
        <p style={{fontSize:'0.72rem',color:'#aaa',marginBottom:'1rem'}}>Base estimate: {new Date().toLocaleDateString('en-ZA',{year:'numeric',month:'long'})}</p>
        {result.escalationYears.map(y=>(<div key={y.year} style={rowStyle}><span style={rowLbl}>{y.label}</span><span style={rowVal}>{fmtZAR(y.total)}</span></div>))}
        <div style={{display:'flex',justifyContent:'space-between',paddingTop:'0.75rem',fontSize:'0.9rem',fontWeight:'700',color:'#1a1a18'}}>
          <span>Escalated total</span><span>{fmtZAR(result.escalatedTotal)}</span>
        </div>
      </div>
    )}

    <div style={card}>
      <span style={{fontSize:'0.85rem',fontWeight:'600',color:'#1a1a18',display:'block',marginBottom:'1rem'}}>Rate summary</span>
      <div style={rowStyle}>
        <span style={{...rowLbl,fontSize:'0.78rem'}}>Base rate ({inputs.use1Subtype})</span>
        <span style={{fontWeight:'600',color:'#1a1a18',fontSize:'0.82rem'}}>{fmtZAR(result.rate1Raw)} /m2</span>
      </div>
      {inputs.rate1Adjustment!==0&&<div style={rowStyle}><span style={{...rowLbl,fontSize:'0.78rem'}}>Rate adjustment</span><span style={{fontWeight:'500',color:'#888',fontSize:'0.78rem'}}>{inputs.rate1Adjustment>0?'+':''}{inputs.rate1Adjustment}%</span></div>}
      {[
        {label:'Quality — '+inputs.qualityKey,value:'x'+result.qualityMultiplier},
        {label:'Site — '+inputs.siteAccessKey.replace(' Setting',''),value:'x'+result.siteMultiplier},
        {label:'Complexity — '+inputs.complexityKey.replace(' Complexity',''),value:'x'+result.complexityMultiplier},
        inputs.projectTypeKey!=='New'?{label:'Project type — '+inputs.projectTypeKey,value:'x'+result.projectTypeMultiplier}:null,
        inputs.useCustomSplit&&result.elementScopeRatio!==1?{label:'Element scope',value:(result.elementScopeRatio*100).toFixed(1)+'%'}:null,
      ].filter(Boolean).map(r=>(
        <div key={r.label} style={rowStyle}>
          <span style={{...rowLbl,fontSize:'0.78rem'}}>{r.label}</span>
          <span style={{fontWeight:'500',color:'#aaa',fontSize:'0.78rem'}}>{r.value}</span>
        </div>
      ))}
      <div style={{display:'flex',justifyContent:'space-between',paddingTop:'0.75rem',borderTop:'1.5px solid #1a1a18',marginTop:'0.25rem'}}>
        <span style={{fontSize:'0.875rem',fontWeight:'700',color:'#1a1a18'}}>Total applied base rate</span>
        <span style={{fontSize:'0.875rem',fontWeight:'700',color:'#1a1a18'}}>{fmtZAR(result.appliedRate)} /m2</span>
      </div>
      {numCats>1&&(<>
        <div style={{...divider,margin:'0.75rem 0'}}/>
        <p style={{fontSize:'0.72rem',color:'#aaa',marginBottom:'0.5rem'}}>Mixed-use composition</p>
        {[
          {sub:inputs.use1Subtype,alloc:inputs.use1Allocation,adj:result.rate1,adjPct:inputs.rate1Adjustment},
          numCats>=2?{sub:inputs.use2Subtype,alloc:inputs.use2Allocation,adj:result.rate2,adjPct:inputs.rate2Adjustment}:null,
          numCats>=3?{sub:inputs.use3Subtype,alloc:inputs.use3Allocation,adj:result.rate3,adjPct:inputs.rate3Adjustment}:null,
        ].filter(Boolean).map((u,i)=>(
          <div key={i} style={rowStyle}>
            <span style={rowLbl}>{u.sub} ({Math.round(u.alloc*100)}%){u.adjPct!==0?<span style={{color:u.adjPct>0?'#27ae60':'#e74c3c',fontSize:'0.7rem',marginLeft:'4px'}}>{u.adjPct>0?'+':''}{u.adjPct}%</span>:null}</span>
            <span style={rowVal}>{fmtZAR(u.adj)} /m2</span>
          </div>
        ))}
      </>)}
    </div>

    <button onClick={handleSave} disabled={saving||saved}
      style={{width:'100%',padding:'0.75rem',background:saved?'#27ae60':'#fff',color:saved?'#fff':'#1a1a18',border:'1.5px solid #e5e5e3',borderRadius:'12px',fontSize:'0.875rem',fontWeight:'500',cursor:'pointer',fontFamily:'inherit',marginBottom:'1rem'}}>
      {saving?'Saving...':saved?'Saved':'Save estimate'}
    </button>
  </>);

  return(
    <div style={{minHeight:'100vh',background:'#f5f5f3',fontFamily:'-apple-system, BlinkMacSystemFont, sans-serif'}}>
      <style>{`@media(max-width:700px){.desktop-grid{display:block!important;}.desktop-right{display:none!important;}.mobile-summary{display:block!important;}}`}</style>

      <div style={{background:'#fff',borderBottom:'1px solid #eeede8',padding:'0.875rem 1.5rem',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:100}}>
        <span style={{fontWeight:'700',fontSize:'1rem',letterSpacing:'-0.02em'}}>AprIQ</span>
        <div style={{display:'flex',alignItems:'center',gap:'0.875rem'}}>
          {trialOk&&daysLeft<=5&&<span style={{fontSize:'0.72rem',background:'#fff3cd',color:'#856404',padding:'2px 8px',borderRadius:'8px'}}>Trial {daysLeft}d left</span>}
          <span style={{fontSize:'0.72rem',background:isPro?'#eaf3de':'#f0f0ee',color:isPro?'#27500a':'#aaa',padding:'2px 8px',borderRadius:'8px',fontWeight:'600'}}>{tier==='pro'?'Pro':trialOk?'Trial':'Free'}</span>
          <span style={{fontSize:'0.78rem',color:'#bbb'}}>{profile?.full_name||user?.email}</span>
          <button onClick={handleLogout} style={{fontSize:'0.78rem',color:'#bbb',background:'none',border:'none',cursor:'pointer'}}>Sign out</button>
        </div>
      </div>

      <div className="desktop-grid" style={{maxWidth:'1140px',margin:'0 auto',padding:'1.5rem 1.25rem',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.5rem',alignItems:'start'}}>
        <div>
          <div style={card}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem'}}>
              <span style={{fontSize:'0.85rem',fontWeight:'600',color:'#1a1a18'}}>Building</span>
              <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                <button onClick={resetAll} style={{padding:'4px 10px',borderRadius:'9px',border:'1.5px solid #e5e5e3',background:'#fff',color:'#999',fontSize:'0.72rem',cursor:'pointer',fontFamily:'inherit'}}>Reset all</button>
                {numCats<3&&(
                  <button onClick={addCategory} style={{display:'flex',alignItems:'center',gap:'5px',padding:'4px 12px',borderRadius:'9px',border:'1.5px solid #e5e5e3',background:'#fff',color:isPro?'#1a1a18':'#ccc',fontSize:'0.78rem',fontWeight:'500',cursor:'pointer',fontFamily:'inherit'}}>
                    <span style={{fontSize:'1.1rem',lineHeight:1,marginTop:'-1px'}}>+</span>Add category{!isPro&&PRO_BADGE}
                  </button>
                )}
              </div>
            </div>

            <label style={lbl}>Category</label>
            <select value={inputs.use1Category} onChange={e=>updCat(1,e.target.value)} style={{...sel,marginBottom:'0.85rem'}}>
              {categoryOpts.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <label style={lbl}>Building type</label>
            <select value={inputs.use1Subtype} onChange={e=>upd('use1Subtype',e.target.value)} style={{...sel,marginBottom:'0.5rem'}}>
              {subtypes1.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <RateRow rawRate={result?.rate1Raw} adjustedRate={result?.rate1} adjustField="rate1Adjustment" toggleField="adjustRate1" adjValue={inputs.rate1Adjustment} adjToggle={inputs.adjustRate1} isPro={isPro} upd={upd}/>
            {numCats>1&&<Slider label="Allocation - Use 1" value={Math.round(inputs.use1Allocation*100)} min={0} max={100} step={1} onChange={setAlloc1} fmtFn={v=>v+'%'}/>}

            {numCats>=2&&(<>
              <div style={divider}/>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
                <span style={{fontSize:'0.7rem',fontWeight:'600',color:'#bbb',textTransform:'uppercase',letterSpacing:'0.05em'}}>Use 2</span>
                <button onClick={()=>removeCategory(2)} style={{background:'none',border:'none',color:'#ccc',cursor:'pointer',fontSize:'1.1rem',lineHeight:1}}>x</button>
              </div>
              <label style={lbl}>Category</label>
              <select value={inputs.use2Category||''} onChange={e=>updCat(2,e.target.value)} style={{...sel,marginBottom:'0.85rem'}}>
                {categoryOpts.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <label style={lbl}>Building type</label>
              <select value={inputs.use2Subtype||''} onChange={e=>upd('use2Subtype',e.target.value)} style={{...sel,marginBottom:'0.5rem'}}>
                {subtypes2.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <RateRow rawRate={result?.rate2Raw} adjustedRate={result?.rate2} adjustField="rate2Adjustment" toggleField="adjustRate2" adjValue={inputs.rate2Adjustment} adjToggle={inputs.adjustRate2} isPro={isPro} upd={upd}/>
              {numCats===2?<div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.25rem'}}><span style={lbl}>Allocation - Use 2</span><span style={{fontSize:'0.875rem',fontWeight:'600'}}>{Math.round(inputs.use2Allocation*100)}%</span></div>
                :<Slider label="Allocation - Use 2" value={Math.round(inputs.use2Allocation*100)} min={0} max={Math.round((1-inputs.use1Allocation)*100)} step={1} onChange={setAlloc2} fmtFn={v=>v+'%'}/>}
            </>)}

            {numCats>=3&&(<>
              <div style={divider}/>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
                <span style={{fontSize:'0.7rem',fontWeight:'600',color:'#bbb',textTransform:'uppercase',letterSpacing:'0.05em'}}>Use 3</span>
                <button onClick={()=>removeCategory(3)} style={{background:'none',border:'none',color:'#ccc',cursor:'pointer',fontSize:'1.1rem',lineHeight:1}}>x</button>
              </div>
              <label style={lbl}>Category</label>
              <select value={inputs.use3Category||''} onChange={e=>updCat(3,e.target.value)} style={{...sel,marginBottom:'0.85rem'}}>
                {categoryOpts.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <label style={lbl}>Building type</label>
              <select value={inputs.use3Subtype||''} onChange={e=>upd('use3Subtype',e.target.value)} style={{...sel,marginBottom:'0.5rem'}}>
                {subtypes3.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <RateRow rawRate={result?.rate3Raw} adjustedRate={result?.rate3} adjustField="rate3Adjustment" toggleField="adjustRate3" adjValue={inputs.rate3Adjustment} adjToggle={inputs.adjustRate3} isPro={isPro} upd={upd}/>
              <div style={{display:'flex',justifyContent:'space-between'}}><span style={lbl}>Allocation - Use 3</span><span style={{fontSize:'0.875rem',fontWeight:'600'}}>{Math.round(inputs.use3Allocation*100)}%</span></div>
            </>)}

            {numCats>1&&(<div style={{marginTop:'0.75rem',borderRadius:'8px',padding:'0.45rem 0.875rem',background:allocOk?'#eaf3de':'#fdecea',fontSize:'0.78rem',color:allocOk?'#27500a':'#c0392b'}}>{allocOk?'Allocations total 100%':'Allocations total '+Math.round(allocTotal*100)+'%'}</div>)}
            <div style={divider}/>
            <BtnGroup label="Project type" value={inputs.projectTypeKey} onChange={v=>upd('projectTypeKey',v)} options={projectOpts} getDesc={v=>projectOpts.find(o=>o.value===v)?.desc}/>
            {inputs.projectTypeKey==='Renovation'?(<>
              <NumBox label="Total floor area" value={inputs.floorArea} onChange={v=>upd('floorArea',v)} suffix="m2"/>
              <NumBox label="Renovation area" value={inputs.renovationArea} onChange={v=>upd('renovationArea',v)} suffix="m2"/>
              {inputs.renovationArea>0&&inputs.floorArea>inputs.renovationArea&&(<p style={{fontSize:'0.72rem',color:'#aaa',marginTop:'-0.5rem',marginBottom:'0.75rem'}}>{inputs.floorArea-inputs.renovationArea} m2 new - {inputs.renovationArea} m2 renovation</p>)}
              <BtnGroup label="Renovation complexity" value={inputs.renovationComplexityKey} onChange={v=>upd('renovationComplexityKey',v)} options={renovOpts} getDesc={v=>renovOpts.find(o=>o.value===v)?.desc}/>
            </>):(<NumBox label="Floor area" value={inputs.floorArea} onChange={v=>upd('floorArea',v)} suffix="m2"/>)}
          </div>

          <div style={card}>
            <span style={{fontSize:'0.85rem',fontWeight:'600',color:'#1a1a18',display:'block',marginBottom:'1.25rem'}}>Project factors</span>
            <BtnGroup label="Quality" value={inputs.qualityKey} onChange={v=>upd('qualityKey',v)} options={qualityOpts} getDesc={v=>qualityDesc[v]}/>
            <BtnGroup label="Site access" value={inputs.siteAccessKey} onChange={v=>upd('siteAccessKey',v)} options={siteOpts} cols={3} getDesc={v=>siteOpts.find(o=>o.value===v)?.desc}/>
            <BtnGroup label="Building complexity" value={inputs.complexityKey} onChange={v=>upd('complexityKey',v)} options={complexityOpts} getDesc={v=>complexityOpts.find(o=>o.value===v)?.desc}/>
          </div>

          <div style={card}>
            <span style={{fontSize:'0.85rem',fontWeight:'600',color:'#1a1a18',display:'block',marginBottom:'1.25rem'}}>Land</span>
            <label style={lbl}>Procurement type</label>
            <select value={inputs.landProcurementType} onChange={e=>upd('landProcurementType',e.target.value)} style={{...sel,marginBottom:'1.1rem'}}>
              {landOpts.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {inputs.landProcurementType!=='N/A'&&(<>
              <NumBox label="Land area" value={inputs.landArea} onChange={v=>upd('landArea',v)} suffix="m2"/>
              <BtnGroup label="Land type / slope" value={inputs.landSlopeKey} onChange={v=>upd('landSlopeKey',v)} options={slopeOpts} cols={2} getDesc={v=>slopeOpts.find(o=>o.value===v)?.desc}/>
            </>)}
          </div>

          <div style={card}>
            <span style={{fontSize:'0.85rem',fontWeight:'600',color:'#1a1a18',display:'block',marginBottom:'1.25rem'}}>Financial inputs</span>
            <Slider label="Contingency" value={Math.round(inputs.contingencyPct*100)} min={0} max={30} step={0.5} onChange={v=>upd('contingencyPct',v/100)} fmtFn={v=>v+'%'}/>
            <Slider label="Contractor profit" value={Math.round(inputs.profitPct*100)} min={0} max={30} step={0.5} onChange={v=>upd('profitPct',v/100)} fmtFn={v=>v+'%'}/>
            <Slider label="Preliminaries" value={Math.round(inputs.preliminariesPct*100)} min={0} max={20} step={0.5} onChange={v=>upd('preliminariesPct',v/100)} fmtFn={v=>v+'%'}/>
            <Slider label="Professional fees" value={Math.round(inputs.feesPct*100)} min={0} max={25} step={0.5} onChange={v=>upd('feesPct',v/100)} fmtFn={v=>v+'%'}/>
            <Slider label="VAT" value={Math.round(inputs.vatPct*100)} min={0} max={20} step={1} onChange={v=>upd('vatPct',v/100)} fmtFn={v=>v+'%'}/>
            <div style={divider}/>
            <div style={{opacity:isPro?1:0.45}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
                <span style={{fontSize:'0.85rem',fontWeight:'600',color:'#1a1a18'}}>Escalation{!isPro&&PRO_BADGE}</span>
                <label style={{display:'flex',alignItems:'center',gap:'6px',cursor:isPro?'pointer':'not-allowed',fontSize:'0.78rem',color:'#888'}}>
                  <input type="checkbox" checked={inputs.includeEscalation} onChange={e=>isPro&&upd('includeEscalation',e.target.checked)} disabled={!isPro}/>
                  Include in estimate
                </label>
              </div>
              <Slider label="Escalation rate" value={inputs.escalationRate} min={0} max={20} step={0.5} onChange={v=>isPro&&upd('escalationRate',v)} fmtFn={v=>v+'% p.a.'} locked={!isPro}/>
              <div style={{opacity:isPro?1:0.5}}>
                <label style={lbl}>Estimated start date</label>
                <input type="date" value={inputs.estimatedStartDate||''} onChange={e=>isPro&&upd('estimatedStartDate',e.target.value||null)} disabled={!isPro}
                  style={{width:'100%',padding:'0.6rem 0.875rem',border:'1.5px solid #e5e5e3',borderRadius:'10px',fontSize:'0.875rem',boxSizing:'border-box',background:isPro?'#fff':'#f9f9f9',cursor:isPro?'auto':'not-allowed',fontFamily:'inherit'}}/>
              </div>
              {isPro&&inputs.includeEscalation&&inputs.estimatedStartDate&&result&&result.yearsToStart<1&&(
                <p style={{fontSize:'0.72rem',color:'#e67e22',marginTop:'0.5rem'}}>Select a date more than 1 year away to see escalation breakdown.</p>
              )}
            </div>
          </div>

          {!isPro&&(<button onClick={handleCalc} style={{width:'100%',padding:'0.875rem',background:'#1a1a18',color:'#fff',border:'none',borderRadius:'12px',fontSize:'0.9rem',fontWeight:'600',cursor:'pointer',marginBottom:'1rem',fontFamily:'inherit'}}>Calculate estimate</button>)}

          <div className="mobile-summary" style={{display:'none'}}>
            {!result?(
              <div style={{...card,textAlign:'center',padding:'2rem 1.5rem'}}>
                <p style={{color:'#ccc',fontSize:'0.875rem'}}>{isPro?'Adjust any input to see a live estimate.':'Fill in inputs and click Calculate estimate.'}</p>
              </div>
            ):<Summary/>}
          </div>
        </div>

        <div className="desktop-right" style={{position:'sticky',top:'4.5rem'}}>
          {!result?(
            <div style={{...card,textAlign:'center',padding:'3rem 1.5rem'}}>
              <p style={{color:'#ccc',fontSize:'0.875rem'}}>{isPro?'Adjust any input to see a live estimate.':'Fill in inputs and click Calculate estimate.'}</p>
            </div>
          ):<Summary/>}
        </div>
      </div>

      <button onClick={()=>setFeedback(true)} style={{position:'fixed',bottom:'1.5rem',right:'1.5rem',background:'#1a1a18',color:'#fff',border:'none',borderRadius:'20px',padding:'0.5rem 1rem',fontSize:'0.78rem',fontWeight:'500',cursor:'pointer',boxShadow:'0 2px 12px rgba(0,0,0,0.15)',zIndex:50,fontFamily:'inherit'}}>Feedback</button>
      {feedback&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.3)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'#fff',borderRadius:'16px',padding:'1.5rem',width:'100%',maxWidth:'400px',margin:'1rem'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
              <span style={{fontSize:'0.9rem',fontWeight:'600'}}>Share feedback</span>
              <button onClick={()=>setFeedback(false)} style={{background:'none',border:'none',cursor:'pointer',color:'#ccc',fontSize:'1.25rem',lineHeight:1}}>x</button>
            </div>
            {fbSent?<p style={{color:'#27ae60',textAlign:'center',padding:'1rem 0'}}>Thanks noted.</p>:(
              <form onSubmit={e=>{e.preventDefault();setFbSent(true);setTimeout(()=>{setFeedback(false);setFbSent(false);setFbText('');},2000);}}>
                <textarea value={fbText} onChange={e=>setFbText(e.target.value)} required rows={4} placeholder="What is working? What is missing?"
                  style={{width:'100%',padding:'0.75rem',border:'1.5px solid #e5e5e3',borderRadius:'10px',fontSize:'0.875rem',resize:'vertical',boxSizing:'border-box',marginBottom:'0.75rem',fontFamily:'inherit'}}/>
                <button type="submit" style={{width:'100%',padding:'0.625rem',background:'#1a1a18',color:'#fff',border:'none',borderRadius:'10px',fontSize:'0.875rem',cursor:'pointer',fontFamily:'inherit'}}>Send</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
