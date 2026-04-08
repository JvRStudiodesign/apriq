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
      // Trial email triggers (fire-and-forget, once per session)
      if (profileData) {
        const trialEnd = profileData.trial_end_date ? new Date(profileData.trial_end_date) : null;
        const tier     = profileData.tier || 'free';
        const email    = session?.user?.email;
        const name     = profileData.full_name || '';
        if (email && tier === 'trial' && trialEnd) {
          const daysLeft = Math.ceil((trialEnd - new Date()) / 86400000);
          if (daysLeft <= 2 && daysLeft > 0) {
            fetch('/api/send-trial-warning', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ to: email, name }),
            }).catch(() => {});
          } else if (daysLeft <= 0) {
            fetch('/api/send-trial-expired', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ to: email, name }),
            }).catch(() => {});
          }
        }
      }
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    // Try profiles first (new schema), fall back to users (old schema)
    let { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!data) {
      const res = await supabase.from('users').select('*').eq('id', userId).single();
      data = res.data;
    }
    setProfile(data);
  }

  const value = { user, profile, loading, fetchProfile };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() { return useContext(AuthContext); }