import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const DAILY_LIMIT = 20;
const FONT = "'Roboto',system-ui,sans-serif";
const UNLIMITED_AI_EMAIL = 'apriq@apriq.co.za';

const s = {
  overlay: { position:'fixed', inset:0, background:'rgba(17,17,17,0.42)', backdropFilter:'blur(5px)', WebkitBackdropFilter:'blur(5px)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:24 },
  panel: { background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:20, width:'100%', maxWidth:460, position:'relative', display:'flex', flexDirection:'column', maxHeight:'85vh', overflow:'hidden' },
  header: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px 16px', borderBottom:'1px solid #E4E5E5', flexShrink:0 },
  titleWrap: { display:'flex', alignItems:'center', gap:8 },
  dot: (active) => ({ width:8, height:8, borderRadius:'50%', background: active ? '#FF8210' : '#BFD1D6', flexShrink:0 }),
  title: { fontSize:15, fontWeight:500, color:'#111111', fontFamily:FONT },
  metaWrap: { display:'flex', alignItems:'center', gap:8, flexShrink:0 },
  counter: (warn) => ({ fontSize:11, color: warn ? '#FF8210' : '#979899', padding:'3px 10px', borderRadius:20, border:`1px solid ${warn ? '#FF8210' : '#E4E5E5'}`, background:'#F9FAFA', whiteSpace:'nowrap', fontFamily:FONT }),
  resetBtn: { padding:'6px 10px', borderRadius:'10px', border:'1px solid #E4E5E5', background:'#F9FAFA', cursor:'pointer', fontFamily:FONT, fontSize:'11px', color:'#979899', lineHeight:1, flexShrink:0 },
  closeBtn: { width:30, height:30, minWidth:30, minHeight:30, maxWidth:30, maxHeight:30, borderRadius:10, border:'1px solid #E4E5E5', background:'#F9FAFA', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, padding:0 },
  body: { flex:1, overflowY:'auto', padding:'20px 24px', display:'flex', flexDirection:'column', gap:12, background:'#F9FAFA' },
  promptCard: { background:'#F9FAFA', border:'1px solid #E4E5E5', borderRadius:16, padding:'20px 20px 16px', display:'flex', flexDirection:'column', gap:14 },
  promptLabel: { fontSize:14, color:'#111111', lineHeight:1.55, fontFamily:FONT },
  promptBtns: { display:'flex', gap:8 },
  promptBtn: (primary) => ({ flex:1, padding:'11px 12px', borderRadius:12, fontSize:13, cursor:'pointer', fontFamily:FONT, border: primary ? 'none' : '1px solid #E4E5E5', background: primary ? '#111111' : '#F9FAFA', color: primary ? '#F9FAFA' : '#111111', fontWeight: primary ? 500 : 400 }),
  msgWrap: (isUser) => ({ display:'flex', flexDirection:'column', gap:4, maxWidth:'88%', alignSelf: isUser ? 'flex-end' : 'flex-start', alignItems: isUser ? 'flex-end' : 'flex-start' }),
  msgLabel: { fontSize:11, color:'#979899', fontFamily:FONT },
  bubble: (isUser) => ({ padding:'10px 14px', borderRadius:16, borderBottomRightRadius: isUser ? 4 : 16, borderBottomLeftRadius: isUser ? 16 : 4, fontSize:13, lineHeight:1.55, color:'#111111', fontFamily:FONT, background: isUser ? '#E4E5E5' : '#F9FAFA', border: isUser ? 'none' : '1px solid #E4E5E5' }),
  footer: { padding:'12px 24px 20px', borderTop:'1px solid #E4E5E5', display:'flex', gap:8, alignItems:'center', background:'#F9FAFA', flexShrink:0 },
  input: { flex:1, padding:'10px 14px', fontSize:13, borderRadius:12, border:'1px solid #E4E5E5', background:'#F9FAFA', color:'#111111', fontFamily:FONT, outline:'none', height:40 },
  sendBtn: (disabled) => ({ width:40, height:40, minWidth:40, borderRadius:12, background: disabled ? '#E4E5E5' : '#FF8210', border:'none', cursor: disabled ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }),
  warnStrip: { background:'#F9FAFA', border:'1px solid #FF8210', borderRadius:12, padding:'10px 14px', fontSize:12, color:'#979899', fontFamily:FONT },
  upgradeCard: { background:'#F9FAFA', border:'1px solid #FF8210', borderRadius:16, padding:'28px 24px', display:'flex', flexDirection:'column', alignItems:'center', gap:16, cursor:'pointer', textDecoration:'none', width:'100%' },
  upgradeBtn: { width:'100%', padding:12, background:'#FF8210', color:'#111111', border:'none', borderRadius:12, fontSize:14, fontWeight:500, cursor:'pointer', fontFamily:FONT, textAlign:'center' },
  trialBar: { padding:'12px 24px', borderTop:'1px solid #E4E5E5', background:'#F9FAFA', fontSize:12, color:'#979899', textAlign:'center', flexShrink:0, fontFamily:FONT },
};

const XIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#979899" strokeWidth="1.5" strokeLinecap="round">
    <line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>
  </svg>
);
const SendIcon = ({ disabled }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={disabled ? '#979899' : '#111111'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="7" x2="13" y2="7"/><polyline points="8,2 13,7 8,12"/>
  </svg>
);
const LockIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

function extractManualLocation(messages) {
  const locationMsg = [...messages].reverse().find(msg => msg.role === 'user' && msg.type === 'location');
  return locationMsg?.content?.replace(/^Project location:\s*/i, '').trim() || '';
}

function stripAiFormatting(text) {
  const raw = String(text || '');
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/^\s*#{1,6}\s+/gm, '')
    .replace(/^\s*---+\s*$/gm, '')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function AprIQAdvisor({ estimateState, messages, setMessages, onClose }) {
  const { user, profile } = useAuth();
  const hasUnlimitedAi = (profile?.email || '').toLowerCase() === UNLIMITED_AI_EMAIL;
  const [stage, setStage] = useState(() => messages.length > 0 ? 'chat' : 'prompt');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [questionsUsed, setQuestionsUsed] = useState(hasUnlimitedAi ? 0 : (profile?.ai_questions_used || 0));
  const bodyRef = useRef(null);
  const assistantAnchorRef = useRef(0);
  const configuredLocation = estimateState?.projectLocation?.address?.trim() || '';
  const manualLocation = extractManualLocation(messages);
  const activeLocation = configuredLocation || manualLocation;
  const needsLocation = !activeLocation;
  const resetChat = () => {
    setMessages([]);
    setInput('');
    setLoading(false);
    setStage('prompt');
  };

  const tier = profile?.tier;
  const trialEnd = profile?.trial_end_date ? new Date(profile.trial_end_date) : null;
  const trialStart = trialEnd ? new Date(trialEnd.getTime() - 30 * 86400000) : null;
  const daysSinceTrial = trialStart ? Math.floor((Date.now() - trialStart) / 86400000) : 999;
  const isLocked = tier === 'free';
  const isTrialAiExpired = tier === 'trial' && daysSinceTrial >= 7;
  const effectiveUsed = hasUnlimitedAi ? 0 : questionsUsed;
  const questionsRemaining = DAILY_LIMIT - effectiveUsed;
  const atLimit = questionsRemaining <= 0;
  const nearLimit = questionsRemaining <= 4 && questionsRemaining > 0;

  useEffect(() => { if (isLocked || isTrialAiExpired) setStage('locked'); }, [isLocked, isTrialAiExpired]);
  useEffect(() => {
    if (!bodyRef.current) return;
    // If we just appended an assistant reply after a user action, keep the scroll
    // at the *start* of that new assistant message (not the bottom).
    if (assistantAnchorRef.current) {
      bodyRef.current.scrollTop = assistantAnchorRef.current;
      assistantAnchorRef.current = 0;
      return;
    }
    // Default behaviour: keep latest message in view while typing/loading.
    if (loading) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, loading]);

  const requestLocation = () => {
    setStage('chat');
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content: 'Before I summarise or give cost feedback, what is the project location or address? Location affects South African construction costs, so I will not assume it from your profile or other projects.',
      },
    ]);
  };

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading || atLimit) return;
    setInput('');
    setStage('chat');
    // Record the scroll height before the assistant reply arrives,
    // so we can anchor the view to the start of the next assistant message.
    assistantAnchorRef.current = bodyRef.current?.scrollHeight || 0;
    const isLocationReply = needsLocation && messages[messages.length - 1]?.role === 'assistant' && messages[messages.length - 1]?.content?.includes('what is the project location');
    const userMessage = isLocationReply
      ? { role: 'user', content: `Project location: ${userMsg}`, type: 'location' }
      : { role: 'user', content: userMsg };
    const locationForRequest = configuredLocation || (isLocationReply ? userMsg : manualLocation);
    const nextEstimateState = {
      ...estimateState,
      projectLocation: {
        ...(estimateState?.projectLocation || {}),
        address: locationForRequest || '',
        source: configuredLocation ? 'configured_project' : locationForRequest ? 'manual_chat' : 'missing',
      },
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ message: userMsg, estimateState: nextEstimateState, conversationHistory: messages, userId: user.id })
      });
      const data = await res.json();
      if (res.status === 429) {
        if (!hasUnlimitedAi) setQuestionsUsed(DAILY_LIMIT);
        setMessages(prev => [...prev, { role: 'assistant', content: 'You have reached your 20 question limit for today. Your limit resets tomorrow.' }]);
        return;
      }
      if (!res.ok) { setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again in a moment.' }]); return; }
      setQuestionsUsed(hasUnlimitedAi ? 0 : data.questionsUsed);
      setMessages(prev => [...prev, { role: 'assistant', content: stripAiFormatting(data.reply) }]);
    } catch { setMessages(prev => [...prev, { role: 'assistant', content: 'Unable to connect. Please check your connection and try again.' }]); }
    finally { setLoading(false); }
  };

  const handleSummary = () => {
    if (needsLocation) { requestLocation(); return; }
    sendMessage('Please give me a plain-language summary of my current estimate — what are the main cost drivers, how does this rate compare to typical projects of this type in South Africa, and are there any flags I should be aware of?');
  };
  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

if (stage === 'locked') return (
    <div className="apriq-advisor-overlay" style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="apriq-advisor-panel" style={s.panel}>
        <style>{`
          .apriq-advisor-overlay { padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left)); }
          .apriq-advisor-panel { max-height: calc(100dvh - 32px); }
          @media (max-width: 480px) {
            .apriq-advisor-overlay { padding: max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left)); }
            .apriq-advisor-panel { max-width: 100%; max-height: calc(100dvh - 24px); }
          }
        `}</style>
        <div style={s.header}>
          <div style={s.titleWrap}><div style={s.dot(false)}/><span style={s.title}>AprIQ advisor</span></div>
          <button style={s.closeBtn} onClick={onClose}><XIcon/></button>
        </div>
        <div style={{ ...s.body, justifyContent: 'center', alignItems: 'center' }}>
          <a href="/billing" style={s.upgradeCard}>
            <LockIcon/>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 15, fontWeight: 500, color: '#111111', fontFamily: FONT }}>{isTrialAiExpired ? 'Your AprIQ advisor trial has ended' : 'AprIQ advisor is a Pro feature'}</p>
              <p style={{ fontSize: 13, color: '#979899', lineHeight: 1.55, fontFamily: FONT }}>Get instant feedback on your estimates, ask questions about your costs, and understand what is driving the numbers.</p>
            </div>
            <div style={s.upgradeBtn}>Upgrade to Pro — R79/month</div>
          </a>
        </div>
        <div style={s.trialBar}>Your 30-day trial includes 7 days of AprIQ advisor access.</div>
      </div>
    </div>
  );

  if (stage === 'prompt') return (
    <div className="apriq-advisor-overlay" style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="apriq-advisor-panel" style={s.panel}>
        <style>{`
          .apriq-advisor-overlay { padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left)); }
          .apriq-advisor-panel { max-height: calc(100dvh - 32px); }
          @media (max-width: 480px) {
            .apriq-advisor-overlay { padding: max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left)); }
            .apriq-advisor-panel { max-width: 100%; max-height: calc(100dvh - 24px); }
          }
        `}</style>
        <div style={s.header}>
          <div style={s.titleWrap}><div style={s.dot(true)}/><span style={s.title}>AprIQ advisor</span></div>
          <div style={s.metaWrap}>
            <span style={s.counter(false)}>{questionsRemaining} of {DAILY_LIMIT} remaining today</span>
            <button style={s.resetBtn} onClick={resetChat} disabled={messages.length === 0 || loading} aria-disabled={messages.length === 0 || loading} title="Clear and restart this chat">
              Reset
            </button>
            <button style={s.closeBtn} onClick={onClose}><XIcon/></button>
          </div>
        </div>
        <div style={{ ...s.body, justifyContent: 'center' }}>
          <div style={s.promptCard}>
            <p style={s.promptLabel}>
              {configuredLocation
                ? `Using project location: ${configuredLocation}. Would you like a summary of your current estimate before we start?`
                : 'Would you like a summary of your current estimate before we start? I will ask for the project location first because location affects cost.'}
            </p>
          <div style={s.promptBtns}>
              <button style={s.promptBtn(true)} onClick={handleSummary}>Yes, summarise it</button>
              <button style={s.promptBtn(false)} onClick={() => setStage('chat')}>No, I have a question</button>
            </div>
          </div>
        </div>
        <div style={s.footer}>
          <input style={{ ...s.input, opacity: 0.4 }} placeholder="Ask anything about your estimate..." disabled/>
          <button style={s.sendBtn(true)} disabled><SendIcon disabled/></button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="apriq-advisor-overlay" style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="apriq-advisor-panel" style={s.panel}>
        <style>{`
          .apriq-advisor-overlay { padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left)); }
          .apriq-advisor-panel { max-height: calc(100dvh - 32px); }
          @media (max-width: 480px) {
            .apriq-advisor-overlay { padding: max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left)); }
            .apriq-advisor-panel { max-width: 100%; max-height: calc(100dvh - 24px); }
          }
        `}</style>
        <div style={s.header}>
          <div style={s.titleWrap}><div style={s.dot(true)}/><span style={s.title}>AprIQ advisor</span></div>
          <div style={s.metaWrap}>
            <span style={s.counter(nearLimit || atLimit)}>{questionsRemaining} of {DAILY_LIMIT} remaining today</span>
            <button style={s.resetBtn} onClick={resetChat} disabled={messages.length === 0 || loading} aria-disabled={messages.length === 0 || loading} title="Clear and restart this chat">
              Reset
            </button>
            <button style={s.closeBtn} onClick={onClose}><XIcon/></button>
          </div>
        </div>
        <div style={s.body} ref={bodyRef}>
          {configuredLocation && (
            <div style={s.warnStrip}>Using configured project location: <strong style={{ color: '#111111' }}>{configuredLocation}</strong></div>
          )}
          {messages.map((msg, i) => (
            <div key={i} style={s.msgWrap(msg.role === 'user')}>
              <span style={s.msgLabel}>{msg.role === 'user' ? 'You' : 'AprIQ advisor'}</span>
              <div style={s.bubble(msg.role === 'user')}>{msg.content}</div>
            </div>
          ))}
          {loading && (
            <div style={s.msgWrap(false)}>
              <span style={s.msgLabel}>AprIQ advisor</span>
              <div style={s.bubble(false)}><span style={{ color: '#979899' }}>Thinking...</span></div>
            </div>
          )}
          {nearLimit && !atLimit && (
            <div style={s.warnStrip}>You have <strong style={{ color: '#FF8210' }}>{questionsRemaining} questions left today</strong>. Your limit resets tomorrow.</div>
          )}
          {atLimit && (
            <div style={{ ...s.warnStrip, borderColor: '#E4E5E5' }}>You have reached your daily limit of {DAILY_LIMIT} questions. Your limit resets tomorrow.</div>
          )}
        </div>
        <div style={s.footer}>
          <input style={s.input} placeholder={atLimit ? 'Daily limit reached — resets tomorrow' : 'Ask anything about your estimate...'} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} disabled={loading || atLimit}/>
          <button style={s.sendBtn(loading || atLimit || !input.trim())} onClick={() => sendMessage()} disabled={loading || atLimit || !input.trim()}>
            <SendIcon disabled={loading || atLimit || !input.trim()}/>
          </button>
        </div>
      </div>
    </div>
  );
}
