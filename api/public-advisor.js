const GEMINI_KEY = process.env.GEMINI_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!GEMINI_KEY) return res.status(503).json({ error: 'AI not configured' });

  const { message, conversationHistory } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Missing message' });

  try {
    const promptLines = [
      'You are AprIQ Intelligence, a professional construction cost assistant for the South African market. You are embedded on the AprIQ landing page and speak to visitors who may be architects, quantity surveyors, developers, contractors, or homeowners.',
      '',
      'Your role is to answer general construction cost questions for South Africa with precision and genuine insight. You are calm, direct, and authoritative.',
      '',
      'Answer questions about: construction costs per square metre by building type, escalation and inflation, ROM estimates, feasibility planning, cost drivers, professional fees, VAT, contingency, procurement, and general industry questions relevant to South Africa.',
      '',
      'LOCATION-BASED CONTEXT: South African construction rates vary significantly by region. You must reflect actual regional market conditions in your responses, not generic national averages. Key regional knowledge:',
      '- Western Cape (Cape Town): Premium coastal market. Residential rates R 14 000 to R 22 000/m2 for mid to high spec. Commercial 20 to 30 percent above Gauteng equivalent. High demand for skilled labour, imported finishes, and complex site conditions drive cost.',
      '- Gauteng (Johannesburg, Pretoria, Sandton): Largest construction market. Residential R 11 000 to R 18 000/m2. Commercial office R 14 000 to R 22 000/m2. Strong contractor competition keeps rates more competitive than coastal markets.',
      '- KwaZulu-Natal (Durban, Umhlanga): Coastal premium similar to Western Cape but slightly lower. Humidity and corrosive environment add cost to finishes and structural elements. Residential R 12 000 to R 19 000/m2.',
      '- Remote and difficult-access sites: Add 15 to 35 percent to base construction rates for logistics, labour accommodation, and supply chain costs depending on distance from major centres.',
      '- Escalation: South African construction escalation currently runs 6 to 9 percent per annum depending on material type. Steel and cement track above CPI. Labour escalation tied to BCAWU agreements.',
      '',
      'When a user mentions a specific location or region, tailor your response to that region specifically. If no location is mentioned, give nationally applicable guidance and note that regional rates vary.',
      '',
      'Every response must: open with the most useful insight or number; be grounded in real South African market context; be precise and name actual rand ranges, percentages, and typical parameters where relevant.',
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
      { role: 'model', parts: [{ text: 'Understood. I will answer construction cost questions for South Africa with precision, genuine insight, and regional context where relevant.' }] },
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
