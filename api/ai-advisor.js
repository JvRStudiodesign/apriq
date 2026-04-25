import { createClient } from '@supabase/supabase-js';
import { buildAdvisorSignals } from '../src/utils/advisorSignals.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase    = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;

const DAILY_LIMIT   = 20;
const AI_TRIAL_DAYS = 7;
const UNLIMITED_AI_EMAILS = new Set(['apriq@apriq.co.za']);

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

You MUST interpret location using locationType:

If locationType = "metro":
- strong contractor competition
- stable pricing
- efficient supply chain

If locationType = "coastal":
- higher specification pressure
- environmental exposure (corrosion, moisture)
- premium residential expectations

If locationType = "regional":
- moderate pricing stability
- possible specialist trade constraints

If locationType = "remote":
- logistics and transport risk
- contractor availability constraints
- programme inefficiency risk
- higher preliminaries pressure

You must explain:
"What does this location change about the estimate?"

Even if all numbers are identical, location MUST change your reasoning.

---

RATE POSITION RULE

If ratePosition = "under":
→ describe as cost-sensitive / potentially under-allowed

If ratePosition = "aligned":
→ describe as broadly market-aligned ONLY if context supports it

If ratePosition = "premium":
→ describe as specification-driven or potentially overcapitalised

You MUST take a stance.

---

RENOVATION RULE

If project includes renovation:
- highlight uncertainty
- highlight hidden conditions risk
- evaluate contingency

---

FINANCIAL STRUCTURE RULE

Interpret:
- contingencyAdequacy
- prelimsPressure
- profit realism

Do not just list values — explain implications.

---

ESCALATION RULE

If escalationExposure > 0:
- quantify impact
- explain what delay or inflation would do

If no escalation:
- explicitly flag exposure

---

COST DRIVER RULE

Use topCostDrivers.

Explain WHY they matter, not just WHAT they are.

---

OUTPUT STRUCTURE

1. Summary
2. Market Position
3. Location Interpretation
4. Cost Drivers
5. Risk & Sensitivity
6. Practical Guidance

---

STYLE RULES

- No generic wording
- No repeated templates
- No “market-rate” unless justified
- No neutral summaries
- Must feel like a real feasibility note

---

FINAL PRINCIPLE

If two estimates have identical numbers but different locations:

Your explanation MUST be different.

If it is not, your answer is incorrect.
`.trim();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!supabase)             return res.status(503).json({ error: 'Server not configured' });
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'AI not configured' });

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
  if (!message || !estimateState || !userId) return res.status(400).json({ error: 'Missing required fields' });
  if (userId !== sessionUser.id) return res.status(403).json({ error: 'Forbidden' });

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tier, trial_end_date, ai_questions_used, ai_questions_reset_date')
      .eq('id', userId)
      .single();

    if (profileError || !profile) return res.status(401).json({ error: 'User not found' });

    const today = new Date().toISOString().split('T')[0];
    const tier  = profile.tier;

    if (!hasUnlimitedAi && tier === 'free') return res.status(403).json({ error: 'upgrade_required' });

    if (!hasUnlimitedAi && tier === 'trial' && profile.trial_end_date) {
      const trialEnd   = new Date(profile.trial_end_date);
      const trialStart = new Date(trialEnd.getTime() - 30 * 86400000);
      const daysSince  = Math.floor((Date.now() - trialStart.getTime()) / 86400000);
      if (daysSince >= AI_TRIAL_DAYS) return res.status(403).json({ error: 'trial_ai_expired' });
    }

    let questionsUsed = hasUnlimitedAi ? 0 : (profile.ai_questions_used || 0);
    if (!hasUnlimitedAi && profile.ai_questions_reset_date !== today) {
      questionsUsed = 0;
      await supabase.from('profiles').update({ ai_questions_used: 0, ai_questions_reset_date: today }).eq('id', userId);
    }
    if (!hasUnlimitedAi && questionsUsed >= DAILY_LIMIT) {
      return res.status(429).json({ error: 'daily_limit_reached', questionsUsed, limit: DAILY_LIMIT });
    }

    const estimateJson = JSON.stringify(estimateState, null, 2);
    const advisorSignals = buildAdvisorSignals(estimateState);
    const signalsJson = JSON.stringify(advisorSignals, null, 2);

    const prompt = [
      APRIQ_INTELLIGENCE_PROMPT,
      '',
      'RAW ESTIMATE DATA:',
      estimateJson,
      '',
      'DERIVED ADVISOR SIGNALS (you MUST use these):',
      signalsJson,
    ].join('\n');

    const history = (conversationHistory || []).map(function(msg) {
      return { role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.content }] };
    });

    const contents = [
      { role: 'user',  parts: [{ text: prompt }] },
      { role: 'model', parts: [{ text: 'Understood. I will interpret the supplied estimate using the advisor signals and produce feasibility-grade, location-contextual feedback without generating new numbers.' }] },
    ].concat(history).concat([{ role: 'user', parts: [{ text: message }] }]);

    const geminiRes = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + process.env.GEMINI_API_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: contents,
          generationConfig: { maxOutputTokens: 2500, temperature: 0.42 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini error:', errText);
      return res.status(502).json({ error: 'AI service unavailable' });
    }

    const geminiData = await geminiRes.json();
    const candidate = geminiData?.candidates?.[0];
    if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
      console.warn('Gemini finish reason:', candidate.finishReason);
    }
    const aiReply = candidate?.content?.parts
      ?.map((part) => part.text || '')
      .join('')
      .trim();
    if (!aiReply) return res.status(502).json({ error: 'Empty response from AI' });

    const newCount = hasUnlimitedAi ? 0 : (questionsUsed + 1);
    if (!hasUnlimitedAi) {
      await supabase.from('profiles').update({ ai_questions_used: newCount, ai_questions_reset_date: today }).eq('id', userId);
    }

    return res.status(200).json({
      reply: aiReply,
      questionsUsed: newCount,
      questionsRemaining: hasUnlimitedAi ? DAILY_LIMIT : (DAILY_LIMIT - newCount),
      limit: DAILY_LIMIT,
    });

  } catch (err) {
    console.error('AI advisor error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}