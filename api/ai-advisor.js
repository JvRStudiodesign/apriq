import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && serviceKey
  ? createClient(supabaseUrl, serviceKey)
  : null;

const DAILY_LIMIT = 20;
const AI_TRIAL_DAYS = 7;
const TRIAL_LENGTH_DAYS = 30;

function trialStartDate(profile) {
  if (profile.trial_start) return new Date(profile.trial_start);
  if (profile.trial_end_date) {
    return new Date(new Date(profile.trial_end_date).getTime() - TRIAL_LENGTH_DAYS * 86400000);
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabase) {
    return res.status(503).json({ error: 'Server not configured' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'AI not configured' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.slice(7);

  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${token}` },
  });
  if (!userRes.ok) {
    return res.status(401).json({ error: 'Invalid session' });
  }
  const sessionUser = await userRes.json();
  if (!sessionUser?.id) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  const { message, estimateState, conversationHistory, userId } = req.body || {};

  if (!message || !estimateState || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (userId !== sessionUser.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tier, trial_end_date, ai_questions_used, ai_questions_reset_date')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ error: 'User not found' });
    }

    const today = new Date().toISOString().split('T')[0];
    const tier = profile.tier;

    if (tier === 'free') {
      return res.status(403).json({ error: 'upgrade_required' });
    }

    if (tier === 'trial') {
      const tStart = trialStartDate(profile);
      if (tStart && !isNaN(tStart.getTime())) {
        const daysSinceTrial = Math.floor((Date.now() - tStart.getTime()) / 86400000);
        if (daysSinceTrial >= AI_TRIAL_DAYS) {
          return res.status(403).json({ error: 'trial_ai_expired' });
        }
      }
    }

    let questionsUsed = profile.ai_questions_used || 0;
    const resetDate = profile.ai_questions_reset_date;

    if (resetDate !== today) {
      questionsUsed = 0;
      await supabase
        .from('profiles')
        .update({ ai_questions_used: 0, ai_questions_reset_date: today })
        .eq('id', userId);
    }

    if (questionsUsed >= DAILY_LIMIT) {
      return res.status(429).json({
        error: 'daily_limit_reached',
        questionsUsed,
        limit: DAILY_LIMIT,
      });
    }

    const systemPrompt = `You are AprIQ Advisor, a construction cost intelligence assistant built into the AprIQ platform. You help South African architects and quantity surveyors understand and interpret their cost estimates.

CURRENT ESTIMATE STATE:
${JSON.stringify(estimateState, null, 2)}

YOUR RULES:
- Interpret and explain the estimate above. Never generate alternative cost figures of your own or modify the estimate.
- When a user's question implies changing an input, guide them to the relevant slider or input in the configurator — never calculate the result yourself.
- Keep responses concise and practical. Speak like a knowledgeable colleague, not a textbook.
- All currency in South African Rand (R). Use R prefix with spaces for thousands e.g. R 1 200 000.
- Never mention AECOM, competitor products, or external pricing guides.
- If asked about something outside construction cost estimation, politely redirect.
- Respond in the same language the user writes in.
- Never use markdown formatting in your responses — plain text only.`;

    const history = (conversationHistory || []).map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const contents = [
      ...history,
      { role: 'user', parts: [{ text: message }] },
    ];

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: {
            maxOutputTokens: 400,
            temperature: 0.4,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini error:', errText);
      return res.status(502).json({ error: 'AI service unavailable' });
    }

    const geminiData = await geminiRes.json();
    const aiReply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiReply) {
      return res.status(502).json({ error: 'Empty response from AI' });
    }

    const newCount = questionsUsed + 1;
    await supabase
      .from('profiles')
      .update({
        ai_questions_used: newCount,
        ai_questions_reset_date: today,
      })
      .eq('id', userId);

    return res.status(200).json({
      reply: aiReply,
      questionsUsed: newCount,
      questionsRemaining: DAILY_LIMIT - newCount,
      limit: DAILY_LIMIT,
    });
  } catch (err) {
    console.error('AI advisor error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
