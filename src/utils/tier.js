// Single source of truth for tier resolution.
// Imported anywhere you'd otherwise re-derive isPro / isTrial / etc.
//
// The DB stores `tier` ('free' | 'trial' | 'pro') as the user's *intended*
// tier, but a trial can expire and a Pro subscription can be cancelled with
// access continuing until the end of the paid period. Computing the
// *effective* tier from the profile fields means we don't need cron jobs.

const now = () => new Date();

// Dev-only escape hatch to unlock Pro features locally.
// Usage: in devtools console run: localStorage.setItem('apriq_dev_pro','1') then refresh.
function devForcePro() {
  try {
    // Vite injects this at build time; in production it is false.
    if (!import.meta.env?.DEV) return false;
    return localStorage.getItem('apriq_dev_pro') === '1';
  } catch {
    return false;
  }
}

function isFutureDate(d) {
  if (!d) return false;
  const t = new Date(d).getTime();
  return Number.isFinite(t) && t > Date.now();
}

/**
 * Returns 'pro' | 'trial' | 'free' based on the profile fields.
 *
 *   tier='pro'  + pro_until in the future          → 'pro'
 *   tier='pro'  + pro_until null                   → 'pro' (admin / unlimited)
 *   tier='pro'  + pro_until in the past            → 'free' (sub ended)
 *   tier='trial'+ trial_end_date in the future     → 'trial'
 *   tier='trial'+ trial_end_date in the past/null  → 'free' (trial expired)
 *   anything else                                  → 'free'
 */
export function effectiveTier(profile) {
  if (devForcePro()) return 'pro';
  if (!profile) return 'free';
  if (profile.tier === 'pro') {
    if (profile.pro_until == null)        return 'pro';
    if (isFutureDate(profile.pro_until))  return 'pro';
    return 'free';
  }
  if (profile.tier === 'trial') {
    if (isFutureDate(profile.trial_end_date)) return 'trial';
    return 'free';
  }
  return 'free';
}

/** True if the user gets Pro features (active Pro OR within trial). */
export function isPro(profile) {
  const t = effectiveTier(profile);
  return t === 'pro' || t === 'trial';
}

/** True if the user has never had a trial AND isn't currently/previously Pro. */
export function canStartTrial(profile) {
  if (!profile) return false;
  if (profile.tier === 'pro')         return false;       // already Pro / was Pro
  if (profile.cancelled_at)           return false;       // had a paid sub
  if (profile.trial_started_at)       return false;       // had a trial
  if (profile.trial_end_date)         return false;       // had a trial (legacy)
  return true;
}

/** Days remaining on the current trial. 0 if no trial / expired. */
export function trialDaysLeft(profile) {
  if (!profile?.trial_end_date) return 0;
  const ms = new Date(profile.trial_end_date).getTime() - now().getTime();
  return ms > 0 ? Math.ceil(ms / 86_400_000) : 0;
}

/** True if a trial existed and has ended (used to swap CTAs). */
export function hasUsedTrial(profile) {
  if (!profile) return false;
  if (profile.trial_started_at && !isFutureDate(profile.trial_end_date)) return true;
  if (profile.trial_end_date && !isFutureDate(profile.trial_end_date))   return true;
  return false;
}

/** True if the user has an active paid subscription that hasn't been cancelled. */
export function hasActiveSubscription(profile) {
  if (!profile) return false;
  if (profile.tier !== 'pro') return false;
  if (profile.cancelled_at)   return false;
  if (profile.pro_until && !isFutureDate(profile.pro_until)) return false;
  return true;
}

/** True if the user cancelled but is still inside the paid period. */
export function isCancelledButActive(profile) {
  if (!profile?.cancelled_at) return false;
  return isFutureDate(profile.pro_until);
}
