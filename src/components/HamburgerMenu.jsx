import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const tier = profile?.tier || 'free';
  const trialEnd = profile?.trial_end_date ? new Date(profile.trial_end_date) : null;
  const trialOk = tier === 'trial' && trialEnd && trialEnd > new Date();
  const isPro = tier === 'pro' || trialOk;
  const daysLeft = trialEnd ? Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24)) : 0;

  useEffect(() => {
    function outside(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, []);

  async function handleLogout() { setOpen(false); await supabase.auth.signOut(); }
  const go = (path) => { navigate(path); setOpen(false); };

  const item = (label, path) => (
    <div key={path} onClick={() => go(path)}
      style={{ padding: '0.6rem 1rem', cursor: 'pointer', fontSize: '0.875rem', color: '#1a1a18', borderRadius: '8px', transition: 'background 0.1s' }}
      onMouseEnter={e => e.currentTarget.style.background = '#f5f5f3'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      {label}
    </div>
  );

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px', marginRight: '2px' }}
        onMouseEnter={e => e.currentTarget.style.background = '#f5f5f3'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        {[0,1,2].map(i => <span key={i} style={{ display: 'block', width: '18px', height: '2px', background: '#1a1a18', borderRadius: '2px' }} />)}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: '#fff', borderRadius: '12px', border: '1px solid #eeede8', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', minWidth: '200px', padding: '0.4rem', zIndex: 200 }}>
          <div style={{ padding: '0.4rem 1rem 0.25rem', fontSize: '0.65rem', color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>Menu</div>
          {item('Projects', '/projects')}
          {item('Clients', '/clients')}
          {item('User Profile', '/profile')}
          <div style={{ borderTop: '1px solid #f0f0ee', margin: '0.3rem 0' }} />
          <div style={{ padding: '0.35rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', background: isPro ? '#eaf3de' : '#f0f0ee', color: isPro ? '#27500a' : '#aaa', padding: '2px 8px', borderRadius: '8px', fontWeight: '600' }}>
              {tier === 'pro' ? 'Pro' : trialOk ? `Trial · ${daysLeft}d` : 'Free'}
            </span>
          </div>
          <div onClick={handleLogout}
            style={{ padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.82rem', color: '#e74c3c', borderRadius: '8px', transition: 'background 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#fdecea'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            Sign out
          </div>
        </div>
      )}
    </div>
  );
}
