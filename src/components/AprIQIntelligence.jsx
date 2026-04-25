import { useState, useRef, useEffect } from 'react';

const Q_LIMIT = 5;
const LS_KEY = 'apriq-intelligence-questions';
const FONT = "'Roboto',system-ui,sans-serif";
const SUGGESTED = [
  'What does it cost to build in SA?',
  'How does escalation affect my budget?',
  'What is a ROM estimate?',
];

function getUsed() {
  try {
    const d = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    const today = new Date().toISOString().split('T')[0];
    if (d.date !== today) return 0;
    return d.count || 0;
  } catch { return 0; }
}

function incrementUsed() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const d = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    const count = d.date === today ? (d.count || 0) + 1 : 1;
    localStorage.setItem(LS_KEY, JSON.stringify({ date: today, count }));
    return count;
  } catch { return 1; }
}

const s = {
  wrap: { position: 'fixed', bottom: '24px', right: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px', zIndex: 9999, colorScheme: 'light' },
  fab: { width: '48px', height: '48px', minWidth: '48px', minHeight: '48px', borderRadius: '10px', border: '1.5px solid #FF8210', background: '#F9FAFA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0, padding: 0 },
  ping: { position: 'absolute', top: '-3px', right: '-3px', width: '11px', height: '11px', borderRadius: '50%', background: '#FF8210', border: '2px solid #F9FAFA' },
  panel: { background: '#F9FAFA', border: '1px solid #E4E5E5', borderRadius: '20px', width: '320px', overflow: 'hidden', colorScheme: 'light' },
  header: { padding: '18px 18px 14px', borderBottom: '1px solid #E4E5E5', display: 'flex', alignItems: 'center', gap: '10px', background: '#F9FAFA' },
  avatar: { width: '36px', height: '36px', minWidth: '36px', borderRadius: '10px', border: '1.5px solid #FF8210', background: '#F9FAFA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title: { fontSize: '13px', fontWeight: 500, color: '#111111', fontFamily: FONT },
  sub: { fontSize: '11px', color: '#979899', marginTop: '1px', fontFamily: FONT },
  xbtn: { marginLeft: 'auto', width: '30px', height: '30px', minWidth: '30px', maxWidth: '30px', minHeight: '30px', maxHeight: '30px', borderRadius: '10px', border: '1px solid #E4E5E5', background: '#F9FAFA', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, flexShrink: 0 },
  body: { padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#F9FAFA', maxHeight: '260px', overflowY: 'auto' },
  aiBubble: { background: '#F9FAFA', border: '1px solid #E4E5E5', borderRadius: '16px', borderBottomLeftRadius: '4px', padding: '10px 13px', fontSize: '12px', color: '#111111', lineHeight: 1.6, maxWidth: '95%', fontFamily: FONT },
  userBubble: { background: '#E4E5E5', borderRadius: '16px', borderBottomRightRadius: '4px', padding: '10px 13px', fontSize: '12px', color: '#111111', lineHeight: 1.6, maxWidth: '90%', alignSelf: 'flex-end', fontFamily: FONT },
  msgLabel: { fontSize: '10px', color: '#979899', fontFamily: FONT },
  qlabel: { fontSize: '10px', color: '#979899', marginBottom: '6px', fontFamily: FONT },
  qrow: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  qchip: { padding: '5px 9px', borderRadius: '20px', border: '1px solid #BFD1D6', background: '#F9FAFA', fontSize: '10px', color: '#0F4C5C', cursor: 'pointer', fontFamily: FONT, lineHeight: 1.4 },
  counter: { fontSize: '10px', color: '#979899', textAlign: 'center', padding: '4px 0 6px', borderTop: '1px solid #E4E5E5', background: '#F9FAFA', fontFamily: FONT },
  footer: { padding: '10px 12px', borderTop: '1px solid #E4E5E5', display: 'flex', gap: '6px', alignItems: 'center', background: '#F9FAFA' },
  input: { flex: 1, padding: '8px 11px', fontSize: '11px', borderRadius: '10px', border: '1px solid #E4E5E5', background: '#F9FAFA', color: '#111111', fontFamily: FONT, outline: 'none', height: '34px' },
  sendBtn: (disabled) => ({ width: '32px', height: '32px', minWidth: '32px', borderRadius: '10px', background: disabled ? '#E4E5E5' : '#FF8210', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }),
  limitBody: { padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '14px', background: '#F9FAFA' },
  upgradeBtn: { display: 'block', width: '100%', padding: '11px', borderRadius: '12px', background: '#111111', color: '#F9FAFA', fontSize: '13px', fontWeight: 500, textDecoration: 'none', textAlign: 'center', fontFamily: FONT },
  trialBar: { padding: '10px 16px', borderTop: '1px solid #E4E5E5', background: '#F9FAFA', fontSize: '11px', color: '#979899', textAlign: 'center', fontFamily: FONT },
};

const FaceIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block' }}>
    <circle cx="9" cy="10" r="1.4" fill="#FF8210"/>
    <circle cx="15" cy="10" r="1.4" fill="#FF8210"/>
    <path d="M8 14.5c1.2 1.8 6 1.8 8 0" fill="none" stroke="#FF8210" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const SendIcon = ({ disabled }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={disabled ? '#979899' : '#111111'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="12" x2="22" y2="12"/><polyline points="14,4 22,12 14,20"/>
  </svg>
);

export default function AprIQIntelligence() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [questionsUsed, setQuestionsUsed] = useState(() => getUsed());
  const bodyRef = useRef(null);
  const hasAutoOpened = useRef(false);

  const atLimit = questionsUsed >= Q_LIMIT;
  const remaining = Q_LIMIT - questionsUsed;
  const chatStarted = messages.length > 0;

  useEffect(() => {
    if (!hasAutoOpened.current) {
      hasAutoOpened.current = true;
      const t = setTimeout(() => setOpen(true), 2000);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading || atLimit) return;
    setInput('');
    const updated = [...messages, { role: 'user', content: userMsg }];
    setMessages(updated);
    setLoading(true);
    try {
      const res = await fetch('/api/public-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, conversationHistory: messages }),
      });
      const data = await res.json();
      if (!res.ok) { setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }]); return; }
      const newCount = incrementUsed();
      setQuestionsUsed(newCount);
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Unable to connect. Please try again.' }]);
    } finally { setLoading(false); }
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  if (!open) {
    return (
      <div style={s.wrap}>
        <button style={s.fab} onClick={() => setOpen(true)}>
          <FaceIcon size={32}/>
          <div style={s.ping}/>
        </button>
      </div>
    );
  }

  return (
    <div style={s.wrap}>
      <div style={s.panel}>
        <div style={s.header}>
          <div style={s.avatar}><FaceIcon size={24}/></div>
          <div>
            <div style={s.title}>AprIQ Intelligence</div>
            <div style={s.sub}>Construction cost advisor</div>
          </div>
          <button style={s.xbtn} onClick={() => setOpen(false)}><XIcon/></button>
        </div>

        {atLimit ? (
          <>
            <div style={s.limitBody}>
              <FaceIcon size={36}/>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 500, color: '#111111', marginBottom: '6px', fontFamily: FONT }}>You have used your {Q_LIMIT} free questions</p>
                <p style={{ fontSize: '12px', color: '#979899', lineHeight: 1.6, fontFamily: FONT }}>Sign up free to continue. Your 30-day trial includes full AprIQ advisor access inside the platform.</p>
              </div>
              <a href="/signup" style={s.upgradeBtn}>Start free trial</a>
            </div>
            <div style={s.trialBar}>
              Already have an account? <a href="/login" style={{ color: '#0F4C5C', textDecoration: 'none', fontWeight: 500 }}>Sign in</a>
            </div>
          </>
        ) : (
          <>
            <div style={s.body} ref={bodyRef}>
              {!chatStarted && (
                <>
                  <div style={s.aiBubble}>Hi, I am AprIQ Intelligence. Ask me anything about construction costs in South Africa and I will give you a straight, professional answer.</div>
                  <div>
                    <div style={s.qlabel}>Suggested questions</div>
                    <div style={s.qrow}>
                      {SUGGESTED.map((q) => (
                        <button key={q} style={s.qchip} onClick={() => sendMessage(q)}>{q}</button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '92%' }}>
                  <span style={s.msgLabel}>{msg.role === 'user' ? 'You' : 'AprIQ Intelligence'}</span>
                  <div style={msg.role === 'user' ? s.userBubble : s.aiBubble}>{msg.content}</div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '92%' }}>
                  <span style={s.msgLabel}>AprIQ Intelligence</span>
                  <div style={s.aiBubble}><span style={{ color: '#979899' }}>Thinking...</span></div>
                </div>
              )}
            </div>
            <div style={s.counter}>{remaining} of {Q_LIMIT} questions remaining</div>
            <div style={s.footer}>
              <input style={s.input} placeholder="Ask a cost question..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} disabled={loading}/>
              <button style={s.sendBtn(loading || !input.trim())} onClick={() => sendMessage()} disabled={loading || !input.trim()}>
                <SendIcon disabled={loading || !input.trim()}/>
              </button>
            </div>
          </>
        )}
      </div>
      <button style={s.fab} onClick={() => setOpen(false)}>
        <FaceIcon size={32}/>
      </button>
    </div>
  );
}
