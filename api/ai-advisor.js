import { createClient } from '@supabase/supabase-js';
import { buildAdvisorSignals } from '../src/utils/advisorSignals.js';
import {
  normalizeAdvisorUserMessage,
  sanitizeEstimateLocationInState,
} from '../src/utils/advisorLocation.js';

export const config = { runtime: 'nodejs' };

/**
 * Matches api/admin-stats.js, api/save-estimate.js & PayFast handlers: server routes must
 * resolve the project URL reliably. Prefer SUPABASE_URL (Vercel/Supabase integration);
 * fall back to VITE_SUPABASE_URL (single-env setups); then canonical project URL so the
 * advisor never dies with supabase=null when only SUPABASE_* is configured.
 */
const DEFAULT_SUPABASE_URL = 'https://cocugdgelatgjzgkyhpz.supabase.co';

function resolveSupabaseUrl() {
  const raw = (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ''
  ).trim();
  return raw || DEFAULT_SUPABASE_URL;
}

const supabaseUrl = resolveSupabaseUrl();
const serviceKey  = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const supabase    = serviceKey ? createClient(supabaseUrl, serviceKey) : null;

// Pro & override emails get 20 questions/day for the entire 30-day trial /
// active subscription. Trial users get 5 questions/day for the FIRST 7 days
// only — after that the advisor locks (other Pro features remain available
// for the rest of the 30-day trial).
const DAILY_LIMIT       = 20;
const TRIAL_DAILY_LIMIT = 5;
const AI_TRIAL_DAYS     = 7;
const UNLIMITED_AI_EMAILS = new Set(['apriq@apriq.co.za']);

/** Keep long sessions from ballooning the prompt (stateless API; history is re-sent each request). */
const MAX_HISTORY_MESSAGES = 40;

/** Default raised from 1800: Gemini 2.5 Flash can use part of the budget for "thinking" unless disabled. */
const DEFAULT_MAX_OUTPUT_TOKENS = 8192;

function envInt(name, fallback) {
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;
  const n = Number.parseInt(String(raw), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseGeminiAdvisorModels() {
  const rawTrim = (process.env.GEMINI_ADVISOR_MODELS || '').trim();
  const source = rawTrim || 'gemini-2.5-flash,gemini-2.0-flash';
  const pieces = source
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return pieces.length ? pieces : ['gemini-2.5-flash', 'gemini-2.0-flash'];
}

function mergeGeminiParts(parts) {
  if (!Array.isArray(parts)) return '';
  return parts
    .map((part) => (part && typeof part.text === 'string' ? part.text : ''))
    .join('')
    .trim();
}

async function advisorGeminiAttempt(apiKey, modelId, contents, generationConfig) {
  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/' +
    encodeURIComponent(modelId) +
    ':generateContent?key=' +
    encodeURIComponent(apiKey);
  const geminiRes = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents, generationConfig }),
  });
  const geminiData = await geminiRes.json().catch(() => ({}));
  return { ok: geminiRes.ok, status: geminiRes.status, modelId, generationConfig, data: geminiData };
}

async function generateAdvisorGeminiCompletion(apiKey, contents, maxOutputTokens) {
  const models = parseGeminiAdvisorModels();
  const configVariants = [
    { temperature: 0.44, maxOutputTokens, thinkingConfig: { thinkingBudget: 0 } },
    { temperature: 0.44, maxOutputTokens },
  ];

  let lastHardError = null;
  for (const modelId of models) {
    for (const gc of configVariants) {
      const attempt = await advisorGeminiAttempt(apiKey, modelId, contents, gc);

      if (!attempt.ok) {
        const msgStr = typeof attempt.data?.error?.message === 'string' ? attempt.data.error.message : '';
        console.error('Gemini attempt failed:', modelId, attempt.status, msgStr || attempt.data);
        lastHardError = attempt;
        if (attempt.status === 404) break;

        continue;
      }

      const cand = attempt.data?.candidates?.[0];
      const text = mergeGeminiParts(cand?.content?.parts);

      const feedbackBlock = attempt.data?.promptFeedback?.blockReason;
      if (feedbackBlock && !text) {
        console.warn('Gemini blocked:', modelId, feedbackBlock);
        lastHardError = attempt;
        continue;
      }

      if (!text && cand?.finishReason === 'SAFETY') {
        console.warn('Gemini SAFETY empty:', modelId);
        lastHardError = attempt;
        continue;
      }

      const finishReason = cand?.finishReason;
      const usableTrimmed = !!(text || finishReason === 'MAX_TOKENS');
      if (usableTrimmed) {
        if (attempt.data?.usageMetadata) console.info('Gemini usage:', attempt.data.usageMetadata);
        if (finishReason && finishReason !== 'STOP') console.warn('Gemini finish reason:', finishReason);
        return { text: text || '', finishReason: finishReason || 'STOP', data: attempt.data, modelId, generationConfig: gc };
      }

      console.warn('Gemini no usable reply:', modelId, finishReason, attempt.data?.promptFeedback);
      lastHardError = attempt;
    }
  }

  if (lastHardError) console.error('All Gemini advisor attempts exhausted:', lastHardError?.status);
  return null;
}

function asNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function fmtRand(value) {
  const n = Math.round(asNumber(value));
  return 'R ' + n.toLocaleString('en-ZA').replace(/,/g, ' ');
}

function fmtPct(value) {
  return Math.round(asNumber(value) * 100) + '%';
}

function stripAiFormatting(text) {
  const raw = String(text || '');
  // Remove common markdown-ish formatting that renders poorly in plain text bubbles.
  // Keep the words; remove the decoration.
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/^\s*```[\s\S]*?^\s*```\s*$/gm, '') // fenced code blocks
    .replace(/^\s*#{1,6}\s+/gm, '')              // headings
    .replace(/^\s*---+\s*$/gm, '')               // hr
    .replace(/^\s*[-*•]\s+/gm, '')               // bullets
    .replace(/\*\*(.*?)\*\*/g, '$1')             // bold
    .replace(/__(.*?)__/g, '$1')                 // bold alt
    .replace(/\*(.*?)\*/g, '$1')                 // italics
    .replace(/_(.*?)_/g, '$1')                   // italics alt
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const APRIQ_INTELLIGENCE_PROMPT = `
You are AprIQ Intelligence.

You are the AI reasoning layer inside AprIQ, a South African construction cost planning tool.

You do NOT generate new numbers.
You interpret structured estimate data and derived signals.

Your role is to provide:
- clear
- honest
- contextual
- non-generic
- feasibility-grade feedback

You must behave as a hybrid between:
- Quantity Surveyor
- Developer
- Investor

You must NOT behave like a chatbot or summariser.

---

CORE OBJECTIVE

Your purpose is to assist real-world decision making in early-stage project planning.

You must:
- anchor narrative in the stated **building type / subtype** when present (warehouse vs mini-units vs heavy industrial changes the story)
- interpret what the estimate means
- identify risks and exposure
- contextualise the numbers within South Africa
- highlight where assumptions may be optimistic or conservative
- guide users toward better inputs

If the estimate is weak or unrealistic, you must say so professionally.

---

CRITICAL RULE — COST PER m²

When referencing R/m²:
Use ONLY:
construction_cost + financial_additions

DO NOT include land.

Land is always treated as a separate layer.

---

INPUT STRUCTURE

You will receive:

1. RAW ESTIMATE DATA
2. DERIVED ADVISOR SIGNALS (pre-calculated)

You MUST prioritise the advisor signals.

---

ADVISOR SIGNALS (MANDATORY USE)

You will receive:

- ratePosition: "under" | "aligned" | "premium"
- locationType: "metro" | "coastal" | "regional" | "remote"
- projectRisk: "low" | "medium" | "high"
- contingencyAdequacy: "low" | "adequate" | "high"
- prelimsPressure: "low" | "normal" | "high"
- topCostDrivers: [array of top 3]
- escalationExposure: numeric (ZAR)
- escalationRisk: "low" | "moderate" | "high"

You MUST use these signals.
You are NOT allowed to ignore them.

---

LOCATION REASONING (CRITICAL)

You MUST reason about ANY South African location using the available location name, any province/region cues in the address, the selected site access type, and practical regional characteristics.

The following locations are EXAMPLES ONLY (they do not limit your reasoning to these places): Pretoria, Cape Town, Ballito, Bloemfontein, Cederberg/Clanwilliam.

You MUST interpret location using locationType:

If locationType = "metro":
- strong contractor competition
- stable pricing
- efficient supply chain

If locationType = "coastal":
- higher specification pressure (often premium residential expectations)
- environmental exposure (corrosion, moisture)
- waterproofing/coastal detailing sensitivity

If locationType = "regional":
- moderate pricing stability
- possible specialist trade constraints

If locationType = "remote":
- logistics and transport risk
- contractor availability constraints
- programme inefficiency risk
- higher preliminaries pressure

SCALABLE INTERPRETATION RULE:
In addition to locationType, infer the practical context when you can from the location string and project signals. Use phrases like:
"This behaves more like a small-town/regional build", "an industrial node", "a tourism/lifestyle premium market", "a high-growth development node", "rural/remote logistics-led project".
Do not over-claim certainty. Ground it in address cues + site access + project risk.

FALLBACK RULE (NO 'UNKNOWN LOCATION'):
If the exact place is not clearly recognised, do NOT say "unknown location". Instead say:
"Based on the selected site access and broader regional context, this behaves more like a metro/coastal/regional/remote project", and explain the implications.

You must explain:
"What does this location change about the estimate?"

Even if all numbers are identical, location MUST change your reasoning.

DISTINCTION RULE (URBAN-IN-TOWN VS REGIONAL LOGISTICS):
If siteAccess is "Urban" but the address/location context is regional/remote, explain the distinction clearly:
"The site may be urban within the town, but the broader regional logistics/supply chain context still matters."

---

RATE POSITION RULE (LANGUAGE — NOT LABELS)

If ratePosition = "under":
→ say the allowance looks tight / lean / exposes you to VE or scope clashes — tie to procurement depth in THAT location.

If ratePosition = "aligned":
→ you may judge the rate band as believable or ordinary for the stated use and quality, but do NOT lean on stock phrases. Never start with “broadly market‑aligned”. Prefer concrete verbs: “sits in a normal band”, “looks defendable if…”, “will be tested if…”.

If ratePosition = "premium":
→ argue where the premium is coming from (spec, risk, geography, refurbishment unknowns).

You MUST take a stance in your own words (not a slogan).

---

RENOVATION RULE

If project includes renovation:
- quantify *what kind of exposure* you mean (survey gaps, latent structure, tenant coordination, phased handover — pick what fits)
- contingency: interpret contingencyAdequacy; propose **more than one** risk‑reduction path (not only “raise contingency to 15–20%” every time unless nothing else fits)

---

FINANCIAL STRUCTURE RULE

Interpret contingencyAdequacy, prelimsPressure, contractor profit realism, professional fees realism.

Explain **trade-offs** (e.g. low prelims + long programme vs regional procurement = real exposure).

---

ESCALATION RULE

If escalationExposure > 0:
- reference the escalation story **without repeating the same sentence structure** across different answers. Alternate: sensitivity to slip (months), as % of construction, interplay with refurbishment discovery, interplay with logistics-led locations.
If no escalation:
- Do NOT call escalation risk "low"; say exposure is unquantified.

---

COST DRIVER RULE

Use topCostDrivers from signals. Embed them inside analysis (do not default to a standalone “cost drivers” paragraph list). Tie drivers to renovation share, cladding/weathering if coastal, slab/foundation realities if regional/remote procurement.

---

INDUSTRIAL / LARGE-SPAN LENS

When RAW ESTIMATE DATA shows industrial / warehouse / logistics-type use:

- Speak like someone who procures sheds and parks: slabs, roofs, cranes or future crane provision, docks, paving, yard works, mechanical & fire services, phased occupation, noise/after-hours constraints if suburban.
- Contrast shell vs tenant fit‑out creep (internal finishes dominating can mean scope drift on an industrial ROM).

---

ANTI‑TEMPLATE PROTOCOL (MANDATORY)

Goal: Insightful QS / developer‑investor judgement — not a form filled in every time.

1) **No fixed skeleton.** Do NOT use the same headings every reply (never default to: Summary → Market position → Location interpretation → Cost drivers → Risk & sensitivity → Practical guidance). In most answers, omit explicit headings altogether; if you label anything, invent **fresh** short plain‑text headings that fit *this* project (e.g. “Procurement reality”, “Where the ROM is thin”, “What would worry me first”).

2) **Openings must rotate.** Alternate how you enter: dominant risk first, location procurement first, rate sanity check first, programme/escalation first, refurbishment unknowns first. Never open three answers in a row with “This estimate for a Xm²…”.

3) **Banned sloppy repeats** — do not use these more than once per answer, some not at all in a reply:
   - “broadly market‑aligned”, “market‑aligned”, “feasibility‑grade”
   - “The primary cost drivers are…” / “identified as…”
   - boilerplate escalation paragraph that reads the same on every geography
   - generic “engage local contractors early” without tying to specific constraints you already named for that town

4) **Same numbers, different place** — cite the named location or region **at least twice** with **different angles** (e.g. procurement depth vs environmental exposure vs logistics vs wage/competition). Explain what would materially change tender behaviour there vs moving the same warehouse 400 km inland/coastal — one or two sentences of contrast.

5) **Industrial coastal vs inland** — coastal answers must foreground corrosion/moisture, envelope durability, specifier habits in that corridor; inland regional/remote answers must foreground distance to steel/cladding/supply hubs and programme risk — avoid copying coastal wording when locationType ≠ coastal.

FORMAT (PLAIN TEXT ONLY)
- No markdown (#, bullets, fenced blocks). Short paragraphs separated by blank lines.
- Aim for roughly 280–420 words of substantive analysis unless the user explicitly asks for concise or expansive output.

STYLE

Sound like transparent professional judgement: specific, sceptical where signals warrant, never robotic. Prefer one sharp observation over five balanced platitudes.

---

FINAL CHECK

Before you answer: if almost every sentence could be swapped into another province without rewriting, regenerate mentally and add place‑specific procurement and logistics colour until it passes.
`.trim();

function buildLocationProfileHint(estimateState, advisorSignals) {
  const addr = String(estimateState?.projectLocation?.address || '').toLowerCase();
  const site = String(estimateState?.siteAccessKey || '').toLowerCase();
  const locType = advisorSignals?.locationType || 'regional';

  const notes = [];

  // Examples only — used as hints, never as exclusive cases.
  if (addr.includes('sandton')) notes.push('premium metro node (finish/spec expectations can creep)');
  if (addr.includes('cape town') && (addr.includes('cbd') || addr.includes('central') || addr.includes('city'))) {
    notes.push('constrained premium metro (urban logistics/laydown/traffic constraints)');
  }
  if (addr.includes('tokai')) {
    notes.push('Cape Town southern suburbs corridor (metro rates + cape envelope/finish habits; suburban site rules on hours/noise)');
  }
  if (addr.includes('lynnwood')) {
    notes.push('Pretoria-east node (dense services market; arterial logistics for bulky loads)');
  }
  if (addr.includes('jeffrey') || addr.includes("jeffreys")) {
    notes.push('EC coastal town (marine exposure + longer specialist detours versus Gqeberha/Durban corridors)');
  }
  if (addr.includes('johannesburg') || addr.includes('joburg')) {
    notes.push('Gauteng industrial heartland (deep subcontractor pool; tender sharpness; logistics on N3/R24 corridors)');
  }
  if (addr.includes('newcastle')) {
    notes.push('Northern KZN industrial corridor (heavy industry adjacency; port/backload logistics often via Richards Bay/Durban)');
  }
  if (addr.includes('musina')) {
    notes.push('Far-northern logistics node (long supply lines from Polokwane/Pretoria; border corridor effects on lead times)');
  }
  if (addr.includes('ballito') || addr.includes('umhlanga') || addr.includes('north coast')) {
    notes.push('coastal premium / high-growth residential node (finish expectations + coastal detailing)');
  }
  if (addr.includes('bloemfontein')) notes.push('inland regional centre (specialist trade depth can be thinner than metros)');
  if (addr.includes('pretoria') || addr.includes('tshwane')) notes.push('major metro (stable contractor market + supply chain depth)');
  if (addr.includes('cederberg') || addr.includes('clanwilliam')) notes.push('logistics-led regional / remote-adjacent (transport + availability risk)');

  if (!notes.length) {
    if (locType === 'remote') notes.push('logistics-led context (contractor availability + transport + programme risk)');
    if (locType === 'coastal') notes.push('coastal context (corrosion/moisture detailing + finish expectations)');
    if (locType === 'metro') notes.push('metro context (competition + supply chain depth; urban constraints may apply)');
    if (locType === 'regional') notes.push('regional context (moderate stability; specialist trades may be constrained)');
  }

  if (site.includes('urban') && (locType === 'regional' || locType === 'remote')) {
    notes.push('site access may be urban within the town, but broader regional logistics still matter');
  }

  return notes.join('; ');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!supabase)             return res.status(503).json({ error: 'Server not configured' });
  const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!geminiKey)             return res.status(503).json({ error: 'AI not configured' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = authHeader.slice(7);

  const userRes = await fetch(supabaseUrl + '/auth/v1/user', {
    headers: { apikey: serviceKey, Authorization: 'Bearer ' + token },
  });
  if (!userRes.ok) return res.status(401).json({ error: 'Invalid session' });
  const sessionUser = await userRes.json();
  if (!sessionUser?.id) return res.status(401).json({ error: 'Invalid session' });
  const sessionEmail = (sessionUser?.email || '').toLowerCase();
  const hasUnlimitedAi = UNLIMITED_AI_EMAILS.has(sessionEmail);

  const { message, estimateState, conversationHistory, userId } = req.body || {};
  if (!estimateState || typeof estimateState !== 'object' || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const safeMessage = normalizeAdvisorUserMessage(
    typeof message === 'string' ? message : String(message ?? ''),
  );
  if (!safeMessage) return res.status(400).json({ error: 'Missing required fields' });
  const safeEstimateState = sanitizeEstimateLocationInState(estimateState);
  if (userId !== sessionUser.id) return res.status(403).json({ error: 'Forbidden' });

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tier, trial_end_date, trial_started_at, pro_until, cancelled_at, ai_questions_used, ai_questions_reset_date')
      .eq('id', userId)
      .single();

    if (profileError || !profile) return res.status(401).json({ error: 'User not found' });

    const today = new Date().toISOString().split('T')[0];
    const now   = Date.now();
    // Compute effective tier server-side (mirrors src/utils/tier.js).
    const proActive   = profile.tier === 'pro' && (!profile.pro_until || new Date(profile.pro_until).getTime() > now);
    const trialActive = profile.tier === 'trial' && profile.trial_end_date && new Date(profile.trial_end_date).getTime() > now;
    const effective   = proActive ? 'pro' : trialActive ? 'trial' : 'free';

    if (!hasUnlimitedAi && effective === 'free') return res.status(403).json({ error: 'upgrade_required' });

    // Trial users get 7 days of advisor access (other Pro features remain for
    // the full 30 days, gated by effectiveTier).
    if (!hasUnlimitedAi && effective === 'trial') {
      const trialStart = profile.trial_started_at
        ? new Date(profile.trial_started_at)
        : new Date(new Date(profile.trial_end_date).getTime() - 30 * 86400000);
      const daysSince = Math.floor((now - trialStart.getTime()) / 86400000);
      if (daysSince >= AI_TRIAL_DAYS) return res.status(403).json({ error: 'trial_ai_expired' });
    }

    // Per-day question cap differs by tier.
    const dailyLimit = hasUnlimitedAi ? DAILY_LIMIT
                     : effective === 'trial' ? TRIAL_DAILY_LIMIT
                     : DAILY_LIMIT;

    let questionsUsed = hasUnlimitedAi ? 0 : (profile.ai_questions_used || 0);
    if (!hasUnlimitedAi && profile.ai_questions_reset_date !== today) {
      questionsUsed = 0;
      await supabase.from('profiles').update({ ai_questions_used: 0, ai_questions_reset_date: today }).eq('id', userId);
    }
    if (!hasUnlimitedAi && questionsUsed >= dailyLimit) {
      return res.status(429).json({ error: 'daily_limit_reached', questionsUsed, limit: dailyLimit });
    }

    // Compact JSON reduces token usage vs pretty-printed JSON — important as chat history grows.
    const estimateJson = JSON.stringify(safeEstimateState);
    const advisorSignals = buildAdvisorSignals(safeEstimateState);
    const signalsJson = JSON.stringify(advisorSignals);
    const locationProfileHint = buildLocationProfileHint(safeEstimateState, advisorSignals);

    const prompt = [
      APRIQ_INTELLIGENCE_PROMPT,
      '',
      'RAW ESTIMATE DATA:',
      estimateJson,
      '',
      'DERIVED ADVISOR SIGNALS (you MUST use these):',
      signalsJson,
      '',
      'LOCATION PROFILE HINTS (use as context, do not treat as a fact list):',
      locationProfileHint || 'none',
    ].join('\n');

    const historyRaw = Array.isArray(conversationHistory) ? conversationHistory : [];
    const historyTrimmed = historyRaw.length > MAX_HISTORY_MESSAGES
      ? historyRaw.slice(historyRaw.length - MAX_HISTORY_MESSAGES)
      : historyRaw;

    const history = historyTrimmed.map(function(msg) {
      return { role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.content }] };
    });

    const prefixContents = [
      { role: 'user',  parts: [{ text: prompt }] },
      { role: 'model', parts: [{ text: 'Understood. I will interpret the supplied estimate using the advisor signals and produce feasibility-grade, location-contextual feedback without generating new numbers.' }] },
    ].concat(history);

    const userTurn = { role: 'user', parts: [{ text: safeMessage }] };
    const contents = prefixContents.concat([userTurn]);

    const maxOutputTokens = envInt('GEMINI_MAX_OUTPUT_TOKENS', DEFAULT_MAX_OUTPUT_TOKENS);

    let geminiOutcome = await generateAdvisorGeminiCompletion(geminiKey, contents, maxOutputTokens);
    if (!geminiOutcome) return res.status(502).json({ error: 'AI service unavailable' });

    let aiReply = geminiOutcome.text;
    let finishReason = geminiOutcome.finishReason;

    if (finishReason === 'MAX_TOKENS' && aiReply) {
      const continueContents = prefixContents.concat([
        userTurn,
        { role: 'model', parts: [{ text: aiReply }] },
        { role: 'user', parts: [{ text: 'Your previous answer was cut off due to length limits. Continue from the next sentence. Do not repeat what you already wrote. Keep the same tone and constraints.' }] },
      ]);

      const contOutcome = await generateAdvisorGeminiCompletion(geminiKey, continueContents, maxOutputTokens);
      if (contOutcome?.text) {
        aiReply = `${aiReply}\n\n${contOutcome.text}`;
        finishReason = contOutcome.finishReason || finishReason;
      } else if (contOutcome) {
        console.error('Gemini continuation returned unusable:', contOutcome.finishReason);
      }
    }

    if (!aiReply) return res.status(502).json({ error: 'Empty response from AI' });
    const cleanedReply = stripAiFormatting(aiReply);
    if (!cleanedReply) return res.status(502).json({ error: 'Empty response from AI' });

    const newCount = hasUnlimitedAi ? 0 : (questionsUsed + 1);
    if (!hasUnlimitedAi) {
      await supabase.from('profiles').update({ ai_questions_used: newCount, ai_questions_reset_date: today }).eq('id', userId);
    }

    return res.status(200).json({
      reply: cleanedReply,
      questionsUsed: newCount,
      questionsRemaining: hasUnlimitedAi ? dailyLimit : (dailyLimit - newCount),
      limit: dailyLimit,
    });

  } catch (err) {
    console.error('AI advisor error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}