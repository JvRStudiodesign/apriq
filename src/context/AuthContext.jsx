import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });
    const handleOnline = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) fetchProfile(session.user.id);
      });
    };
    window.addEventListener('online', handleOnline);
    return () => { subscription.unsubscribe(); window.removeEventListener('online', handleOnline); };
  }, []);

  async function fetchProfile(userId) {
    // Try profiles first (new schema), fall back to users (old schema)
    let { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!data) {
      const res = await supabase.from('users').select('*').eq('id', userId).single();
      data = res.data;
    }
    setProfile(data);
    if (data?.tier) localStorage.setItem('apriq_tier', data.tier);
    // Trial email triggers — fire-and-forget after profile loads
    if (data) {
      const trialEnd = data.trial_end_date ? new Date(data.trial_end_date) : null;
      const tier     = data.tier || 'free';
      const email    = data.email;
      const name     = data.full_name || '';
      if (email && tier === 'trial' && trialEnd) {
        const daysLeft = Math.ceil((trialEnd - new Date()) / 86400000);
        if (daysLeft <= 2 && daysLeft > 0) {
          fetch('/api/send-trial-warning', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ to:email, name }) }).catch(()=>{});
        } else if (daysLeft <= 0) {
          fetch('/api/send-trial-expired', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ to:email, name }) }).catch(()=>{});
        }
      }
    }
  }

  const value = { user, profile, loading, fetchProfile };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() { return useContext(AuthContext); }