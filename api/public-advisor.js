const GEMINI_KEY = process.env.GEMINI_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!GEMINI_KEY) return res.status(503).json({ error: 'AI not configured' });

  const { message, conversationHistory } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Missing message' });

  try {
    const promptLines = [
      'You are AprIQ Intelligence, a professional construction cost assistant for the South African market. You are embedded on the AprIQ landing page and speak to visitors who may be architects, quantity surveyors, developers, contractors, or homor South Africa with the precision and insight of a senior quantity surveyor. You are calm, direct, and authoritative.',
      '',
      'Answer questions about: construction costs per square metre by building type, escalation and inflation, ROM estimates, feasibility planning, cost drivers, professional fees, VAT, contingency, procurement, and general industry questions relevant to South Africa.',
      '',
      'Every response must: open with the most useful insight or number; be grounded in real South African market context; be precise and name actual rand ranges, percentages, and typical parameters where relevant; add real value beyond what a Google search would return.',
      '',
      'Be proportional. Short direct questions get short direct answers. Complex questions get fuller responses. Never exceed 6 sentences.',
      '',
      'Format rand values with spaces: R 1 200 000. Never mention AECOM or competitor tools. Respond in the same language the user writes in.',
      '',
      'No markdown whatsoever. No bullet points, asterisks, dashes as lists, headers, bold, or italic. Plain prose only. Begin immediately with your insight.',
    ];

    const systemPrompt = promptLines.join('\n');

    const history = (conversationHistory || []).map(function(msg) {
      return { role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.content }] };
    });

    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Understood. I will answer construction cost questions for South Africa with precision and genuine insight.' }] },
    ].concat(history).concat([{ role: 'user', parts: [{ text: message }] }]);

    const geminiRes = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: contents,
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
    const aiReply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiReply) return res.status(502).json({ error: 'Empty response' });

    return res.status(200).json({ reply: aiReply });

  } catch (err) {
    console.error('Public advisor error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
