import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase    = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;

const DAILY_LIMIT   = 20;
const AI_TRIAL_DAYS = 7;

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

function topDrivers(estimateState) {
  return [
    ['Construction cost', estimateState.constructionCost],
    ['Land cost', estimateState.landCost],
    ['Contingency', estimateState.contingency],
    ['Contractor profit', estimateState.contractorProfit],
    ['Preliminaries', estimateState.preliminaries],
    ['Professional fees', estimateState.professionalFees],
  ]
    .map(([label, value]) => ({ label, value: asNumber(value) }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 4);
}

function buildAdvisorFacts(estimateState) {
  const floorArea = asNumber(estimateState.floorArea);
  const totalCost = asNumber(estimateState.totalCost);
  const constructionCost = asNumber(estimateState.constructionCost);
  const baseRate = asNumber(estimateState.baseRate);
  const adjustedBaseRate = asNumber(estimateState.adjustedBaseRate);
  const totalRate = floorArea > 0 ? totalCost / floorArea : 0;
  const constructionRate = floorArea > 0 ? constructionCost / floorArea : 0;
  const escalationExposure = Math.max(0, asNumber(estimateState.escalatedTotal) - totalCost);
  const drivers = topDrivers(estimateState);
  const specUpliftPerM2 = adjustedBaseRate && baseRate ? adjustedBaseRate - baseRate : 0;

  const qualityKey = estimateState.qualityKey || '';
  const ratePosition = qualityKey === 'Low'
    ? 'conservative'
    : qualityKey === 'Medium'
      ? 'market-rate'
      : qualityKey === 'High'
        ? 'premium'
        : qualityKey === 'Premium'
          ? 'high-end premium'
          : 'not classified';

  return {
    project: `${estimateState.projectTypeKey || 'Project'} ${estimateState.buildingType || ''} / ${estimateState.buildingSubtype || ''}`.trim(),
    projectLocation: estimateState.projectLocation?.address
      ? `${estimateState.projectLocation.address} (${estimateState.projectLocation.source || 'provided'})`
      : 'missing - ask the user before giving a summary or location-sensitive cost feedback',
    floorArea: floorArea ? `${Math.round(floorArea)} m2` : 'not provided',
    totalCost: fmtRand(totalCost),
    totalRatePerM2: totalRate ? `${fmtRand(totalRate)} /m2` : 'not available',
    constructionCost: fmtRand(constructionCost),
    constructionRatePerM2: constructionRate ? `${fmtRand(constructionRate)} /m2` : 'not available',
    baseRate: baseRate ? `${fmtRand(baseRate)} /m2` : 'not available',
    adjustedBaseRate: adjustedBaseRate ? `${fmtRand(adjustedBaseRate)} /m2` : 'not available',
    specUpliftPerM2: specUpliftPerM2 ? `${fmtRand(specUpliftPerM2)} /m2` : 'not available',
    ratePosition,
    dominantDrivers: drivers.map((d) => `${d.label}: ${fmtRand(d.value)}`).join('; '),
    allowances: [
      `contingency ${fmtPct(estimateState.contingencyPct)} (${fmtRand(estimateState.contingency)})`,
      `contractor profit ${fmtPct(estimateState.contractorProfitPct)} (${fmtRand(estimateState.contractorProfit)})`,
      `preliminaries ${fmtPct(estimateState.preliminariesPct)} (${fmtRand(estimateState.preliminaries)})`,
      `professional fees ${fmtPct(estimateState.professionalFeesPct)} (${fmtRand(estimateState.professionalFees)})`,
    ].join('; '),
    specificationSignals: [
      `quality ${estimateState.qualityKey || 'not provided'} x${asNumber(estimateState.qualityMultiplier).toFixed(2)}`,
      `complexity ${estimateState.complexityKey || 'not provided'} x${asNumber(estimateState.complexityMultiplier).toFixed(2)}`,
      `site access ${estimateState.siteAccessKey || 'not provided'} x${asNumber(estimateState.siteAccessMultiplier).toFixed(2)}`,
      estimateState.isRenovation ? `renovation area ${Math.round(asNumber(estimateState.renovationArea))} m2 x${asNumber(estimateState.renovationMultiplier).toFixed(2)}` : null,
    ].filter(Boolean).join('; '),
    escalation: estimateState.includeEscalation
      ? `${asNumber(estimateState.escalationRate)}% p.a.; exposure ${fmtRand(escalationExposure)}; escalated total ${fmtRand(estimateState.escalatedTotal)}`
      : 'not included',
    land: asNumber(estimateState.landCost) > 0
      ? `${estimateState.landType || 'Land'} on ${Math.round(asNumber(estimateState.landArea))} m2: ${fmtRand(estimateState.landCost)}`
      : 'no land cost included',
    vat: asNumber(estimateState.vat) > 0
      ? `${fmtPct(estimateState.vatPct)} (${fmtRand(estimateState.vat)})`
      : 'not available',
  };
}

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

    if (tier === 'free') return res.status(403).json({ error: 'upgrade_required' });

    if (tier === 'trial' && profile.trial_end_date) {
      const trialEnd   = new Date(profile.trial_end_date);
      const trialStart = new Date(trialEnd.getTime() - 30 * 86400000);
      const daysSince  = Math.floor((Date.now() - trialStart.getTime()) / 86400000);
      if (daysSince >= AI_TRIAL_DAYS) return res.status(403).json({ error: 'trial_ai_expired' });
    }

    let questionsUsed = profile.ai_questions_used || 0;
    if (profile.ai_questions_reset_date !== today) {
      questionsUsed = 0;
      await supabase.from('profiles').update({ ai_questions_used: 0, ai_questions_reset_date: today }).eq('id', userId);
    }
    if (questionsUsed >= DAILY_LIMIT) return res.status(429).json({ error: 'daily_limit_reached', questionsUsed, limit: DAILY_LIMIT });

    const advisorFacts = buildAdvisorFacts(estimateState);
    const estimateJson = JSON.stringify(estimateState, null, 2);
    const factsJson = JSON.stringify(advisorFacts, null, 2);

    const prompt = [
      'You are AprIQ Advisor. Your personality is that of a senior South African quantity surveyor who has worked on hundreds of projects across South Africa. You are calm, confident, direct, and you treat the user as a professional peer. You do not hedge unnecessarily. You give the real picture: what the numbers mean, what the risks are, and what the user should think about.',
      '',
      'QS FACTS TO USE FIRST:',
      factsJson,
      '',
      'ESTIMATE DATA:',
      estimateJson,
      '',
      'WHAT YOU MUST DO:',
      'Do not just read back numbers. Interpret them.',
      'Location is cost-sensitive. If projectLocation is missing, your first response to any request for summary, feedback, or interpretation must be one concise question asking for the project location or address. Do not provide the summary until location is supplied. Never infer location from the user profile or from other projects.',
      'If projectLocation is provided, explicitly use it as context for location-sensitive commentary. If the source is configured_project, treat it as the selected project address from the configurator. If the source is manual_chat, treat it as supplied by the user in this advisor session.',
      'Start with the strongest commercial insight, not with "This estimate indicates".',
      'Every sentence must be grounded in the QS facts or estimate data above.',
      'Use the formatted rand values from QS FACTS wherever possible. Do not output decimals for rands.',
      'Name the dominant cost drivers by actual rand value and explain why they matter in this context.',
      'VAT RULE: Never comment on VAT, never frame VAT as a cost driver, and never advise on VAT. VAT is statutory and present on all projects. Only mention VAT if the user explicitly asks about VAT.',
      'Contextualise the rate from the data AprIQ has supplied. If the estimate shows high quality, high complexity, difficult site access, renovation work, land cost, escalation, or thin allowances, say what that means. Do not cite or imply external pricing guides.',
      'Identify real risks: escalation exposure in rands where provided, whether contingency is adequate for this project type, specification decisions that carry cost risk, and budget pressure points.',
      'Suggest practical levers. State the single most impactful thing the user could change to reduce cost or manage risk, and describe the directional impact without recalculating a replacement estimate.',
      '',
      'BE PROPORTIONAL:',
      'If only building type and floor area are filled in, give sharp insight on those inputs only. Do not assume missing site, quality, escalation, or land data. If a value is zero or absent, do not build advice around it.',
      '',
      'TONE:',
      'Confident, calm, precise. Speak like a trusted senior colleague in a professional consultation, not a chatbot reading back data.',
      '',
      'LENGTH:',
      'For a summary, write 5 to 7 sentences and no more than 140 words. For a follow-up answer, write 2 to 4 sentences and no more than 90 words. Keep each answer complete and never end mid-thought.',
      '',
      'FORMAT:',
      'Flowing professional prose only. No bullet points. No numbered lists. No dashes as lists. No headers. No bold. No italic. No markdown of any kind. Begin immediately with the insight.',
      '',
      'LANGUAGE:',
      'Respond in the same language the user writes in.',
      '',
      'NEVER:',
      'Never mention AECOM, competitor tools, external pricing guides, or third-party pricing sources by name.',
    ].join('\n');

    const history = (conversationHistory || []).map(function(msg) {
      return { role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.content }] };
    });

    const contents = [
      { role: 'user',  parts: [{ text: prompt }] },
      { role: 'model', parts: [{ text: 'Understood. I will respond as a senior QS with concise, specific advice grounded only in the supplied estimate data.' }] },
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

    const newCount = questionsUsed + 1;
    await supabase.from('profiles').update({ ai_questions_used: newCount, ai_questions_reset_date: today }).eq('id', userId);

    return res.status(200).json({ reply: aiReply, questionsUsed: newCount, questionsRemaining: DAILY_LIMIT - newCount, limit: DAILY_LIMIT });

  } catch (err) {
    console.error('AI advisor error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}