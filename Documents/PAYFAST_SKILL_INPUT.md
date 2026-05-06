# PayFast + Subscription System — Skill Input Document

> A comprehensive, self-contained record of every issue, fix, and architectural decision made during the AprIQ subscription system implementation. Feed this entire document to Claude with the instruction: **"Create a Cursor Skill from this document so I never have to troubleshoot these issues again."**

---

## Project context

- **Stack:** React (Vite) frontend, Vercel serverless functions (Node.js), Supabase Postgres + Auth, PayFast payment gateway
- **Domain:** AprIQ — South African construction estimating SaaS (R79/month subscription)
- **Currency:** ZAR (PayFast is a South African gateway)
- **Three tiers:** `free` (default, limited), `trial` (30 days full Pro features, AI advisor only first 7 days @ 5 q/day), `pro` (R79/month recurring)

---

## Part 1 — Starting Problem

### Symptom

Every attempt to upgrade to Pro returned an HTTP 400 from PayFast:

> Generated signature does not match submitted signature

### What was tried first (and didn't fix it)

- Verified merchant ID matched dashboard → matched
- Verified merchant key matched dashboard → matched
- Verified passphrase matched dashboard → matched
- Re-saved env vars in Vercel → still failed

### Why none of those worked

The signature generation code itself was wrong. Three independent bugs in `api/payfast-sign.js`:

1. Excluded `merchant_key` from the signature string (must be **included**)
2. Used `encodeURIComponent` (lowercase hex, spaces → `%20`) instead of PHP-style `urlencode` (uppercase hex, spaces → `+`)
3. Sorted parameters alphabetically (correct for PayFast's API integration, **wrong** for Custom/Onsite Integration which uses documented insertion order)

---

## Part 2 — PayFast Has Two Integration Types With Different Signature Rules

This is the single most important thing to understand. Mixing them up will cause silent failures.

| Integration | Used for | Param order | URL encoding | Endpoint |
|---|---|---|---|---|
| **Custom / Onsite (form POST)** | Subscribe users to a recurring plan | **Documented insertion order** (NOT alphabetical) | PHP-style `urlencode` (`%20`→`+`, uppercase hex) | `(www\|sandbox).payfast.co.za/eng/process` |
| **API (server-to-server)** | Cancel subscription, fetch status, etc. | **Alphabetical** (`ksort`) | Same PHP-style | `api.payfast.co.za` (live AND sandbox, append `?testing=true` for sandbox) |

### Documented Custom Integration field order (DO NOT REORDER)

```
merchant_id, merchant_key, return_url, cancel_url, notify_url,
name_first, name_last, email_address, m_payment_id, amount,
item_name, item_description, custom_str1, subscription_type,
billing_date, recurring_amount, frequency, cycles
```

### Correct Custom Integration signing algorithm

```
1. Build params in the order above (do not reorder, do not alphabetize)
2. Trim every value with .trim()
3. Drop any param whose value is '', null, or undefined (drop from BOTH form AND signature)
4. URL-encode each value with PHP urlencode rules:
     - encodeURIComponent(value)
     - replace %20 → '+'
     - hex chars must be UPPERCASE
5. Build query string: key1=urlencoded(val1)&key2=urlencoded(val2)&...
6. If passphrase set in PayFast dashboard, append: &passphrase=urlencoded(trim(passphrase))
7. signature = md5(string).toLowerCase()
```

### Correct API signing algorithm (Subscription Management)

```
1. Build headers (NOT body): merchant-id, version='v1', timestamp=ISO, passphrase
2. SORT ALPHABETICALLY (the OPPOSITE of Custom Integration)
3. Build query string: key=urlencoded(value) joined by &
4. md5 → lowercase hex
5. Send as 'signature' header alongside merchant-id, version, timestamp
6. DROP the passphrase header before sending
```

### `phpUrlencode` helper (use verbatim)

```javascript
function phpUrlencode(str) {
  return encodeURIComponent(String(str ?? ''))
    .replace(/%20/g, '+')
    .replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}
```

---

## Part 3 — Payment Redirect Flow Evolution

This took **4 iterations** because Chromium's user-activation rules kept blocking different approaches. Skip straight to Attempt 4.

### Attempt 1: Self-submitting form POST in modal — FAILED
React modal called `fetch('/api/payfast-sign')` to get signed params, then dynamically built and submitted a `<form>`.
**Why it failed:** Chromium silently blocks `form.submit()` after `await fetch()` — by the time the await resolves, the user-activation token has expired.

### Attempt 2: Native form POST to backend, backend returns self-submitting HTML — FAILED
Backend returned `<html>` with `<form>` that auto-submits via `<script>document.forms[0].submit()</script>`.
**Why it failed:** Same user-activation issue — script-driven submit blocked after backend response.

### Attempt 3: HTTP 303 redirect to PayFast GET URL — FAILED
Backend returned `Location: https://...payfast.../eng/process?...&signature=...`.
**Why it failed:** Some browsers don't follow 303 redirects from a POST cleanly when chained through fetch.

### Attempt 4 — WORKING ✅: Backend returns JSON `{ url }`, client uses `window.location.assign(url)`

```javascript
// api/payfast-redirect.js (server)
return res.status(200).json({ url: payfastUrl });

// UpgradeModal.jsx (client)
const r = await fetch('/api/payfast-redirect', { method:'POST', body:JSON.stringify({...}) });
const { url } = await r.json();
window.location.assign(url);  // <- treated as same-tick navigation, bypasses user-activation
```

### Final flow

```
User clicks "Subscribe — R79/month"
  ↓
fetch POST /api/payfast-redirect { userId, email, firstName, lastName }
  ↓
Backend builds signed Custom Integration URL → returns { url: '...' }
  ↓
window.location.assign(url) → navigates to PayFast hosted page
  ↓
User pays → PayFast redirects to return_url (/payment-success)
  ↓
Meanwhile, PayFast POSTs ITN to notify_url (/api/payfast-itn) server-to-server
  ↓
ITN handler verifies signature, updates profile in Supabase
  ↓
PaymentSuccess polls profile every 2.5s for up to 60s, redirects to /plans on success
```

---

## Part 4 — Environment Configuration

### THE CARDINAL RULE

**Vercel does NOT pick up env-var changes for deployments that are already built.** Every time you change an env var, you MUST manually redeploy with "Use existing build cache" un-ticked. Otherwise the function is still running with old values.

This rule alone caused multiple hours of debugging.

### Sandbox vs Live env var values

| Variable | Sandbox value | Live value |
|---|---|---|
| `PAYFAST_SANDBOX` | `true` (or unset) | `false` |
| `PAYFAST_MERCHANT_ID` | `10000100` | (live merchant ID from dashboard) |
| `PAYFAST_MERCHANT_KEY` | `46f0cd694581a` | (live merchant key from dashboard) |
| `PAYFAST_PASSPHRASE` | **`jt7NOE43FZPn`** (yes, sandbox merchant `10000100` requires this exact passphrase) | (live passphrase from dashboard, paste verbatim) |
| `APP_URL` | `https://www.apriq.co.za` | `https://www.apriq.co.za` |

### Critical sandbox detail

The PayFast sandbox merchant `10000100` is **not passphrase-less**. It requires the passphrase `jt7NOE43FZPn` even though docs sometimes imply sandbox doesn't use one. This caused multiple hours of debugging. ALWAYS set this passphrase for sandbox testing.

### One consistent rule across all 3 handlers

```javascript
const isSandbox = process.env.PAYFAST_SANDBOX !== 'false';
```

This means:
- env var missing/blank → **sandbox** (safe default for new deployments)
- `PAYFAST_SANDBOX=true` → sandbox
- `PAYFAST_SANDBOX=false` → live
- any other value → sandbox

Previously the three handlers disagreed (some used `=== 'true'`), causing silent inconsistency when the var was missing. **All three must use the same rule.**

### PayFast hosts — do not confuse them

| Host | Purpose | Use for |
|---|---|---|
| `https://sandbox.payfast.co.za/eng/process` | Sandbox **payment** site (Laravel app, has CSRF) | Custom Integration form POST (sandbox only) |
| `https://www.payfast.co.za/eng/process` | Live **payment** site | Custom Integration form POST (live only) |
| `https://api.payfast.co.za` | API host (BOTH live and sandbox) | Subscription Management API. Append `?testing=true` for sandbox. |

**Critical gotcha:** hitting `sandbox.payfast.co.za` for an API call returns `419 CSRF token mismatch` because that domain runs a Laravel app with CSRF middleware. Always hit `api.payfast.co.za` for API calls regardless of sandbox/live.

---

## Part 5 — ITN Handler (the hardest part)

### What an ITN is

PayFast Instant Transaction Notification — a server-to-server POST sent immediately after every successful (or failed) payment, including recurring subscription charges. This is the **only reliable way** to know a payment succeeded; the user's redirect to `/payment-success` is just a UX nicety and can fail if the user closes the browser.

### Bug 1: Vercel default body parser corrupted the raw body

Vercel parses POST bodies into `req.body` by default, which **changes the byte order and decoding** of form-urlencoded data. Signature verification becomes impossible because we need the exact bytes PayFast sent.

**Fix:**
```javascript
export const config = {
  runtime: 'nodejs',
  api: { bodyParser: false },
};
```

Then read the raw stream manually and parse the form body ourselves while preserving insertion order:

```javascript
async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

function parseFormBody(raw) {
  // Returns array of [key, value] pairs in insertion order — do NOT use Object
  const pairs = [];
  for (const part of raw.split('&')) {
    if (!part) continue;
    const eq = part.indexOf('=');
    const key = decodeURIComponent((eq === -1 ? part : part.slice(0, eq)).replace(/\+/g, ' '));
    const val = eq === -1 ? '' : decodeURIComponent(part.slice(eq + 1).replace(/\+/g, ' '));
    pairs.push([key, val]);
  }
  return pairs;
}
```

### Bug 2: PayFast sandbox sends params in inconsistent order

Sometimes alphabetical, sometimes documented-insertion-order. The signature won't match unless we hash the same order PayFast did.

**Fix:** try multiple signature variants, log which one matched:

```javascript
function buildSignatureVariants(pairs, passphrase) {
  const variants = [];
  const orderings = [
    { name: 'insertion',                pairs: pairs.slice() },
    { name: 'alphabetical',             pairs: pairs.slice().sort((a, b) => a[0].localeCompare(b[0])) },
  ];
  for (const o of orderings) {
    for (const dropEmpty of [false, true]) {
      for (const withPass of [true, false]) {
        const filtered = dropEmpty ? o.pairs.filter(([, v]) => v !== '') : o.pairs;
        const noSig = filtered.filter(([k]) => k !== 'signature');
        let str = noSig.map(([k, v]) => `${k}=${phpUrlencode(v)}`).join('&');
        if (withPass && passphrase) str += `&passphrase=${phpUrlencode(passphrase)}`;
        variants.push({ name: `${o.name}_${dropEmpty?'no_empty':'with_empty'}_${withPass?'with_pass':'no_pass'}`, str });
      }
    }
  }
  return variants;
}

const variants = buildSignatureVariants(pairs, passphrase);
let matched = null;
for (const v of variants) {
  const sig = crypto.createHash('md5').update(v.str).digest('hex');
  if (sig === submittedSig) { matched = v; break; }
}
console.log(`[itn] signature ${matched ? `OK using variant: ${matched.name}` : 'FAILED — tried '+variants.length+' variants'}`);
```

### Bug 3: ITN was updating the wrong table/column

Original code wrote to `users.user_tier`. **That column doesn't exist.** App uses `profiles.tier`.

**Fix:** rewrote ITN to update `profiles`:

```javascript
await supabase.from('profiles').update({
  tier: 'pro',
  subscription_status: 'active',
  pro_until: computedProUntil,
  payfast_token: params.token,
  cancelled_at: null,
  subscription_updated_at: new Date().toISOString(),
}).eq('id', userId);
```

### Bug 4: `pro_until` was being set to a date in the past

PayFast sends `billing_date` for the FIRST payment as today's date at 00:00 UTC. Depending on the user's timezone, this is already in the past in their local clock. So `effectiveTier()` would immediately return `free` because `pro_until < now`.

**Fix:** clamp to ≥ now + 1 month:

```javascript
function computeProUntil(billingDate) {
  const oneMonthFromNow = new Date(Date.now() + 30 * 86400000);
  const billing = billingDate ? new Date(billingDate) : null;
  const billingPlusMonth = billing ? new Date(billing.getTime() + 30 * 86400000) : null;
  return new Date(Math.max(
    oneMonthFromNow.getTime(),
    billingPlusMonth?.getTime() || 0
  )).toISOString();
}
```

### Bug 5: ITN handler returned 500 on verification failure → PayFast retried indefinitely

PayFast retries failed ITNs aggressively. A 500 response causes infinite retries that flood your logs.

**Fix:** always return `200 OK`, even on verification failure. Log the failure for ourselves but acknowledge to PayFast so it stops retrying.

```javascript
if (!matched) {
  console.error('[itn] signature verification FAILED — acknowledging to prevent retries');
  return res.status(200).send('OK');  // 200 even on failure
}
```

### ITN logging convention

Every step prefixed with `[itn]` for easy log filtering:

```
[itn] received 1234 bytes from 197.97.50.146
[itn] signature OK using variant: insertion_no_empty_with_pass
[itn] payment_status=COMPLETE m_payment_id=abc-123 token=xyz
[itn] profile updated for user abc → tier=pro pro_until=2026-06-06T...
```

---

## Part 6 — Subscription Cancellation API

### What broke first

`api/payfast-cancel.js` was hitting `https://sandbox.payfast.co.za/api/subscriptions/{token}/cancel`. Returned `419 CSRF token mismatch`.

### Why

`sandbox.payfast.co.za` is the **payment website** (Laravel app with CSRF middleware). It's not the API host.

### Fix

Always hit `api.payfast.co.za`, append `?testing=true` for sandbox:

```javascript
const apiHost     = 'api.payfast.co.za';
const testingFlag = isSandbox ? '?testing=true' : '';
const path        = `/subscriptions/${encodeURIComponent(profile.payfast_token)}/cancel${testingFlag}`;
```

### Capturing the subscription token

PayFast sends a `token` field in the ITN POST when a subscription is created. The cancel API needs this token. Capture on first ITN:

```javascript
payfast_token: params.token,  // stored in profiles.payfast_token
```

### Cancel flow

1. `BillingPage.jsx` "Cancel" button → POST `/api/payfast-cancel`
2. Backend authenticates user via Supabase JWT, looks up `profile.payfast_token`
3. Sends signed PUT to `https://api.payfast.co.za/subscriptions/{token}/cancel[?testing=true]`
4. On 2xx: updates `profiles` with `subscription_status='cancelled'`, `cancelled_at=now()` — **but keeps `pro_until` and `tier='pro'`** so user retains access until billing period ends
5. UI shows orange "Cancelled — Pro access until [date]" banner
6. PayFast stops sending recurring ITNs after this date

---

## Part 7 — Tier Logic (`src/utils/tier.js`)

### Single source of truth

Every component imports from `src/utils/tier.js`. No component does `profile?.tier === 'pro' || ...` inline.

```javascript
export function effectiveTier(profile) {
  if (!profile) return 'free';
  const now = new Date();

  if (profile.tier === 'pro') {
    if (!profile.pro_until) return 'pro';
    if (new Date(profile.pro_until) > now) return 'pro';
  }

  if (profile.tier === 'trial' && profile.trial_end_date) {
    if (new Date(profile.trial_end_date) > now) return 'trial';
  }

  return 'free';
}

export const isPro             = (p) => effectiveTier(p) === 'pro';
export const canStartTrial     = (p) => !p?.trial_started_at && !p?.cancelled_at && p?.tier !== 'pro';
export const trialDaysLeft     = (p) => /* calculates from trial_end_date */;
export const hasUsedTrial      = (p) => !!p?.trial_started_at;
export const hasActiveSubscription = (p) => p?.subscription_status === 'active';
export const isCancelledButActive  = (p) => p?.subscription_status === 'cancelled' && new Date(p?.pro_until) > new Date();
```

### State machine

```
              ┌────────────────────┐
              │      FREE          │  default for new users
              │  (limited access)  │
              └─────┬──────────────┘
                    │
       click "Start 30-day free trial"
       (calls /api/start-trial — server checks
        canStartTrial guard)
                    │
                    ▼
              ┌────────────────────┐
              │      TRIAL         │  30 days of all Pro features,
              │  (full access for  │  but AI advisor only first 7 days
              │   30 days)         │  with 5 questions/day cap
              └─────┬──────────────┘
                    │
                    │ trial_end_date passed
                    ▼
              ┌────────────────────┐
              │  FREE (used trial) │  no more "Start trial" button,
              │                    │  only "Upgrade to Pro" CTA
              └─────┬──────────────┘
                    │
       click "Upgrade to Pro" → PayFast → ITN
                    │
                    ▼
              ┌────────────────────┐
              │      PRO           │  unlimited access, recurring R79/mo
              │  (subscription_    │
              │   status=active)   │
              └─────┬──────────────┘
                    │
       click "Cancel subscription"
                    │
                    ▼
              ┌────────────────────┐
              │  PRO (cancelled)   │  retains access until pro_until,
              │  (subscription_    │  then drops to FREE
              │   status=cancelled,│
              │   cancelled_at set)│
              └─────┬──────────────┘
                    │
                    │ pro_until passed (no more ITNs from PayFast)
                    ▼
              ┌────────────────────┐
              │       FREE         │
              └────────────────────┘
```

### Server-side guards — never trust the client

`api/start-trial.js` enforces:

- User must be authenticated (Supabase JWT)
- `tier` must currently be `free`
- `trial_started_at` must be NULL (never trialled before)
- `subscription_status` must not be `cancelled` (already had Pro)

If any guard fails, return 403. **Never write `tier='trial'` from the client.**

---

## Part 8 — Auth & Sign-Out

### What was broken

`supabase.auth.signOut()` was sometimes hanging for 5+ seconds, then `navigate('/login')` would silently fail because the auth state was inconsistent. User stayed on the same page.

### Robust signOut (applied to both `Layout.jsx` AND `HamburgerMenu.jsx`)

```javascript
async function handleSignOut() {
  if (signingOut) return;
  setSigningOut(true);

  // 1. scope:'local' instead of default 'global' — much faster
  const localSignOut = supabase.auth.signOut({ scope: 'local' })
    .catch((e) => console.warn('signOut error (continuing):', e));

  // 2. Race against 1.5s timeout — never strand user
  await Promise.race([
    localSignOut,
    new Promise((r) => setTimeout(r, 1500)),
  ]);

  // 3. Aggressively purge all Supabase tokens
  for (const storage of [localStorage, sessionStorage]) {
    for (let i = storage.length - 1; i >= 0; i--) {
      const key = storage.key(i);
      if (key && (key.startsWith('sb-') || key.startsWith('supabase.'))) {
        storage.removeItem(key);
      }
    }
  }

  // 4. Hard navigation — forces full page reload, guarantees clean React state
  window.location.replace('/home');
}
```

### Why all four steps matter

- `scope:'local'` avoids slow global-server roundtrip
- 1.5s race prevents UI lockup if Supabase server is slow
- Manual storage purge defends against Supabase failing to clear tokens itself
- `window.location.replace` (NOT React Router `navigate`) does a hard reload which guarantees AuthContext re-initializes from a clean slate

---

## Part 9 — UI Banner Color Compliance

### Rule

All status banners use AprIQ brand palette at **30% opacity** (i.e. 70% transparent), border at 55% opacity, text always `#111111`.

| State | Color | Hex | rgba 30% |
|---|---|---|---|
| Active subscription | paleBlue | `#BFD1D6` | `rgba(191, 209, 214, 0.30)` |
| Cancelled / warning | orange | `#FF8210` | `rgba(255, 130, 16, 0.30)` |
| Trial active | petrol | `#0F4C5C` | `rgba(15, 76, 92, 0.30)` |
| Info | paleBlue | `#BFD1D6` | `rgba(191, 209, 214, 0.30)` |
| Error | orange | `#FF8210` | `rgba(255, 130, 16, 0.30)` |

**No red. No green. No yellow. Just the three brand colors with semantic meaning encoded by which is used where.**

---

## Part 10 — AI Advisor Sub-Cap

### Requirement

- Trial gives 30 days of Pro features
- BUT AI advisor specifically only available first 7 days
- During those 7 days, capped to 5 questions per day
- After 7 days, advisor locks; other Pro features remain for full 30 days

### Constants (mirrored client + server)

```javascript
const AI_TRIAL_DAYS      = 7;
const TRIAL_DAILY_LIMIT  = 5;
const PRO_DAILY_LIMIT    = 20;
```

### Logic (in both `api/ai-advisor.js` and `src/components/AprIQAdvisor.jsx`)

```javascript
const eff = effectiveTier(profile);

const trialStart = profile?.trial_started_at
  ? new Date(profile.trial_started_at)
  : (profile?.trial_end_date
      ? new Date(new Date(profile.trial_end_date).getTime() - 30 * 86400000)
      : null);

const daysSinceTrial = trialStart
  ? Math.floor((Date.now() - trialStart.getTime()) / 86400000)
  : 999;

const isLocked         = eff === 'free';
const isTrialAiExpired = eff === 'trial' && daysSinceTrial >= AI_TRIAL_DAYS;

const dailyLimit = eff === 'pro'   ? PRO_DAILY_LIMIT
                 : eff === 'trial' ? TRIAL_DAILY_LIMIT
                 : 0;
```

### Why mirrored?

**Never trust client-side gating.** The advisor backend re-runs all this logic and refuses requests if `isLocked || isTrialAiExpired || todayCount >= dailyLimit`. Client is purely UX.

---

## Part 11 — Database Architecture (`users` vs `profiles` resolution)

### The discovery

Found 2 rows in `public.users` and 4 rows in `public.profiles`. They didn't correspond.

### What was actually going on

Three tables existed with a "user identity" role:

| Table | Purpose | Status |
|---|---|---|
| `auth.users` | Supabase-managed identity | **Source of truth — never touch** |
| `public.profiles` | App-level user data (tier, name, etc.) | **Source of truth for app data** |
| `public.users` | Legacy table from early bootstrapping | **DEAD CODE — needed removal** |

`public.users` had been created early on, got 2 rows, then the codebase moved to `profiles` and stopped writing to it. New sign-ups got profile rows but no users row.

### The cleanup we executed

#### Step 1: Found 3 FKs pointing at `public.users`

```
estimates.user_id          → public.users.id
saved_estimates.user_id    → public.users.id
estimate_snapshots.user_id → public.users.id
```

#### Step 2: Pre-flight checks (all returned 0 = clean)

```sql
-- Every public.users.id exists in auth.users + profiles
SELECT u.id FROM public.users u
LEFT JOIN auth.users  au ON au.id = u.id
LEFT JOIN public.profiles p ON p.id = u.id
WHERE au.id IS NULL OR p.id IS NULL;

-- No estimates point at user_ids missing from auth.users
SELECT 'estimates' AS tbl, e.user_id FROM public.estimates e
LEFT JOIN auth.users au ON au.id = e.user_id
WHERE e.user_id IS NOT NULL AND au.id IS NULL
UNION ALL
SELECT 'saved_estimates', s.user_id FROM public.saved_estimates s
LEFT JOIN auth.users au ON au.id = s.user_id
WHERE s.user_id IS NOT NULL AND au.id IS NULL
UNION ALL
SELECT 'estimate_snapshots', n.user_id FROM public.estimate_snapshots n
LEFT JOIN auth.users au ON au.id = n.user_id
WHERE n.user_id IS NOT NULL AND au.id IS NULL;
```

#### Step 3: Backfilled missing profiles (defensive — was no-op)

```sql
INSERT INTO public.profiles (id, tier)
SELECT DISTINCT au.id, 'free'
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
  AND au.id IN (
    SELECT user_id FROM public.estimates          WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.saved_estimates    WHERE user_id IS NOT NULL
    UNION
    SELECT user_id FROM public.estimate_snapshots WHERE user_id IS NOT NULL
  );
```

#### Step 4: Rewired FKs to `auth.users(id) ON DELETE CASCADE`

```sql
BEGIN;
ALTER TABLE public.estimates
  DROP CONSTRAINT estimates_user_id_fkey,
  ADD  CONSTRAINT estimates_user_id_fkey
       FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.saved_estimates
  DROP CONSTRAINT saved_estimates_user_id_fkey,
  ADD  CONSTRAINT saved_estimates_user_id_fkey
       FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.estimate_snapshots
  DROP CONSTRAINT estimate_snapshots_user_id_fkey,
  ADD  CONSTRAINT estimate_snapshots_user_id_fkey
       FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
COMMIT;
```

#### Step 5: Verified nothing else references `public.users`

```sql
-- Should return 0 rows
SELECT tc.table_name, tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu USING (constraint_name)
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_schema = 'public'
  AND ccu.table_name   = 'users';

-- And no views/policies reference it
SELECT viewname FROM pg_views
WHERE schemaname = 'public' AND definition ILIKE '%public.users%';

SELECT tablename, policyname FROM pg_policies
WHERE qual::text ILIKE '%public.users%' OR with_check::text ILIKE '%public.users%';
```

#### Step 6: Dropped legacy table

```sql
DROP TABLE public.users;
```

### Important PostgreSQL gotcha discovered

`information_schema.key_column_usage.referenced_table_name` is a **MySQL-ism** — it doesn't exist in PostgreSQL. The correct join uses `information_schema.constraint_column_usage`:

```sql
-- WRONG (MySQL syntax)
JOIN information_schema.key_column_usage kcu USING (constraint_name)
WHERE kcu.referenced_table_name = 'users';  -- column doesn't exist in PG

-- RIGHT (PostgreSQL)
JOIN information_schema.constraint_column_usage ccu USING (constraint_name)
WHERE ccu.table_schema = 'public' AND ccu.table_name = 'users';
```

### Why FK at `auth.users(id)` not `profiles.id`?

Either works (profiles.id is itself a 1:1 FK to auth.users.id), but:
- `auth.users(id)` is the canonical identity table
- An estimate is *about a user*, not *about user metadata*
- Cascade-on-delete from auth.users → estimates is what Supabase docs recommend

### Final architecture

```
auth.users (Supabase managed)
   ↑ 1:1
   │
public.profiles  ← app reads/writes here for tier/trial/PayFast/etc.

public.estimates          ──┐
public.saved_estimates     ──┼─→ FK to auth.users(id) ON DELETE CASCADE
public.estimate_snapshots  ──┘
```

---

## Part 12 — Supabase Migration

```sql
-- supabase/migrations/20260506_subscription_columns.sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payfast_token              text,
  ADD COLUMN IF NOT EXISTS subscription_id            text,
  ADD COLUMN IF NOT EXISTS subscription_status        text,
  ADD COLUMN IF NOT EXISTS subscription_started_at    timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_renews_at     timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_updated_at    timestamptz,
  ADD COLUMN IF NOT EXISTS pro_until                  timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at               timestamptz,
  ADD COLUMN IF NOT EXISTS trial_started_at           timestamptz,
  ADD COLUMN IF NOT EXISTS grace_period_expires_at    timestamptz;

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles (subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_pro_until           ON public.profiles (pro_until);
```

---

## Part 13 — Code Inventory: What Was Added/Modified/Deleted

### Files deleted

- `api/payfast-sign.js` — superseded by `payfast-redirect.js`
- `api/ai-advisor.js.bak` — stale backup
- `src/pages/Billing.jsx` — replaced by `BillingPage.jsx`

### Files created

- `api/payfast-redirect.js` — PayFast Custom Integration, returns JSON `{url}`
- `api/payfast-itn.js` — ITN handler with raw body + multi-variant signing
- `api/payfast-cancel.js` — Subscription Management API client
- `api/start-trial.js` — server-side trial activation with guards
- `src/utils/tier.js` — single source of truth for tier logic
- `src/components/UpgradeModal.jsx` — modal with mode prop ('upgrade'|'replace_card'|'resubscribe')
- `src/pages/BillingPage.jsx` — full billing/plan management page
- `src/pages/PaymentSuccess.jsx` — polls profile for ITN confirmation
- `src/pages/PaymentCancel.jsx` — landing page when user cancels at PayFast
- `supabase/migrations/20260506_subscription_columns.sql` — schema migration

### Files modified

- `api/ai-advisor.js` — added trial sub-cap (7d × 5/day), tier helpers, dynamic dailyLimit
- `api/send-email.js` — `/billing` → `/plans` in failed-payment template
- `src/components/Layout.jsx` — `openUpgrade(mode)` accepts mode; robust signOut
- `src/components/HamburgerMenu.jsx` — robust signOut matching Layout
- `src/components/AprIQAdvisor.jsx` — uses `effectiveTier`, dynamic dailyLimit, AI trial sub-cap
- `src/pages/Calculator.jsx`, `Clients.jsx`, `Projects.jsx`, `UserProfile.jsx` — replaced inline tier checks with `isPro(profile)` helper
- `src/App.jsx` — `/billing` route now redirects to `/plans`
- `public/sw.js` — replaced with kill-switch service worker (self-unregisters on fetch)
- `vercel.json` — CSP allows new domains; switched from `routes` to `rewrites`

### Database changes

- `profiles` table: added 10 subscription columns + 2 indexes
- `public.users` table: dropped (after rewiring 3 FKs to `auth.users`)
- 3 FKs rewired: `estimates`, `saved_estimates`, `estimate_snapshots` → `auth.users(id) ON DELETE CASCADE`

---

## Part 14 — Going Live Checklist

### PayFast dashboard (live merchant account at https://my.payfast.com)

1. Settings → Integration → copy **Merchant ID** + **Merchant Key**
2. Settings → Integration → Security → set **Passphrase** (any strong string), copy verbatim
3. (Optional) Set ITN URL fallback to `https://www.apriq.co.za/api/payfast-itn` — code sends per-transaction so this is safety-net only

### Vercel environment variables (Production scope)

```
PAYFAST_SANDBOX=false
PAYFAST_MERCHANT_ID=<live id>
PAYFAST_MERCHANT_KEY=<live key>
PAYFAST_PASSPHRASE=<live passphrase>
APP_URL=https://www.apriq.co.za
```

Keep Preview/Development scope on sandbox values (`PAYFAST_SANDBOX=true`, sandbox credentials, passphrase `jt7NOE43FZPn`).

### Force redeploy

**MANDATORY.** Vercel does NOT pick up env-var changes on existing deployments.

> Vercel → Deployments → latest production → ⋯ → Redeploy → un-tick "Use existing build cache"

### Smoke test

1. Open `https://www.apriq.co.za/plans` in incognito with real account
2. Click Upgrade → real card → R79 charge
3. `/payment-success` should resolve to "✓ Welcome to AprIQ Pro" within ~10s
4. Supabase `profiles` row: `tier='pro'`, `pro_until` ≈ today+30d, `payfast_token` populated, `subscription_status='active'`
5. `/plans` shows paleBlue "Active — renews [date]" banner
6. Cancel → orange "Cancelled — Pro access until [date]" banner
7. Refund yourself in PayFast dashboard

---

## Part 15 — Error Catalog (What Each Error Means)

### `400 Bad Request: Generated signature does not match submitted signature`

In order of likelihood:

1. **Env vars not picked up after change** → redeploy with cache disabled
2. **Passphrase mismatch** (whitespace, missing chars) — must match dashboard exactly
3. **Wrong sort order** — Custom Integration uses insertion, API uses alphabetical
4. **Wrong URL encoding** — must be PHP `urlencode` (uppercase hex, `%20`→`+`), not `encodeURIComponent`
5. **`merchant_key` missing from signature** — must be included in signature string
6. **Sandbox passphrase missing** — sandbox merchant `10000100` requires `jt7NOE43FZPn`

### `419 CSRF token mismatch`

Hitting `sandbox.payfast.co.za` for an API call. Always use `api.payfast.co.za` for API.

### `Sandbox transaction successful but profile didn't upgrade`

ITN handler is broken. Check Vercel function logs for `[itn]` lines. Likely:
- Wrong table (`users.user_tier` not `profiles.tier`)
- Default body parser corrupting raw bytes (must set `bodyParser: false`)
- Signature variant not matching
- Supabase service role key missing/wrong

### `Profile shows pro_until in past, user appears free`

ITN set `pro_until` from PayFast's `billing_date` directly. Use clamping logic: `max(billing_date+1mo, now+1mo)`.

### `Spinner hangs on /payment-success`

ITN never arrived OR ITN updated different row OR client polling broke. Check Vercel logs for `[itn]` activity. PaymentSuccess polls every 2.5s for 60s before giving up.

### `Sign-out leaves user on same page`

Default `signOut()` is global scope, slow, sometimes hangs. Use `scope:'local'` + 1.5s race + manual storage purge + `window.location.replace`.

### `Cancel button missing`

BillingPage hides it for `cancelled_but_active` state. After resubscribe (which clears `cancelled_at`), it should reappear. If not, check `effectiveTier(profile)` returns `pro`.

### `Daily limit reached: 0 questions remaining`

AI advisor for free tier returns `dailyLimit: 0`. UI must check `eff === 'free'` and show "Upgrade to Pro" instead of "0 questions left".

### PostgreSQL: `column kcu.referenced_table_name does not exist`

That's MySQL syntax. PostgreSQL uses `information_schema.constraint_column_usage` for the referenced side, not `key_column_usage`.

---

## Part 16 — Vercel Log Filters to Bookmark

```
[itn]                       → ITN handler activity
payfast-redirect            → outbound payment URL generation
payfast-cancel              → subscription cancellation
ai-advisor                  → AI advisor requests
start-trial                 → trial activation attempts
"signature does not match"  → signature debugging
"PayFast API non-2xx"       → API call failures
"419"                       → CSRF errors (wrong host)
```

---

## Part 17 — Helper Code to Keep Verbatim

```javascript
// PHP-compatible urlencode (uppercase hex, spaces → '+')
function phpUrlencode(str) {
  return encodeURIComponent(String(str ?? ''))
    .replace(/%20/g, '+')
    .replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

// Custom Integration field order — DO NOT REORDER
const CUSTOM_INTEGRATION_ORDER = [
  'merchant_id', 'merchant_key', 'return_url', 'cancel_url', 'notify_url',
  'name_first', 'name_last', 'email_address', 'm_payment_id', 'amount',
  'item_name', 'item_description', 'custom_str1', 'subscription_type',
  'billing_date', 'recurring_amount', 'frequency', 'cycles',
];

// PayFast hosts (memorize these)
const HOSTS = {
  PAYMENT_LIVE:    'https://www.payfast.co.za/eng/process',
  PAYMENT_SANDBOX: 'https://sandbox.payfast.co.za/eng/process',
  API:             'https://api.payfast.co.za',  // both live and sandbox
};

// Sandbox merchant 10000100 requires this passphrase
const SANDBOX_PASSPHRASE = 'jt7NOE43FZPn';

// Safe default rule (used in all 3 handlers)
const isSandbox = process.env.PAYFAST_SANDBOX !== 'false';

// pro_until clamp (always ≥ now + 1 month)
const proUntil = new Date(Math.max(
  Date.now() + 30 * 86400000,
  new Date(billingDate).getTime() + 30 * 86400000
)).toISOString();

// Robust signOut (Layout.jsx + HamburgerMenu.jsx)
async function handleSignOut() {
  const localSignOut = supabase.auth.signOut({ scope: 'local' }).catch(() => {});
  await Promise.race([localSignOut, new Promise((r) => setTimeout(r, 1500))]);
  for (const storage of [localStorage, sessionStorage]) {
    for (let i = storage.length - 1; i >= 0; i--) {
      const key = storage.key(i);
      if (key && (key.startsWith('sb-') || key.startsWith('supabase.'))) {
        storage.removeItem(key);
      }
    }
  }
  window.location.replace('/home');
}
```

---

## Part 18 — Skill Generation Instructions for Claude

When generating a Cursor Skill from this document, the skill should trigger on any of these contexts:

**Triggers:**
- User mentions "PayFast", "subscription", "ITN", "signature mismatch", "merchant_key", "billing", "Pro tier", "trial", "cancel subscription"
- User reports HTTP 400 / 419 / signature errors from a payment gateway
- User asks about Supabase `profiles` vs `users` table confusion
- User asks how to integrate a recurring subscription with React + Vercel + Supabase
- User asks how to flip from sandbox to live in any payment gateway

**The skill should enforce these principles:**

1. **Always identify which PayFast integration type** before signing (Custom = insertion order, API = alphabetical)
2. **Always use `phpUrlencode`** — never `encodeURIComponent` directly
3. **Always trim values, drop empty values** from BOTH form AND signature
4. **Always include `merchant_key`** in Custom Integration signature
5. **Always hit `api.payfast.co.za`** (not `sandbox.*`) for API calls; append `?testing=true` for sandbox
6. **Always set `bodyParser: false`** for webhook handlers verifying signatures
7. **Always return 200 from webhooks** even on verification failure (prevent retries)
8. **Always log webhook activity with a prefix** (`[itn]`, `[cancel]`)
9. **Always use `window.location.assign(url)`** for cross-origin payment redirects (never `<form>` submit, never `fetch+navigate` after await)
10. **Always use `window.location.replace('/home')`** for hard sign-out (never React Router `navigate`)
11. **Always normalize `isSandbox`** rule to `process.env.X !== 'false'` (default to sandbox = safer)
12. **Always clamp `pro_until`** to `≥ now + 1 month` (never trust gateway's `billing_date`)
13. **Always have ONE source of truth for tier logic** (`src/utils/tier.js`-style helper)
14. **Always mirror tier logic between client and server** (client = UX, server = security)
15. **Always run server-side guards** before any state change (start trial, cancel, etc.)
16. **Always remind user to redeploy with cache disabled** after any Vercel env-var change
17. **Always FK app tables to `auth.users(id) ON DELETE CASCADE`** — never to a parallel `public.users`
18. **Always use `information_schema.constraint_column_usage`** for PostgreSQL FK introspection (not `key_column_usage.referenced_table_name`)
19. **Banner colors must use brand palette only** at 30% opacity with `#111111` text
20. **Capture subscription token from first ITN** for later cancellation

**The skill should provide ready-to-use snippets for:**
- `phpUrlencode` helper
- Custom Integration param order constant
- ITN raw-body reader
- Multi-variant signature verification loop
- Robust signOut function
- `effectiveTier(profile)` helper
- `pro_until` clamping function
- PostgreSQL FK introspection query

**The skill should provide a checklist for:**
- Going live (env vars + dashboard + redeploy + smoke test)
- Debugging signature mismatch (in priority order)
- Migrating from a legacy `public.users` to `auth.users` + `profiles`

---

## Final State Verification

| Component | Status |
|---|---|
| PayFast Custom Integration (subscribe) | ✅ Live-ready, signature correct |
| PayFast Subscription API (cancel) | ✅ Live-ready, hits `api.payfast.co.za` |
| ITN handler | ✅ Raw body, multi-variant signing, 200 always |
| Tier state machine (free/trial/pro) | ✅ Single source via `tier.js` |
| Trial guards | ✅ Server-enforced, can-only-trial-once |
| AI advisor sub-cap | ✅ 7 days × 5 q/day during trial |
| Sign-out | ✅ Robust, hard reload to `/home` |
| Banner colors | ✅ AprIQ palette only |
| `users` legacy table | ✅ Dropped, FKs rewired |
| Sandbox/live env switching | ✅ Consistent default across handlers |
| Dead code | ✅ Removed |

---

**End of document. Hand this entire file to Claude with: "Create a Cursor Skill from this document so I never have to troubleshoot these issues again."**
