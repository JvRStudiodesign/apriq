// api/start-trial.js
// Starts a 30-day free trial for the authenticated user.
//
// Server-side checks prevent re-trials or trial-after-Pro abuse:
//   - Must be authenticated (Bearer token)
//   - profile.tier must be 'free' (not 'pro' / 'trial')
//   - profile.trial_started_at must be NULL (never trialled before)
//   - profile.cancelled_at must be NULL (didn't have a paid sub before)
//
// On success: profile.tier='trial', trial_started_at=now,
// trial_end_date=now + 30 days.

import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'nodejs' };

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TRIAL_DAYS = 30;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization || '';
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!accessToken) return res.status(401).json({ error: 'Not signed in.' });

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(accessToken);
    if (authErr || !user) return res.status(401).json({ error: 'Invalid session.' });

    const { data: profile, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('tier, trial_started_at, trial_end_date, cancelled_at, payfast_token')
      .eq('id', user.id)
      .single();

    if (profErr || !profile) return res.status(404).json({ error: 'Profile not found.' });

    // Hard server-side guards.
    if (profile.tier === 'pro') {
      return res.status(409).json({ error: 'You are already on Pro.' });
    }
    if (profile.tier === 'trial') {
      return res.status(409).json({ error: 'A trial is already active.' });
    }
    if (profile.trial_started_at || profile.trial_end_date) {
      return res.status(409).json({ error: 'You have already used your free trial.' });
    }
    if (profile.cancelled_at || profile.payfast_token) {
      return res.status(409).json({ error: 'Free trial is only for new users.' });
    }

    const startedAt = new Date();
    const endsAt    = new Date(startedAt.getTime() + TRIAL_DAYS * 86_400_000);

    const { error: updErr } = await supabaseAdmin
      .from('profiles')
      .update({
        tier:               'trial',
        trial_started_at:   startedAt.toISOString(),
        trial_end_date:     endsAt.toISOString(),
        subscription_status:'trial',
      })
      .eq('id', user.id);

    if (updErr) {
      console.error('start-trial: Supabase update failed', updErr);
      return res.status(500).json({ error: 'Could not start trial. Please try again.' });
    }

    console.log(`start-trial OK — user=${user.id} ends=${endsAt.toISOString()}`);
    return res.status(200).json({
      ok: true,
      trial_end_date: endsAt.toISOString(),
      days: TRIAL_DAYS,
    });

  } catch (err) {
    console.error('start-trial unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
