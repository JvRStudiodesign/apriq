import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFadeIn } from '../hooks/useFadeIn';
import { supabase } from '../lib/supabase';
import {
  effectiveTier,
  isPro as computeIsPro,
  canStartTrial,
  trialDaysLeft,
  hasUsedTrial,
  hasActiveSubscription,
  isCancelledButActive,
} from '../utils/tier';

const TIERS = [
  {
    id: 'free', name: 'Free', price: 'R0', period: 'always',
    description: 'Get started with AprIQ and explore the early-stage estimating workflow.',
    features: ['Basic cost estimates', 'Limited project workspaces', 'Limited client management', 'Basic AprIQ workflow access'],
    highlight: false,
  },
  {
    id: 'pro', name: 'Pro', price: 'R79', period: '/month',
    trialNote: '30-day free trial — no card required to start',
    description: 'A more complete working setup with expanded access for ongoing project and professional output needs.',
    features: ['Full cost estimates', 'More project workspaces', 'Full client management', 'Professional PDF exports', 'Shareable estimate links', 'Full AprIQ workflow access', 'More storage and saved data'],
    highlight: true,
  },
];

function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function BillingPage() {
  const r1 = useFadeIn(), r2 = useFadeIn(), r3 = useFadeIn();
  const { openUpgrade } = useOutletContext() || {};
  const { profile, fetchProfile } = useAuth();
  const [busy, setBusy] = useState(null); // 'trial' | 'cancel' | 'replace'
  const [error, setError] = useState(null);
  const [info, setInfo]  = useState(null);

  const tier = effectiveTier(profile);   // 'pro' | 'trial' | 'free'
  const isPro = computeIsPro(profile);    // true for pro OR active trial
  const eligibleForTrial = canStartTrial(profile);
  const trialActive = tier === 'trial';
  const cancelledButActive = isCancelledButActive(profile);
  const subActive = hasActiveSubscription(profile);
  const trialUsed = hasUsedTrial(profile);
  const daysLeft = trialDaysLeft(profile);

  async function authedFetch(url, body) {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('You must be signed in.');
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        Authorization:   `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
    return data;
  }

  async function handleStartTrial() {
    setError(null); setInfo(null); setBusy('trial');
    try {
      await authedFetch('/api/start-trial');
      if (profile?.id) await fetchProfile?.(profile.id);
      setInfo('Your 30-day Pro trial has started. Enjoy!');
    } catch (e) {
      setError(e.message || 'Could not start trial.');
    } finally {
      setBusy(null);
    }
  }

  async function handleCancel() {
    if (!window.confirm('Cancel your Pro subscription? You will keep Pro access until the end of your current billing period.')) return;
    setError(null); setInfo(null); setBusy('cancel');
    try {
      const res = await authedFetch('/api/payfast-cancel');
      if (profile?.id) await fetchProfile?.(profile.id);
      setInfo(`Subscription cancelled. Pro access retained until ${formatDate(res.pro_until)}.`);
    } catch (e) {
      setError(e.message || 'Could not cancel.');
    } finally {
      setBusy(null);
    }
  }

  async function handleReplaceCard() {
    // PayFast doesn't expose a "swap card" flow. We cancel the current
    // subscription, then open the upgrade modal in 'replace_card' mode so
    // the user re-subscribes with a new card. Pro access is retained
    // through pro_until.
    if (!window.confirm(
      'Replace card?\n\n' +
      'PayFast doesn\'t support changing the card on an existing subscription, ' +
      'so we\'ll cancel your current one and start a new subscription on the next page. ' +
      'You\'ll keep Pro access until the end of your current billing period.'
    )) return;
    setError(null); setInfo(null); setBusy('replace');
    try {
      if (subActive) await authedFetch('/api/payfast-cancel');
      if (profile?.id) await fetchProfile?.(profile.id);
      openUpgrade?.('replace_card');
    } catch (e) {
      setError(e.message || 'Could not replace card.');
    } finally {
      setBusy(null);
    }
  }

  // Primary CTA shown next to "Current plan"
  const primaryCta = (() => {
    if (subActive)        return null; // Pro active, manage below instead
    if (cancelledButActive) return { label: 'Resubscribe to Pro', onClick: () => openUpgrade?.('resubscribe') };
    if (trialActive)      return { label: 'Upgrade to Pro', onClick: () => openUpgrade?.('upgrade') };
    if (eligibleForTrial) return { label: 'Start 30-day free trial', onClick: handleStartTrial };
    return                       { label: 'Upgrade to Pro', onClick: () => openUpgrade?.('upgrade') };
  })();

  const planLabel = (() => {
    if (subActive && !cancelledButActive) return 'Pro';
    if (cancelledButActive)               return `Pro (cancels ${formatDate(profile?.pro_until)})`;
    if (trialActive)                      return `Pro Trial — ${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;
    if (trialUsed)                        return 'Free (trial ended)';
    return 'Free';
  })();

  const planColor = isPro ? '#FF8210' : '#979899';

  return (
    <div>
      <div style={s.pageTop} />

      {/* ── Current plan ─────────────────────────────────────────────────────── */}
      <section style={s.section}><div className="wrap" ref={r1}><div style={s.panel} className="fi-group">
        <h1 style={s.h1} className="fi">Billing and plan</h1>

        <div style={s.currentRow} className="fi">
          <div>
            <p style={s.label}>Current plan</p>
            <p style={{ ...s.currentPlan, color: planColor }}>{planLabel}</p>
          </div>
          {primaryCta && (
            <button
              style={s.upgradeCta}
              onClick={primaryCta.onClick}
              disabled={busy === 'trial'}
            >
              {busy === 'trial' ? 'Starting trial…' : primaryCta.label}
            </button>
          )}
        </div>

        {error && <div style={s.errorBox} className="fi">{error}</div>}
        {info  && <div style={s.infoBox}  className="fi">{info}</div>}
      </div></div></section>

      {/* ── Plans grid ──────────────────────────────────────────────────────── */}
      <section style={s.section}><div className="wrap" ref={r2}><div style={s.panel} className="fi-group">
        <h2 style={s.h2} className="fi">Plans</h2>
        <p style={s.body} className="fi">
          Choose the plan that fits how you work.
          {eligibleForTrial && ' Pro starts with a 30-day free trial — no credit card required to begin.'}
        </p>
        <div style={s.tierGrid} className="fi">
          {TIERS.map((t) => {
            const isCurrent = (t.id === 'free' && !isPro) || (t.id === 'pro' && isPro);

            // CTA logic per tier card
            let cta, onClickCard, disabled;
            if (t.id === 'free') {
              cta = isCurrent ? 'Your current plan' : 'Included with Pro';
              disabled = true;
            } else {
              if (subActive && !cancelledButActive)  { cta = 'Your current plan'; disabled = true; }
              else if (cancelledButActive)           { cta = 'Resubscribe to Pro';  onClickCard = () => openUpgrade?.('resubscribe'); }
              else if (trialActive)                  { cta = 'Upgrade to Pro';      onClickCard = () => openUpgrade?.('upgrade'); }
              else if (eligibleForTrial)             { cta = 'Start 30-day free trial'; onClickCard = handleStartTrial; }
              else                                   { cta = 'Upgrade to Pro';      onClickCard = () => openUpgrade?.('upgrade'); }
            }

            return (
              <div key={t.id} style={{ ...s.tierCard, borderColor: t.highlight ? '#0F4C5C' : '#E4E5E5' }}>
                {t.highlight && <div style={s.tierBadge}>Best value</div>}
                <div style={s.tierTop}>
                  <span style={s.tierName}>{t.name}</span>
                  <div style={s.tierPriceRow}>
                    <span style={s.tierPrice}>{t.price}</span>
                    <span style={s.tierPeriod}>{t.period}</span>
                  </div>
                  {t.trialNote && eligibleForTrial && <p style={s.trialNote}>{t.trialNote}</p>}
                </div>
                <p style={s.tierDesc}>{t.description}</p>
                <ul style={s.featureList}>
                  {t.features.map((f) => (
                    <li key={f} style={s.featureItem}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F4C5C" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      <span style={s.featureText}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  style={{
                    ...s.tierCta,
                    background: t.highlight && !disabled ? '#111111' : 'transparent',
                    color: t.highlight && !disabled ? '#F9FAFA' : '#979899',
                    border: t.highlight && !disabled ? 'none' : '1px solid #E4E5E5',
                    cursor: disabled ? 'default' : 'pointer',
                    opacity: disabled ? 0.7 : 1,
                  }}
                  disabled={disabled}
                  onClick={onClickCard}
                >
                  {cta}
                </button>
              </div>
            );
          })}
        </div>
      </div></div></section>

      {/* ── Manage subscription (only for Pro / cancelled-active) ───────────── */}
      <section style={{ ...s.section, paddingBottom: 80 }}><div className="wrap" ref={r3}><div style={s.panel} className="fi-group">
        <h2 style={s.h2} className="fi">Manage subscription</h2>

        <div style={s.manageGrid} className="fi">
          {/* Replace card — only when there's an active sub */}
          {subActive && !cancelledButActive && (
            <div style={s.manageCard}>
              <div style={s.manageIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F4C5C" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={s.manageLabel}>Card on file</p>
                <p style={s.manageSub}>Replacing your card cancels the current subscription and starts a fresh one.</p>
              </div>
              <button style={s.manageBtn} onClick={handleReplaceCard} disabled={busy === 'replace'}>
                {busy === 'replace' ? 'Working…' : 'Replace card'}
              </button>
            </div>
          )}

          {/* Next billing date */}
          {(subActive || cancelledButActive) && (
            <div style={s.manageCard}>
              <div style={s.manageIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F4C5C" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={s.manageLabel}>{cancelledButActive ? 'Pro access ends' : 'Next billing date'}</p>
                <p style={s.manageSub}>{formatDate(profile?.pro_until || profile?.subscription_renews_at)}</p>
              </div>
            </div>
          )}

          {/* Trial info */}
          {trialActive && (
            <div style={s.manageCard}>
              <div style={s.manageIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F4C5C" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={s.manageLabel}>Trial ends</p>
                <p style={s.manageSub}>{formatDate(profile?.trial_end_date)} · {daysLeft} day{daysLeft === 1 ? '' : 's'} remaining</p>
              </div>
            </div>
          )}

          {/* Help */}
          <div style={s.manageCard}>
            <div style={s.manageIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F4C5C" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={s.manageLabel}>Need help?</p>
              <p style={s.manageSub}>Contact us about your plan or billing.</p>
            </div>
            <button style={s.manageBtn} onClick={() => {
              if (window.__openContactModal) window.__openContactModal();
              else window.dispatchEvent(new CustomEvent('open-contact-modal'));
            }}>Contact support</button>
          </div>
        </div>

        {/* Cancel — only for an active (uncancelled) Pro subscription */}
        {subActive && !cancelledButActive && (
          <div style={s.cancelRow} className="fi">
            <hr style={s.divider} />
            <p style={s.cancelNote}>
              Cancelling your subscription will take effect at the end of your current billing period.
              You will retain Pro access until then.
            </p>
            <button style={s.cancelBtn} onClick={handleCancel} disabled={busy === 'cancel'}>
              {busy === 'cancel' ? 'Cancelling…' : 'Cancel subscription'}
            </button>
          </div>
        )}
      </div></div></section>
    </div>
  );
}

const s = {
  pageTop: { height: 48 }, section: { padding: '0 0 16px' },
  panel: { background: '#F9FAFA', border: '1px solid #E4E5E5', borderRadius: 16, padding: 32 },
  h1: { fontFamily: "'Aptos','Segoe UI',system-ui,sans-serif", fontSize: 26, fontWeight: 700, color: '#111111', marginBottom: 24 },
  h2: { fontFamily: "'Aptos','Segoe UI',system-ui,sans-serif", fontSize: 20, fontWeight: 600, color: '#111111', marginBottom: 12 },
  body: { fontFamily: "'Roboto',system-ui,sans-serif", fontSize: 14, color: '#979899', lineHeight: 1.7, marginBottom: 24 },
  label: { fontFamily: "'Roboto',system-ui,sans-serif", fontSize: 11, color: '#979899', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' },
  currentPlan: { fontFamily: "'Aptos','Segoe UI',system-ui,sans-serif", fontSize: 18, fontWeight: 600, color: '#111111' },
  currentRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 },
  upgradeCta: { padding: '10px 22px', background: '#111111', color: '#F9FAFA', border: 'none', borderRadius: 12, fontFamily: "'Roboto',system-ui,sans-serif", fontSize: 13, fontWeight: 500, cursor: 'pointer' },
  errorBox: { marginTop: 16, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '0.75rem 1rem', fontSize: 13, color: '#B91C1C' },
  infoBox:  { marginTop: 16, background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, padding: '0.75rem 1rem', fontSize: 13, color: '#065F46' },
  tierGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 },
  tierCard: { border: '1px solid', borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', background: '#F9FAFA' },
  tierBadge: { position: 'absolute', top: -1, right: 20, background: '#0F4C5C', color: '#F9FAFA', fontSize: 11, fontWeight: 500, fontFamily: "'Roboto',system-ui,sans-serif", padding: '4px 12px', borderRadius: '0 0 10px 10px' },
  tierTop: { display: 'flex', flexDirection: 'column', gap: 4 },
  tierName: { fontFamily: "'Aptos','Segoe UI',system-ui,sans-serif", fontSize: 17, fontWeight: 600, color: '#111111' },
  tierPriceRow: { display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 },
  tierPrice: { fontFamily: "'Aptos','Segoe UI',system-ui,sans-serif", fontSize: 28, fontWeight: 700, color: '#111111' },
  tierPeriod: { fontFamily: "'Roboto',system-ui,sans-serif", fontSize: 13, color: '#979899' },
  trialNote: { fontFamily: "'Roboto',system-ui,sans-serif", fontSize: 11, color: '#0F4C5C', marginTop: 4 },
  tierDesc: { fontFamily: "'Roboto',system-ui,sans-serif", fontSize: 13, color: '#979899', lineHeight: 1.6 },
  featureList: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 },
  featureItem: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  featureText: { fontFamily: "'Roboto',system-ui,sans-serif", fontSize: 13, color: '#111111', lineHeight: 1.4 },
  tierCta: { width: '100%', padding: '11px', borderRadius: 12, fontFamily: "'Roboto',system-ui,sans-serif", fontSize: 13, fontWeight: 500, marginTop: 8 },
  manageGrid: { display: 'flex', flexDirection: 'column', gap: 0 },
  manageCard: { display: 'flex', alignItems: 'center', gap: 16, padding: '18px 0', borderBottom: '1px solid #E4E5E5', flexWrap: 'wrap' },
  manageIcon: { width: 40, height: 40, borderRadius: 12, border: '1px solid #E4E5E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: '#F9FAFA' },
  manageLabel: { fontFamily: "'Roboto',system-ui,sans-serif", fontSize: 13, fontWeight: 500, color: '#111111', marginBottom: 2 },
  manageSub: { fontFamily: "'Roboto',system-ui,sans-serif", fontSize: 12, color: '#979899' },
  manageBtn: { marginLeft: 'auto', padding: '8px 18px', border: '1px solid #E4E5E5', borderRadius: 10, background: '#F9FAFA', fontFamily: "'Roboto',system-ui,sans-serif", fontSize: 12, color: '#111111', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' },
  cancelRow: { marginTop: 4 },
  divider: { border: 'none', borderTop: '1px solid #E4E5E5', margin: '24px 0 20px' },
  cancelNote: { fontFamily: "'Roboto',system-ui,sans-serif", fontSize: 12, color: '#979899', lineHeight: 1.6, marginBottom: 16, maxWidth: 480 },
  cancelBtn: { padding: '9px 20px', border: '1px solid #E4E5E5', borderRadius: 10, background: 'transparent', fontFamily: "'Roboto',system-ui,sans-serif", fontSize: 12, color: '#979899', cursor: 'pointer' },
};
