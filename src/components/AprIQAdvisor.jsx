import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const DAILY_LIMIT = 20;

const s = {
  overlay: { position:'fixed',inset:0,background:'rgba(15,76,92,0.18)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:'1rem',colorScheme:'light' },
  modal: { background:'#F9FAFA',border:'0.5px solid #E4E5E5',borderRadius:'12px',width:'100%',maxWidth:'480px',display:'flex',flexDirection:'column',maxHeight:'90vh',overflow:'hidden',colorScheme:'light' },
  header: { display:'flex',alignItems:'center',justifyContent:'space-between',padding:'13px 16px',borderBottom:'0.5px solid #E4E5E5',background:'#F9FAFA',flexShrink:0 },
  titleWrap: { display:'flex',alignItems:'center',gap:'8px' },
  dot: (active) => ({ width:'8px',height:'8px',borderRadius:'50%',background:active?'#FF8210':'#BFD1D6',flexShrink:0 }),
  title: { fontSize:'14px',fontWeight:500,color:'#111111' },
  meta: { display:'flex',alignItems:'center',gap:'8px',flexShrink:0 },
  counter: (warn) => ({ fontSize:'11px',color:warn?'#FF8210':'#979899',padding:'3px 8px',borderRadius:'20px',border:`0.5px solid ${warn?'#FF8210':'#E4E5E5'}`,background:'#F9FAFA',whiteSpace:'nowrap' }),
  xbtn: { width:'28px',height:'28px',minWidth:'28px',minHeight:'28px',maxWidth:'28px',maxHeight:'28px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',background:'#F9FAFA',border:'0.5px solid #E4E5E5',borderRadius:'6px',padding:0,flexShrink:0,alignSelf:'center' },
  body: { flex:1,overflowY:'auto',padding:'16px',display:'flex',flexDirection:'column',gap:'12px',background:'#F9FAFA',minHeight:'320px' },
  promptCard: { background:'rgba(228,229,229,0.5)',border:'0.5px solid #BFD1D6',borderRadius:'12px',padding:'16px',display:'flex',flexDirection:'column',gap:'12px' },
  promptLabel: { fontSize:'13px',color:'#979899',lineHeight:1.55 },
  promptBtns: { display:'flex',gap:'8px' },
  promptBtn: (primary) => ({ flex:1,padding:'8px 12px',borderRadius:'8px',fontSize:'13px',cursor:'pointer',fontFamily:'inherit',border:`0.5px solid ${primary?'#0F4C5C':'#E4E5E5'}`,background:primary?'#0F4C5C':'#F9FAFA',color:'#111111' }),
  msgWrap: (isUser) => ({ display:'flex',flexDirection:'column',gap:'4px',maxWidth:'92%',alignSelf:isUser?'flex-end':'flex-start',alignItems:isUser?'flex-end':'flex-start' }),
  msgLabel: { fontSize:'11px',color:'#979899' },
  bubble: (isUser) => ({ padding:'10px 13px',borderRadius:'12px',borderBottomRightRadius:isUser?'3px':'12px',borderBottomLeftRadius:isUser?'12px':'3px',fontSize:'13px',lineHeight:1.55,color:'#111111',background:isUser?'rgba(15,76,92,0.35)':'rgba(191,209,214,0.4)',border:isUser?'none':'0.5px solid rgba(191,209,214,0.6)',backdropFilter:'blur(8px)',WebkitBackdropFilter:'blur(8px)' }),
  footer: { padding:'10px 12px',borderTop:'0.5px solid #E4E5E5',display:'flex',gap:'8px',alignItems:'center',background:'#F9FAFA',flexShrink:0 },
  input: { flex:1,padding:'8px 12px',fontSize:'13px',borderRadius:'8px',border:'0.5px solid #E4E5E5',background:'#F9FAFA',color:'#111111',fontFamily:'inherit',height:'36px',outline:'none' },
  sendBtn: (disabled) => ({ width:'34px',height:'34px',minWidth:'34px',borderRadius:'8px',background:disabled?'#E4E5E5':'#FF8210',border:'none',cursor:disabled?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,opacity:disabled?0.5:1 }),
  warnStrip: { background:'rgba(191,209,214,0.4)',border:'0.5px solid #FF8210',borderRadius:'8px',padding:'10px 13px',fontSize:'12px',color:'#979899' },
  upgradeCard: { background:'rgba(255,130,16,0.08)',border:'0.5px solid #FF8210',borderRadius:'12px',padding:'20px',display:'flex',flexDirection:'column',alignItems:'center',gap:'16px',cursor:'pointer',textDecoration:'none',width:'100%' },
  upgradeBtn: { padding:'10px 24px',borderRadius:'8px',background:'#FF8210',color:'#111111',border:'none',fontSize:'13px',fontWeight:500,cursor:'pointer',fontFamily:'inherit' },
  trialBar: { padding:'10px 16px',borderTop:'0.5px solid #E4E5E5',background:'#E4E5E5',fontSize:'12px',color:'#979899',textAlign:'center',flexShrink:0 },
};

const XIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#979899" strokeWidth="1.5" strokeLinecap="round">
    <line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>
  </svg>
);
const SendIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="7" x2="13" y2="7"/><polyline points="8,2 13,7 8,12"/>
  </svg>
);
const LockIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

export default function AprIQAdvisor({ estimateState, onClose }) {
  const { user, profile } = useAuth();
  const [stage, setStage] = useState('prompt');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [questionsUsed, setQuestionsUsed] = useState(profile?.ai_questions_used || 0);
  const bodyRef = useRef(null);

  const tier = profile?.tier;
  const trialStart = profile?.trial_start ? new Date(profile.trial_start) : null;
  const daysSinceTrial = trialStart ? Math.floor((Date.now() - trialStart) / (1000*60*60*24)) : 999;
  const isLocked = tier === 'free';
  const isTrialAiExpired = tier === 'trial' && daysSinceTrial >= 7;
  const questionsRemaining = DAILY_LIMIT - questionsUsed;
  const atLimit = questionsRemaining <= 0;
  const nearLimit = questionsRemaining <= 4 && questionsRemaining > 0;

  useEffect(() => { if (isLocked || isTrialAiExpired) setStage('locked'); }, [isLocked, isTrialAiExpired]);
  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [messages, loading]);

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading || atLimit) return;
    setInput('');
    setStage('chat');
    const updatedMessages = [...messages, { role:'user', content:userMsg }];
    setMessages(updatedMessages);
    setLoading(true);
    try {
      const { data:{ session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/ai-advisor', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', ...(token?{Authorization:`Bearer ${token}`}:{}) },
        body: JSON.stringify({ message:userMsg, estimateState, conversationHistory:messages, userId:user.id })
      });
      const data = await res.json();
      if (res.status === 429) { setQuestionsUsed(DAILY_LIMIT); setMessages(prev=>[...prev,{role:'assistant',content:'You have reached your 20 question limit for today. Your limit resets tomorrow.'}]); return; }
      if (!res.ok) { setMessages(prev=>[...prev,{role:'assistant',content:'Something went wrong. Please try again.'}]); return; }
      setQuestionsUsed(data.questionsUsed);
      setMessages(prev=>[...prev,{role:'assistant',content:data.reply}]);
    } catch { setMessages(prev=>[...prev,{role:'assistant',content:'Unable to connect. Please check your connection and try again.'}]); }
    finally { setLoading(false); }
  };

  const handleSummary = () => sendMessage('Please give me a plain-language summary of my current estimate — what are the main cost drivers, how does this rate compare to typical projects of this type in South Africa, and are there any flags I should be aware of?');
  const handleKeyDown = (e) => { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); sendMessage(); } };

  if (stage === 'locked') return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e=>e.stopPropagation()}>
        <div style={s.header}>
          <div style={s.titleWrap}><div style={s.dot(false)}/><span style={s.title}>ApQ advisor</span></div>
          <div style={s.meta}><button style={s.xbtn} onClick={onClose}><XIcon/></button></div>
        </div>
        <div style={{...s.body,justifyContent:'center',alignItems:'center',padding:'20px'}}>
          <a href="/billing" style={s.upgradeCard}>
            <LockIcon/>
            <div style={{display:'flex',flexDirection:'column',gap:'6px',textAlign:'center'}}>
              <p style={{fontSize:'14px',fontWeight:500,color:'#111111'}}>{isTrialAiExpired?'Your AprIQ advisor trial has ended':'AprIQ advisor is a Pro feature'}</p>
              <p style={{fontSize:'13px',color:'#979899',lineHeight:1.55,maxWidth:'260px',margin:'0 auto'}}>Get instant feedback on your estimates, ask questions about your costs, and understand what is driving the numbers.</p>
            </div>
            <div style={s.upgradeBtn}>Upgrade to Pro — R79/month</div>
          </a>
        </div>
        <div style={s.trialBar}>Your 30-day trial includes 7 days of AprIQ advisor access.</div>
      </div></div>
  );

  if (stage === 'prompt') return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e=>e.stopPropagation()}>
        <div style={s.header}>
          <div style={s.titleWrap}><div style={s.dot(true)}/><span style={s.title}>AprIQ advisor</span></div>
          <div style={s.meta}>
            <span style={s.counter(false)}>{questionsRemaining} of {DAILY_LIMIT} remaining today</span>
            <button style={s.xbtn} onClick={onClose}><XIcon/></button>
          </div>
        </div>
        <div style={{...s.body,justifyContent:'center'}}>
          <div style={s.promptCard}>
            <p style={s.promptLabel}>Would you like a summary of your current estimate before we start?</p>
            <div style={s.promptBtns}>
              <button style={s.promptBtn(true)} onClick={handleSummary}>Yes, summarise it</button>
              <button style={s.promptBtn(false)} onClick={()=>setStage('chat')}>No, I have a question</button>
            </div>
          </div>
        </div>
        <div style={s.footer}>
          <input style={{...s.input,opacity:0.4}} placeholder="Ask anything about your estimate..." disabled/>
          <button style={s.sendBtn(true)} disabled><SendIcon/></button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e=>e.stopPropagation()}>
        <div style={s.header}>
          <div style={s.titleWrap}><div style={s.dot(true)}/><span style={s.title}>AprIQ advisor</span></div>
          <div style={s.meta}>
            <span style={s.counter(nearLimit||atLimit)}>{questionsRemaining} of {DAILY_LIMIT} remaining today</span>
            <button style={s.xbtn} onClick={onClose}><XIcon/></button>
          </div>
        </div>
        <div style={s.body} ref={bodyRef}>
          {messages.map((msg,i) => (
            <div key={i} style={s.msgWrap(msg.role==='user')}>
              <span style={s.msgLabel}>{msg.role==='user'?'You':'AprIQ advisor'}</span>
              <div style={s.bubble(msg.role==='user')}>{msg.content}</div>
            </div>
          ))}
          {loading && (
            <div style={s.msgWrap(false)}>
              <span style={s.msgLabel}>AprIQ advisor</span>
              <div style={s.bubble(false)}><span style={{color:'#979899'}}>Thinking...</span></div>
            </div>
          )}
          {nearLimit&&!atLimit&&(
            <div style={s.warnStrip}>You have <strong style={{color:'#FF8210'}}>{questionsRemaining} questions left today</strong>. Your limit resets tomorrow.</div>
          )}
          {atLimit&&(
            <div style={{...s.warnStrip,borderColor:'#E4E5E5'}}>You have reached your daily limit of {DAILY_LIMIT} questions. Your limit resets tomorrow.</div>
          )}
        </div>
        <div style={s.footer}>
          <input style={s.input} placeholder={atLimit?'Daily limit reached — resets tomorrow':'Ask anything about your estimate...'} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKeyDown} disabled={loading||atLimit}/>
          <button style={s.sendBtn(loading||atLimit||!input.trim())} onClick={()=>sendMessage()} disabled={loading||atLimit||!input.trim()}><SendIcon/></button>
        </div>
      </div>
    </div>
  );
}
