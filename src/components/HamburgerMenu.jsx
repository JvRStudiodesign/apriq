import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  async function handleLogout() {
    setOpen(false);
    await supabase.auth.signOut();
    navigate('/login');
  }

  const item = (label, path) => (
    <button
      onClick={() => { setOpen(false); navigate(path); }}
      style={{
        display: 'block', width: '100%', padding: '0.625rem 1rem',
        background: location.pathname === path ? '#BFD1D6' : 'transparent',
        border: 'none', textAlign: 'left', fontSize: '0.875rem',
        color: '#111111', cursor: 'pointer', fontFamily: 'inherit',
        borderRadius: '10px', fontWeight: location.pathname === path ? '600' : '400',
      }}>
      {label}
    </button>
  );

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', display: 'flex', flexDirection: 'column', gap: '4px', marginRight: '4px' }}>
        <span style={{ display: 'block', width: '18px', height: '2px', background: '#FF8210', borderRadius: '2px' }} />
        <span style={{ display: 'block', width: '18px', height: '2px', background: '#FF8210', borderRadius: '2px' }} />
        <span style={{ display: 'block', width: '18px', height: '2px', background: '#FF8210', borderRadius: '2px' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '110%', left: 0, background: '#F9FAFA',
          borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          border: '1px solid #E4E5E5', minWidth: '180px', padding: '6px', zIndex: 200,
        }}>
          {item('Configurator', '/')}
          {item('Projects', '/projects')}
          {item('Clients', '/clients')}
          {item('User Profile', '/profile')}
          {item('Upgrade to Pro', '/upgrade')}
          {item('Billing', '/billing')}
          <div style={{ borderTop: '1px solid #E4E5E5', margin: '4px 0' }} />
          <button onClick={handleLogout} style={{ display: 'block', width: '100%', padding: '0.625rem 1rem', background: 'transparent', border: 'none', textAlign: 'left', fontSize: '0.875rem', color: '#0F4C5C', cursor: 'pointer', fontFamily: 'inherit', borderRadius: '8px' }}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}