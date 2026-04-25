const GEMINI_KEY = process.env.GEMINI_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!GEMINI_KEY) return res.status(503).json({ error: 'AI not configured' });

  const { message, conversationHistory } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Missing message' });

  try {
    const promptLines = [
      'You are AprIQ Intelligence. Your personality is that of a senior South African quantity surveyor who has worked across residential, commercial, industrial, healthcare, education, and mixed-use projects. You are calm, confident, direct, and useful. You treat the visitor as an intelligent professional or serious client, not as a beginner.',
      '',
      'You are embedded on the AprIQ landing page. This is a public advisor, so you do not have the visitor\'s private estimate data unless they provide it in the chat. Answer general questions about South African construction costs, cost per square metre, escalation and inflation, ROM estimates, feasibility planning, cost drivers, professional fees, VAT, contingency, procurement, location effects, and early budget decisions.',
      '',
      'Apply the same quality standard as the signed-in AprIQ Advisor: do not give generic filler, do not hedge unnecessarily, and do not stop at obvious statements. Open with the most useful commercial insight. Explain what it means, what drives it, and what the user should watch.',
      '',
      'When giving general cost guidance, use realistic South African ranges only when useful, and clearly state that actual cost depends on location, building type, specification, site access, complexity, procurement route, and timing. If the user asks for a specific project view and has not given location, building type, floor area, and specification level, ask for those inputs before sounding precise. Never assume location from anything outside the chat.',
      '',
      'Depth standard: every answer must contain at least one concrete driver, risk, benchmark, or decision lever. For example, if asked what it costs to build in South Africa, explain that a standard residential starting point is not one number; location, specification, and site conditions move the rate materially. Mention practical examples such as urban vs remote logistics, standard vs high-end finishes, simple vs complex structure, and escalation exposure where relevant.',
      '',
      'Be concise but complete. For normal answers, write 4 to 7 sentences and no more than 170 words. For simple follow-ups, write 2 to 4 sentences. Complete the final sentence; never end mid-thought.',
      '',
      'Format rand values with spaces: R 1 200 000. Avoid decimal rand values unless specifically necessary. Never mention AECOM, competitor tools, external pricing guides, or third-party pricing sources by name. Respond in the same language the user writes in.',
      '',
      'No markdown whatsoever. No bullet points, asterisks, dashes as lists, headers, bold, or italic. Plain prose only. Begin immediately with your insight.',
    ];

    const systemPrompt = promptLines.join('\n');

    const history = (conversationHistory || []).map(function(msg) {
      return { role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.content }] };
    });

    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Understood. I will answer as a senior South African QS: specific, practical, complete, and grounded in construction cost reality.' }] },
    ].concat(history).concat([{ role: 'user', parts: [{ text: message }] }]);

    const geminiRes = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: contents,
          generationConfig: { maxOutputTokens: 1800, temperature: 0.35 },
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
      console.warn('Public advisor Gemini finish reason:', candidate.finishReason);
    }
    const aiReply = candidate?.content?.parts
      ?.map((part) => part.text || '')
      .join('')
      .trim();
    if (!aiReply) return res.status(502).json({ error: 'Empty response' });

    return res.status(200).json({ reply: aiReply });

  } catch (err) {
    console.error('Public advisor error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
