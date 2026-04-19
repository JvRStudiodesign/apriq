# AprIQ — Full-Stack Handover Document
**Generated: April 2026 | For: Cursor / New Agent**
> This document replaces all prior onboarding. Do not ask Ruan to re-explain anything covered here.

---

## 1. Project Identity

**Name:** AprIQ (Approximate + IQ)
**Purpose:** Construction Cost Intelligence SaaS for the South African market. Generates early-stage ROM (Rough Order of Magnitude) cost estimates for buildings, including land procurement, professional fees, VAT, and PDF export. Primary users are architects and quantity surveyors.

**Trading entity:** JvRStudio Pty Ltd (Ruan Jansen van Rensburg, founder and sole builder)
**Business email:** apriq@apriq.co.za (Zoho)

**Repo layout:**
```
~/Desktop/Projects/apriq/       ← local working directory
├── api/                        ← Vercel serverless functions (max 12 on Hobby)
│   ├── _rate-limit.js          ← shared in-memory rate limiter helper
│   ├── admin-stats.js          ← founder analytics dashboard
│   ├── get-estimate.js         ← rate-limited shared estimate fetch
│   ├── payfast-itn.js          ← payment webhook (ITN)
│   ├── save-estimate.js        ← server-side authenticated estimate save
│   └── send-email.js           ← ALL email types (consolidated)
├── src/
│   ├── components/             ← Layout, EstimatePDF, HamburgerMenu, etc.
│   ├── context/AuthContext.jsx ← session, profile, tier, trial logic
│   ├── hooks/useAuth.js        ← thin wrapper around useAuthContext
│   ├── lib/supabase.js         ← Supabase client init
│   ├── pages/                  ← 18 pages
│   └── styles/globals.css
├── public/
│   ├── sw.js                   ← Service worker, cache name: apriq-v1
│   ├── logo-transparent.png
│   ├── icon-192.png
│   └── icon-512.png
├── vercel.json                 ← security headers + routing
└── vite.config.js
```

**Product runs at:** `www.apriq.co.za` (production) | `apriq.vercel.app` (legacy, still works)

---

## 2. Tech Stack

| Layer | Technology | Version/Notes |
|-------|-----------|---------------|
| Frontend | React + Vite | Vite 5.x |
| PDF generation | @react-pdf/renderer | Uses WebAssembly — requires `wasm-unsafe-eval` in CSP |
| Auth + DB | Supabase | Project: `cocugdgelatgjzgkyhpz`, region: AWS eu-west-1 |
| Hosting | Vercel Hobby | 12 serverless function limit — currently using 6 |
| Payments | PayFast | Sandbox active — awaiting FICA for live mode |
| Email | Resend | All emails via single `/api/send-email` endpoint |
| Analytics | PostHog | EU cloud |
| Domain | apriq.co.za | Registered at Afrihost, DNS pointing to Vercel |
| Business email | Zoho | apriq@apriq.co.za |
| Languages | JavaScript (ES modules) | No TypeScript |
| Bundler | Vite | |
| Linter | ESLint | |
| Tests | None | Deferred to Phase 2 |

---

## 3. How to Run Locally

**Prerequisites:** Node.js 18+, npm, git

```bash
# Install
cd ~/Desktop/Projects/apriq
npm install

# Dev server
npm run dev
# → http://localhost:5173

# Build
npm run build

# Deploy (auto-deploys to Vercel via GitHub push)
git add . && git commit -m "your message" && git push
```

**Env file location:** `~/Desktop/Projects/apriq/.env.local`

**Common first-run failures:**
- **Blank screen / SignupConfirm is not defined** → Check App.jsx for orphaned route references. The SignupConfirm page was removed — ensure no import or Route references it.
- **PDF not generating** → CSP must include `worker-src blob: 'self'` and `child-src blob: 'self'` and `'wasm-unsafe-eval'` in script-src. See `vercel.json`.
- **WebAssembly error in console** → Missing `'wasm-unsafe-eval'` in CSP `script-src`.
- **Vercel build fails with "12 function limit"** → Count files in `api/`. Must be ≤ 12. Currently 6.

---

## 4. Environments & Configuration

### Vercel Environment Variables (all set in Vercel dashboard)

| Variable | Purpose | Required | Example |
|----------|---------|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes | `https://cocugdgelatgjzgkyhpz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | Yes | `eyJ...` (REDACTED) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin DB access | Yes | `eyJ...` (REDACTED) |
| `VITE_PAYFAST_MERCHANT_ID` | PayFast merchant ID | Yes | `REDACTED` |
| `VITE_PAYFAST_MERCHANT_KEY` | PayFast merchant key | Yes | `REDACTED` |
| `VITE_PAYFAST_SANDBOX` | Sandbox mode flag | Yes | `true` (flip to `false` when PayFast approves) |
| `PAYFAST_PASSPHRASE` | PayFast ITN signature passphrase | Yes | `REDACTED` |
| `INTERNAL_API_SECRET` | Shared secret for internal API calls | Yes | `REDACTED` |
| `ADMIN_PASSWORD` | Founder admin dashboard password | Yes | `REDACTED` |
| `RESEND_API_KEY` | Resend email API key | Yes | `re_...` (REDACTED) |

**Local `.env.local`** — must mirror all `VITE_` prefixed vars for local dev. Non-VITE vars are server-only and only needed on Vercel.

**Feature flags:**
- `VITE_PAYFAST_SANDBOX=true` → PayFast sandbox mode. Flip to `false` after FICA approval.
- Email confirmation in Supabase: **DISABLED** (users sign in immediately after signup).

---

## 5. Security Posture

### AuthN/AuthZ Model
- **Auth provider:** Supabase Auth (email/password + Google OAuth)
- **Sessions:** Supabase JWT tokens stored in browser localStorage (Supabase default)
- **Tier system:** `free` / `trial` / `pro` stored in `profiles.tier` in Supabase — never trusted from client
- **Trial:** 30-day trial, `trial_end_date` stored in `profiles`

### Route Access Matrix
| Route | Public | Auth Required | Admin Only |
|-------|--------|--------------|------------|
| `/home`, `/about`, `/features`, `/how-it-works` | ✅ | No | No |
| `/signup`, `/login`, `/legal`, `/plans` | ✅ | No | No |
| `/estimate/:token` | ✅ (read-only) | No | No |
| `/` (Calculator) | No | ✅ | No |
| `/profile`, `/projects`, `/clients`, `/billing` | No | ✅ | No |
| `/upgrade` | No | ✅ | No |
| `/admin` | No | No | ✅ Password via `ADMIN_PASSWORD` env var |

### API Security Matrix
| Endpoint | Auth | Rate Limit | Notes |
|----------|------|-----------|-------|
| `POST /api/save-estimate` | ✅ Bearer JWT | 10/min per IP | Ownership verified server-side |
| `GET /api/get-estimate` | None (token-based) | 30/min per IP | Share token validated |
| `POST /api/send-email` | Internal secret (system types) | 20/min per IP; 5/hr notifications | Notification types rate-limited |
| `POST /api/payfast-itn` | PayFast MD5 signature | 20/min per IP | Signature + amount + user verified |
| `GET /api/admin-stats` | `ADMIN_PASSWORD` header | 30/min per IP | Server-side password check only |

### What Must Never Be Committed
- Any `.env` or `.env.local` file with real values
- `SUPABASE_SERVICE_ROLE_KEY` — full DB access, server-only
- `INTERNAL_API_SECRET` — gates all internal API calls
- `ADMIN_PASSWORD`
- `PAYFAST_PASSPHRASE`
- `RESEND_API_KEY`

### Known Security Decisions
- **PayFast merchant key in frontend bundle** (`VITE_PAYFAST_MERCHANT_KEY`) — PayFast's direct-post model requires client-side merchant ID. ITN signature is the real payment protection. Phase 2: move form generation to backend.
- **Rate limiter is in-memory** — resets on Vercel cold starts. Phase 2: Upstash Redis for persistence.
- **Admin is password-only** — no 2FA or IP allowlist. Rate limited to 30/min. Phase 2: IP allowlist.
- **No unit or integration tests** — deferred to Phase 2.
- **CSP includes `'unsafe-inline'`** — required for Vite-bundled styles. Acceptable trade-off.

### Threats Mitigated
- IDOR: Supabase RLS policies enforce ownership on all tables. `save-estimate` API verifies project ownership server-side.
- Rate abuse: All API endpoints rate-limited.
- Payment spoofing: PayFast ITN verifies MD5 signature before any tier update.
- Data deletion: RLS `FOR DELETE USING (false)` on all key tables — data is never destroyed, only soft-flagged.
- XSS: React's JSX escaping + CSP.
- Email spam: Notification email types capped at 5/hour per IP.

---

## 6. Backend

### API Endpoints — Full Contract

**`POST /api/save-estimate`**
- Auth: Supabase Bearer token in `Authorization` header
- Validates: inputs schema, project ownership, user tier
- Writes to: `estimates` table + `project_estimates` table
- Returns: `{ ok: true }` or `{ error: string }`

**`GET /api/get-estimate?token=<share_token>`**
- Auth: None (public, token-based)
- Rate limit: 30/min per IP
- Returns: `{ snapshot_data: {...} }` or 404/410

**`POST /api/send-email`**
- Body: `{ type, to, name, ...templateData }`
- Types (user-facing): `welcome`, `trial_warning`, `trial_expired`, `payment_confirmed`, `payment_failed`, `cancelled`, `waitlist_confirm`, `feedback_confirm`, `contact_confirm`
- Types (founder notifications): `contact`, `feedback`, `new_user`, `new_client`, `new_waitlist`
- System types require `x-internal-secret` header
- Notification types rate-limited at 5/hr per IP

**`POST /api/payfast-itn`**
- Called by PayFast server after payment
- Verifies MD5 signature with `PAYFAST_PASSPHRASE`
- Updates `profiles.tier` to `pro` on COMPLETE, `free` on CANCELLED/FAILED
- Rate limit: 20/min

**`GET /api/admin-stats`**
- Header: `x-admin-password: <ADMIN_PASSWORD>`
- Returns: users, trials, pro count, estimates, MRR, ARR, top building types, referrals

### Database Schema (Supabase — key tables)

| Table | Purpose | Delete Policy |
|-------|---------|--------------|
| `auth.users` | Supabase managed auth | Supabase managed |
| `profiles` | Tier, trial dates, last_active_at, logo URL | RLS blocks delete |
| `users` | Signup data: name, company, profession, referral | No delete policy |
| `clients` | User's clients — soft delete via `deleted_by_user` flag | RLS blocks delete |
| `projects` | User's projects — soft delete via `deleted_by_user` flag | RLS blocks delete |
| `estimates` | Full estimate history — `pdf_generated`, `shared`, `deleted_by_user` flags | RLS blocks delete |
| `project_estimates` | Latest estimate per project | RLS blocks delete |
| `estimate_snapshots` | Shared estimate snapshots with `share_token` + `expires_at` | RLS blocks delete |
| `saved_estimates` | Additional saved estimates store | RLS blocks delete |
| `pdf_exports` | Every PDF download tracked | RLS blocks delete |
| `feedback` | User feedback submissions | No delete |
| `contact_submissions` | Contact form submissions | No delete |
| `waitlist` | Email waitlist (name, email, profession) | No delete |

**RLS pattern used on protected tables:**
```sql
CREATE POLICY "users_select_own" ON table_name
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "block_delete" ON table_name
  FOR DELETE USING (false);
```

### Email Flow (all via `send-email.js`)
- **On signup:** `new_user` (to founder) + `welcome` (to user)
- **On login with trial ≤ 2 days:** `trial_warning` (to user)
- **On login with trial expired:** `trial_expired` (to user)
- **PayFast ITN COMPLETE:** `payment_confirmed` (to user)
- **PayFast ITN FAILED:** `payment_failed` (to user)
- **PayFast ITN CANCELLED:** `cancelled` (to user)
- **Waitlist join:** `new_waitlist` (to founder) + `waitlist_confirm` (to user)
- **Contact form:** `contact` (to founder, reply-to set to sender) + `contact_confirm` (to user)
- **Feedback:** `feedback` (to founder) + `feedback_confirm` (to user)
- **New client added:** `new_client` (to founder)

---

## 7. Frontend

### Routing (src/App.jsx)
```
/home             → LandingPage (public)
/about            → AboutPage (public)
/features         → FeaturesPage (public)
/how-it-works     → HowItWorksPage (public)
/plans            → BillingPage (public — pricing page)
/legal            → LegalPage (public — POPIA compliant)
/signup           → Signup (public)
/login            → Login (public)
/estimate/:token  → SharedEstimate (public — read-only)
/                 → Calculator (protected) or /home redirect
/profile          → UserProfile (protected)
/projects         → Projects (protected)
/clients          → Clients (protected)
/upgrade          → Upgrade (protected)
/billing          → Billing (protected — account billing)
/admin            → Admin (password protected)
```

### Key Components
- `src/components/Layout.jsx` — main nav, contact modal, waitlist modal, feedback trigger (326 lines)
- `src/pages/Calculator.jsx` — main product, 950 lines (split into subcomponents in Phase 2)
- `src/components/EstimatePDF.jsx` — react-pdf template
- `src/context/AuthContext.jsx` — session management, profile fetch, trial email triggers

### State Management
- No Redux/Zustand — React useState/useContext only
- Auth state in `AuthContext` (user, profile, loading)
- Calculator state fully local (inputs, result, saved flags)

### Design System
- No component library — all custom inline styles
- Brand palette: `#0F4C5C` (teal), `#111111` (near-black), `#F9FAFA` (off-white), `#E4E5E5` (border), `#979899` (muted), `#FF8210` (orange accent), `#BFD1D6` (light teal)
- Typography: Aptos (headings), Roboto (body) via Google Fonts
- No true black (#000) or white (#fff) — always use brand equivalents

### Known Issues
- `HamburgerMenu` imported in `Upgrade.jsx` and `Billing.jsx` creates a duplicate header element alongside Layout — cosmetic, Phase 2 cleanup
- `Calculator.jsx` at 950 lines — split into subcomponents in Phase 2
- `useAuth.js` is a 2-line passthrough — could be inlined

### PWA
- Service worker at `public/sw.js`, cache name: `apriq-v1`
- Caches app shell only (index.html, icons, logo) — no API responses or user data
- **Important:** Increment cache name to `apriq-v2` before next breaking deploy

---

## 8. Data & Integrations

### Supabase
- **Project ID:** `cocugdgelatgjzgkyhpz`
- **Region:** AWS eu-west-1 (Ireland)
- **Auth:** Email/password + Google OAuth
- **Email confirmation:** DISABLED — users sign in immediately
- **Google OAuth redirect URI:** `https://www.apriq.co.za`
- **Site URL:** `https://www.apriq.co.za`
- **Allowed redirect URLs:** `https://www.apriq.co.za/**`, `https://apriq.vercel.app/**`, `http://localhost:5173/**`

### PayFast
- **Mode:** Sandbox (`VITE_PAYFAST_SANDBOX=true`)
- **Pricing:** R79/month Pro (locked)
- **ITN URL:** Must be set to `https://www.apriq.co.za/api/payfast-itn` in PayFast dashboard
- **Pending:** FICA documents not yet submitted. Flip `VITE_PAYFAST_SANDBOX` to `false` after approval and redeploy.
- **Security:** MD5 signature verification in `api/payfast-itn.js`

### Resend
- **From address:** `apriq@apriq.co.za`
- **Domain:** `apriq.co.za` must be verified in Resend dashboard
- **All emails** go through single endpoint `/api/send-email` with `type` field

### PostHog
- **Region:** EU cloud
- **Integration:** In frontend bundle

### Google OAuth
- **Client ID + Secret:** Set in Supabase Auth → Sign In / Providers → Google
- **Redirect URI configured in Google Console:** `https://cocugdgelatgjzgkyhpz.supabase.co/auth/v1/callback`

---

## 9. CI/CD & Release

```bash
# Deploy
cd ~/Desktop/Projects/apriq
git add . && git commit -m "descriptive message" && git push
# Vercel auto-deploys from main branch in ~15-30 seconds
```

- **Branch:** `main` only — no staging branch
- **Vercel project:** `jvrstudio/apriq`
- **Hobby plan limits:** 12 serverless functions (currently 6), 100GB bandwidth
- **No migration runner** — all schema changes done manually via Supabase SQL Editor
- **No CI pipeline** — push to main → Vercel builds → deploys

---

## 10. Troubleshooting Playbook

### Blank screen on load
**Symptom:** White screen, no content
**Cause:** JavaScript runtime error — usually a missing component import in App.jsx
**Check:** Browser console → look for `ReferenceError: X is not defined`
**Fix:** Find the orphaned Route/import in `src/App.jsx` and remove it
**Verify:** Refresh `www.apriq.co.za`, no console errors

### PDF not generating
**Symptom:** Download PDF button does nothing or throws error
**Cause 1:** CSP blocking WebAssembly — `react-pdf` uses WASM internally
**Error:** `WebAssembly.instantiate(): Compiling... violates Content Security Policy`
**Fix:** Add to `vercel.json` script-src: `'wasm-unsafe-eval'` and to headers: `worker-src blob: 'self'`, `child-src blob: 'self'`
**Cause 2:** Service worker serving stale build without CSP fix
**Fix:** Increment `CACHE_NAME` in `public/sw.js` from `apriq-v1` to `apriq-v2`

### Sign in not working (email/password)
**Symptom:** "Saving..." spinner, never signs in
**Cause:** Email confirmation enabled in Supabase, user not confirmed
**Fix:** Supabase → Authentication → Sign In / Providers → Confirm email → OFF → Save changes
**Note:** Email confirmation is currently DISABLED — this should not recur

### Auth redirect goes to apriq.vercel.app instead of www.apriq.co.za
**Symptom:** After Google OAuth or password reset, user lands on old domain
**Cause:** Hardcoded old URL in `redirectTo` options
**Fix:** Search codebase for `apriq.vercel.app` and replace with `https://www.apriq.co.za`
**Files:** `src/pages/Login.jsx`, `src/pages/Signup.jsx`

### Vercel deployment fails with function limit error
**Symptom:** `No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan`
**Cause:** More than 12 files in `/api/` directory
**Fix:** Consolidate endpoints. Email endpoints must remain in single `send-email.js` with `type` routing
**Check:** `ls api/ | wc -l` — must be ≤ 12

### Email not sending
**Symptom:** No email received, no visible error
**Cause 1:** Missing `type` field in fetch body — `send-email.js` returns 400
**Cause 2:** Resend domain not verified
**Cause 3:** Rate limit hit (5/hr for notification types)
**Fix:** Check `type` field in all `fetch('/api/send-email', ...)` calls; check Resend dashboard for domain status

### Supabase insert silently failing
**Symptom:** Data not appearing in table, no error shown
**Cause:** RLS policy missing for the operation, or table missing a column the code tries to insert
**Fix:** Check Supabase → Table Editor → RLS policies. Use destructured `{ error }` not `.catch(() => {})` in frontend calls
**Known fix applied:** `feedback` table needed `email` column added; `waitlist` needed `name` and `profession` columns

### Admin dashboard 500 error
**Symptom:** `/admin` returns 500 after entering password
**Cause:** `SUPABASE_SERVICE_ROLE_KEY` missing from Vercel env vars, or table queried doesn't exist
**Fix:** Check Vercel → Settings → Environment Variables → confirm `SUPABASE_SERVICE_ROLE_KEY` is set
**Password:** Stored in `ADMIN_PASSWORD` Vercel env var (ask Ruan)

---

## 11. Open Issues & Risks

1. **PayFast live mode not active** — FICA documents not submitted. SEVERITY: Blocks paid subscriptions. ACTION: Submit FICA to PayFast → flip `VITE_PAYFAST_SANDBOX` to `false` → redeploy.

2. **Rate limiter is in-memory** — Resets on Vercel cold starts. SEVERITY: Low at current scale, medium at growth. ACTION: Phase 2 — integrate Upstash Redis.

3. **PayFast merchant key in frontend bundle** — Semi-public. SEVERITY: Low (PayFast design decision). ACTION: Phase 2 — move form generation to backend endpoint.

4. **Admin has no 2FA or IP allowlist** — Password-only. SEVERITY: Low (rate limited). ACTION: Phase 2.

5. **No automated tests** — Zero coverage. SEVERITY: Medium (regressions possible). ACTION: Phase 2 — unit tests for calculator engine, integration tests for API endpoints.

6. **Calculator.jsx is 950 lines** — Maintainability concern. SEVERITY: Low. ACTION: Phase 2 — split into subcomponents.

7. **Service worker cache name is `apriq-v1`** — Must be incremented to `apriq-v2` before next breaking deploy to force cache invalidation.

8. **HamburgerMenu in Upgrade.jsx and Billing.jsx** — Creates duplicate header. SEVERITY: Cosmetic. ACTION: Phase 2 cleanup.

9. **Trial email sends on every login** — `AuthContext` checks trial status on every profile fetch. Could send duplicate warning emails if user logs in multiple times on day 28. SEVERITY: Low UX issue. ACTION: Track `trial_warning_sent` flag in profiles table.

**Tech debt accepted on purpose:**
- No TypeScript — speed of development prioritised
- No staging environment — single main branch, deploy directly to production
- Inline styles throughout — no CSS modules or Tailwind (consistency trade-off accepted)

---

## 12. Recent Work Log

- **Auth redirect fix** — Updated all `redirectTo: 'https://apriq.vercel.app'` to `https://www.apriq.co.za` in Login.jsx and Signup.jsx. Files: `src/pages/Login.jsx`, `src/pages/Signup.jsx`
- **Signup flow fix** — Fixed missing `type` field on `welcome` and `new_user` email sends. Disabled email confirmation in Supabase. Files: `src/pages/Signup.jsx`
- **CSP fix for PDF** — Added `'wasm-unsafe-eval'` to script-src, `worker-src blob: 'self'`, `child-src blob: 'self'` to vercel.json. File: `vercel.json`
- **Email consolidation** — 11 separate email API files consolidated into single `send-email.js` with `type` routing. Fixes Vercel Hobby 12-function limit. Files: `api/send-email.js` (created), all individual `send-*.js` deleted
- **Launch security fixes** — Rate limiting added to `save-estimate`, shared estimate moved to `api/get-estimate.js` (rate limited), notification emails rate-limited at 5/hr. Files: `api/save-estimate.js`, `api/get-estimate.js`, `api/send-email.js`
- **Database audit** — All tables confirmed with correct columns. Delete blocked via RLS on all key tables. `waitlist` got `name` + `profession` columns. `feedback` got `email` column. `estimates` got `pdf_generated`, `shared`, `deleted_by_user` flags. `profiles` got `last_active_at`. Files: SQL Editor in Supabase
- **Email notifications** — Added founder email notifications for new_user, new_client, new_waitlist, contact, feedback. Added user confirmation emails for waitlist, contact, feedback. Files: `api/send-email.js`, `src/pages/Signup.jsx`, `src/pages/Clients.jsx`, `src/components/Layout.jsx`, `src/pages/Calculator.jsx`
- **Database cleanup** — Removed all test data for jvrstudiodesign@gmail.com and ruanjvr01@gmail.com from all tables. Waitlist untouched.
- **Domain live** — www.apriq.co.za pointing to Vercel. DNS: A record `@` → `76.76.21.21`, A record `www` → `76.76.21.21` at Afrihost. Supabase Site URL + redirect URLs updated.
- **Trial email fix** — AuthContext was sending trial warning/expired emails without `type` field. Fixed. File: `src/context/AuthContext.jsx`

---

## 13. Decisions Log

- **Single email endpoint** → rejected individual files → 11 files exceeded Vercel Hobby 12-function limit → April 2026
- **Email confirmation OFF** → rejected requiring confirmation → better UX for SaaS tool, welcome email serves as confirmation → April 2026
- **Pricing R79/month** → rejected R149/month → locked from brand guide → April 2026
- **30-day trial** → rejected 7-day → more time for architects to evaluate → April 2026
- **RLS delete blocks** → rejected soft-delete only → data must never be destroyed for analytics → April 2026
- **Vercel Hobby** → rejected Pro → cost minimisation, upgrade at launch if needed → March 2026
- **No TypeScript** → rejected TypeScript → speed of development for solo founder → March 2026
- **Phase 2 for unit tests** → rejected testing in Phase 1 → speed to launch prioritised → March 2026
- **PayFast direct-post** → rejected Stripe → South African payment method requirement → March 2026
- **Resend for email** → rejected SendGrid → simpler API, better DX → April 2026
- **PostHog EU cloud** → rejected Plausible → GDPR/POPIA compliance, EU data residency → April 2026
- **Never reference AECOM** → all rates attributed solely to AprIQ → brand protection → April 2026

---

## 14. Next Steps (Prioritised)

1. **Submit PayFast FICA documents** — Unblocks live payments. When approved: set `VITE_PAYFAST_SANDBOX=false` in Vercel → redeploy. No code changes needed.

2. **Fix founder account** — Delete `apriq@apriq.co.za` from Supabase Auth (stuck in unconfirmed state), sign up fresh at `www.apriq.co.za/signup`, then in Supabase SQL Editor: `UPDATE profiles SET tier = 'pro' WHERE id = '<your-user-id>';`

3. **Test full signup → login → estimate → PDF → share flow** — First full end-to-end test on production domain with real account.

4. **Section 12 — Quality Assurance** — Test all user flows desktop + mobile (iOS + Android). Test free tier gating. Test trial expiry. Test PayFast sandbox payment flow end-to-end. Spell-check all copy.

5. **Section 13 — GTM Preparation** — Build landing page waitlist capture, write 5 LinkedIn posts, identify 50 target architects, join SA construction WhatsApp groups, write first SEO blog post.

6. **Phase 2 items (post-launch):**
   - Add Upstash Redis for persistent rate limiting
   - Move PayFast form generation to backend
   - Add `trial_warning_sent` flag to profiles to prevent duplicate emails
   - Split Calculator.jsx into subcomponents
   - Add unit tests for calculation engine
   - Add IP allowlist or 2FA for admin
   - Increment service worker cache to `apriq-v2`

---

## 15. Reference Index

### URLs
| Resource | URL |
|----------|-----|
| Live site | https://www.apriq.co.za |
| Admin dashboard | https://www.apriq.co.za/admin |
| GitHub repo | https://github.com/JvRStudiodesign/apriq |
| Vercel dashboard | https://vercel.com/jvrstudio/apriq |
| Supabase dashboard | https://supabase.com/dashboard/project/cocugdgelatgjzgkyhpz |
| Supabase SQL Editor | https://supabase.com/dashboard/project/cocugdgelatgjzgkyhpz/sql/new |
| Supabase Auth settings | https://supabase.com/dashboard/project/cocugdgelatgjzgkyhpz/auth/providers |
| Resend dashboard | https://resend.com |
| PostHog dashboard | https://eu.posthog.com |

### Key File Paths
```
src/App.jsx                          ← routing
src/context/AuthContext.jsx          ← auth, profile, tier
src/pages/Calculator.jsx             ← main product (950 lines)
src/pages/Signup.jsx                 ← signup flow
src/pages/Login.jsx                  ← login + Google OAuth + password reset
src/components/Layout.jsx            ← nav, modals, waitlist, contact
src/components/EstimatePDF.jsx       ← PDF template
api/send-email.js                    ← ALL email templates + routing
api/save-estimate.js                 ← authenticated estimate save
api/payfast-itn.js                   ← payment webhook
api/admin-stats.js                   ← founder analytics
api/get-estimate.js                  ← shared estimate fetch
api/_rate-limit.js                   ← rate limiter helper
public/sw.js                         ← service worker (cache: apriq-v1)
vercel.json                          ← headers + CSP + routing
```

### Supabase Tables Quick Reference
```
auth.users          ← managed by Supabase
profiles            ← tier, trial_end_date, logo_url, last_active_at
users               ← name, email, company, profession, referral_source
clients             ← company_name, contact_name, email, phone, deleted_by_user
projects            ← project_name, reference_number, address, client_id, deleted_by_user
estimates           ← full estimate + pdf_generated, shared, deleted_by_user flags
project_estimates   ← latest estimate per project
estimate_snapshots  ← share_token, snapshot_data, expires_at
saved_estimates     ← additional saved estimates
pdf_exports         ← every PDF download tracked
feedback            ← user_id, topic, message, email
contact_submissions ← name, surname, email, message
waitlist            ← email, name, profession
```

### Security Checklist (run after any major change)
```bash
# Check function count (must be ≤ 12)
ls api/ | wc -l

# Check for any hardcoded secrets
grep -rn "REDACTED\|sk_live\|re_\|eyJ" src/ api/ --include="*.js" --include="*.jsx"

# Check for any apriq.vercel.app references (should use www.apriq.co.za)
grep -rn "apriq.vercel.app" src/ --include="*.jsx" --include="*.js"
```
