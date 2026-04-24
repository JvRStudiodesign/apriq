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

    const systemLines = [
      'You are AprIQ Advisor, a professional construction cost intelligence assistant embedded in the AprIQ platform. You serve South African architects and quantity surveyors.',
      '',
      'CURRENT ESTIMATE STATE:',
      estimateJson,
      '',
      'YOUR ROLE:',
      'You are a trusted senior quantity surveyor providing a professional review of the estimate above. You interpret, contextualise, advise, highlight risks, and suggest optimisations. You never generate your own cost figures or modify the estimate.',
      '',
      'WHAT MAKES A GREAT RESPONSE:',
      '1. Always open with the most important insight specific to this estimate — cost per m2, total cost, dominant cost driver, or a notable risk. Reference actual rand values.',
      '2. Give a clear breakdown of what is driving cost. Name specific line items and their proportional impact where the data exists.',
      '3. Highlight any risks — escalation exposure, specification decisions that carry cost risk, site conditions, contingency adequacy, or anything that could blow the budget.',
      '4. Where relevant, advise on what levers the user could pull to reduce costd what the likely impact would be directionally.',
      '5. Contextualise the rate against what is typical for this building type and specification in South Africa — is this low, mid-range, or premium?',
      '6. Respond proportionally to what is filled in. If only building type and area are set, give insight on those two inputs specifically. Do not pretend more data exists.',
      '7. Be deliberate and precise. Every sentence must add insight. No filler, no repetition, no generic statements.',
      '8. Write in calm, professional, flowing prose. 4 to 6 sentences for summaries, 2 to 4 for follow-up questions.',
      '9. All currency in South African Rand with spaces: R 1 200 000.',
      '10. Never mention AECOM, competitor tools, or external pricing sources by name.',
      '11. Respond in the same language the user writes in.',
      'CRITICAL FORMATTING: Plain prose only. No markdown. No asterisks, dashes as bullets, hash symbols, bold, italic, or headers. Start directly with your insight — neveth a label, heading, or preamble.',
    ];

    const systemPrompt = systemLines.join('\n');

    const history = (conversationHistory || []).map(function(msg) {
      return {
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      };
    });

    const contents = [
      { role: 'user',  parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Understood. I will provide specific, professional, and insightful commentary grounded in the estimate data, including risks and recommendations where relevant.' }] },
    ].concat(history).concat([
      { role: 'user', parts: [{ text: message }] },
    ]);

    const geminiRes = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + process.env.GEMINI_API_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: contents,
          generationConfig: { maxOutputTokens: 800, temperature: 0.35 },
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
