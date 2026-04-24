import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase    = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;

const DAILY_LIMIT   = 20;
const AI_TRIAL_DAYS = 7;

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

    const estimateJson = JSON.stringify(estimateState, null, 2);

    const prompt = [
      'You are AprIQ Advisor, a senior quantity surveyor and construction cost specialist embedded in the AprIQ platform. You serve South African architects and quantity surveyors.',
      '',
      'ESTIMATE DATA:',
      estimateJson,
      '',
      'INSTRUCTIONS:',
      'Write a professional, insightful, and engaging cost review of the estimate above. Your response must feel like advice from a trusted senior QS who has reviewed thousands of projects.',
      '',
      'Your response must always do the following where the data exists:',
      '- State the total cost and cost per square metre clearly and immediately.',
      '- Identify and name the dominant cost drivers by rand value and explain why they matter.',
      '- Contextualise the rate — is this low, mid-range, or premium for this buding type and specification in South Africa? Why?',
      '- Highlight any budget risks — escalation exposure, specification decisions that could push cost higher, adequacy of contingency, site conditions.',
      '- Suggest practical levers the user could consider to reduce cost or manage risk, with directional impact.',
      '- Be proportional — if only building type and area are filled in, give a strong insight on those inputs only. Do not fabricate or assume missing data.',
      '',
      'TONE AND FORMAT:',
      '- Write in flowing, professional prose. Calm, authoritative, and precise.',
      '- Be deliberate — every sentence must add insight. No filler, no padding, no generic statements.',
      '- Be engaging and interesting. A great response makes the user feel informed and confident.',
      '- Length: 5 to 8 sentences for summaries, 3 to 4 for follow-up questions.',
      '- Currency: South African Rand with spaces — R 1 200 000 not R12
      '- Never mention AECOM, competitor tools, or external pricing sources.',
      '- Respond in the same language the user writes in.',
      '- CRITICAL: No markdown. No bullet points, asterisks, dashes as lists, hash symbols, bold, italic, or headers of any kind. Pure flowing prose only. Begin immediately with your insight.',
    ].join('\n');

    const history = (conversationHistory || []).map(function(msg) {
      return { role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.content }] };
    });

    const contents = [
      { role: 'user',  parts: [{ text: prompt }] },
      { role: 'model', parts: [{ text: 'Understood. I will give a specific, professional, and insightful review grounded entirely in the estimate data provided — including cost drivers, risks, and recommendations.' }] },
    ].concat(history).concat([{ role: 'user', parts: [{ text: message }] }]);

    const geminiRes = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + process.env.GEMINI_API_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: contents,
          generationConfig: { maxOutputTokens: 1200, temperature: 0.3 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini error:', errText);
      return res.status(502).json({ error: 'AI service unavailable' });
    }

    const geminiData = await geminiRes.json();
    const aiReply    = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiReply) return res.status(502).json({ error: 'Empty response from AI' });

    const newCount = questionsUsed + 1;
    await supabase.from('profiles').update({ ai_questions_used: newCount, ai_questions_reset_date: today }).eq('id', userId);

    return res.status(200).json({ reply: aiReply, questionsUsed: newCount, questionsRemaining: DAILY_LIMIT - newCount, limit: DAILY_LIMIT });

  } catch (err) {
    console.error('AI advisor error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}