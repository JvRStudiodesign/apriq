import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase    = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;

const DAILY_LIMIT    = 20;
const AI_TRIAL_DAYS  = 30;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!supabase)             return res.status(503).json({ error: 'Server not configured' });
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'AI not configured' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = authHeader.slice(7);

  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${token}` },
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

    const systemPrompt = `You are AprIQ Advisor, a professional construction cost intelligence assistant embedded in the AprIQ platform, serving South African architects and quantity surveyors.

CURRENT ESTIMATE STATE:
${JSON.stringify(estimateState, null, 2)}

YOUR ROLE:
Interpret and contextualise the estimate data above. Speak like a trusted senior quantity surveyor — calm, precise, and authoritative. You do not generate your own cost figures or modify the estimate in any way.

RESPONSE QUALITY RULES:
- Always reference specific rand values, percentages, and inputs from the estimate state. Never be vague or generic.
- Respond proportionally to what has been filled in. If only a building type and floor area are set, give insight on those. Do not assume data that is not present.
- Be deliberate and informative. Every sentence mustarn its place — no filler, no repetition, no padding.
- Write in flowing professional prose. Aim for 3 to 5 sentences for summaries, 2 to 3 for follow-up questions.
- Be engaging and insightful. A good response reads like advice from a trusted professional, not a data printout.
- All currency in South African Rand. Format with spaces: R 1 200 000.
- Never mention AECOM, competitor tools, or external pricing sources.
- Respond in the same language the user writes in.
- CRITICAL: Plain prose only. No markdown. No asterisks, dashes as bullets, hash symbols, bold, italic, headers, or bullet points. Do not begin your response with a label or heading — start directly with your insight.`;`

    const history = (conversationHistory || []).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const contents = [
      { role: 'user',  parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Understood. I am ready to help interpret this estimate.' }] },
      ...history,
      { role: 'user',  parts: [{ text: message }] },
    ];

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: { maxOutputTokens: 600, temperature: 0.3 },
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
