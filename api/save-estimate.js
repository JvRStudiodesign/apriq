// api/save-estimate.js — server-side estimate save with auth + validation
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = 'https://cocugdgelatgjzgkyhpz.supabase.co';
  if (!serviceKey) return res.status(503).json({ error: 'Server not configured' });

  // 1. Authenticate user via bearer token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = authHeader.slice(7);

  // Verify token with Supabase and get user identity
  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${token}` }
  });
  if (!userRes.ok) return res.status(401).json({ error: 'Invalid session' });
  const user = await userRes.json();
  if (!user?.id) return res.status(401).json({ error: 'Invalid session' });

  // 2. Verify user tier (never trust frontend tier claim)
  const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}&select=tier`, {
    headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }
  });
  const profiles = await profileRes.json();
  const tier = profiles?.[0]?.tier || 'free';
  const isPro = tier === 'pro' || tier === 'trial';

  if (!isPro) return res.status(403).json({ error: 'Pro required to save estimates' });

  // 3. Validate and sanitize inputs
  const body = req.body || {};
  const { project_id, inputs, result } = body;

  if (!project_id || typeof project_id !== 'string') return res.status(400).json({ error: 'Invalid project_id' });

  // Verify project ownership
  const projRes = await fetch(`${supabaseUrl}/rest/v1/projects?id=eq.${encodeURIComponent(project_id)}&user_id=eq.${user.id}&select=id`, {
    headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }
  });
  const projects = await projRes.json();
  if (!Array.isArray(projects) || projects.length === 0) {
    return res.status(403).json({ error: 'Project not found or access denied' });
  }

  // 4. Sanitize inputs — only allow known fields
  const allowedInputKeys = [
    'use1Category','use1Subtype','use1Allocation','use2Category','use2Subtype','use2Allocation',
    'use3Category','use3Subtype','use3Allocation','floorArea','renovationArea','projectTypeKey',
    'qualityKey','siteAccessKey','complexityKey','renovationComplexityKey','landProcurementType',
    'landArea','landSlopeKey','contingencyPct','profitPct','preliminariesPct','feesPct','vatPct',
    'includeEscalation','estimatedStartDate','escalationRate','useCustomSplit','customElementPcts',
    'use1Pct','use2Pct','use3Pct','adjustField','adjustValue'
  ];
  const safeInputs = {};
  for (const key of allowedInputKeys) {
    if (key in (inputs || {})) safeInputs[key] = inputs[key];
  }

  // Validate numeric bounds
  const numericValidations = [
    ['floorArea', 1, 999999],
    ['contingencyPct', 0, 0.5],
    ['profitPct', 0, 0.5],
    ['preliminariesPct', 0, 0.3],
    ['feesPct', 0, 0.5],
    ['vatPct', 0, 0.2],
  ];
  for (const [field, min, max] of numericValidations) {
    if (field in safeInputs) {
      const v = parseFloat(safeInputs[field]);
      if (isNaN(v) || v < min || v > max) {
        return res.status(400).json({ error: `Invalid value for ${field}` });
      }
      safeInputs[field] = v;
    }
  }

  // 5. Save to DB with verified user_id (never from client)
  const estimateData = {
    user_id: user.id,  // Always from verified session
    project_id,
    inputs: safeInputs,
    result: result || {},
    is_latest: true,
    created_at: new Date().toISOString()
  };

  // Mark previous estimates as not latest
  await fetch(`${supabaseUrl}/rest/v1/estimates?project_id=eq.${encodeURIComponent(project_id)}&user_id=eq.${user.id}`, {
    method: 'PATCH',
    headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_latest: false })
  });

  const saveRes = await fetch(`${supabaseUrl}/rest/v1/estimates`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json', 'Prefer': 'return=representation'
    },
    body: JSON.stringify(estimateData)
  });

  if (!saveRes.ok) {
    console.error('Save failed:', await saveRes.text());
    return res.status(500).json({ error: 'Save failed' });
  }

  const saved = await saveRes.json();
  console.log(`Estimate saved: user ${user.id}, project ${project_id}`);
  return res.status(200).json({ id: saved?.[0]?.id || null });
}
