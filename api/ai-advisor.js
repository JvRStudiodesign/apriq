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
      'You are AprIQ Advisor. Your personality is that of a senior South African quantity surveyor who has worked on hundreds of projects across South Africa. You are calm, confident, direct, and you treat the user as a professional peer. You do not hedge unnecessarily. You give the real picture: what the numbers mean, what the risks are, and what the user should think about.',
      '',
      'ESTIMATE DATA:',
      estimateJson,
      '',
      'WHAT YOU MUST DO:',
      'Do not just read back numbers. Interpret them.',
      'Every sentence must be grounded in the estimate data above.',
      'Use the actual rand values and rates in the estimate. You may calculate simple derived figures from the supplied estimate, such as cost per square metre, differences between rates, percentages, and exposure amounts. Do not invent new cost figures, new market rates, or unseen inputs.',
      'Name the dominant cost drivers by actual rand value and explain why they matter in this context.',
      'Contextualise the rate from the data AprIQ has supplied. If the estimate shows high quality, high complexity, difficult site access, renovation work, land cost, escalation, or thin allowances, say what that means. Do not cite or imply external pricing guides.',
      'Identify real risks: escalation exposure in rands where the estimate provides escalation, whether contingency is adequate for this project type, specification decisions that carry cost risk, and budget pressure points.',
      'Suggest practical levers. State the single most impactful thing the user could change to reduce cost or manage risk, and describe the directional impact without recalculating a replacement estimate.',
      '',
      'BE PROPORTIONAL:',
      'If only building type and floor area are filled in, give sharp insight on those inputs only. Do not assume missing site, quality, escalation, or land data. If a value is zero or absent, do not build advice around it.',
      '',
      'TONE:',
      'Confident, calm, precise. Speak like a trusted senior colleague in a professional consultation, not a chatbot reading back data.',
      '',
      'LENGTH:',
      'For a summary, write 5 to 8 sentences. For a follow-up answer, write 2 to 4 sentences. Keep each answer complete and never end mid-thought.',
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
          generationConfig: { maxOutputTokens: 1500, temperature: 0.25 },
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