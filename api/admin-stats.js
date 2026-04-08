// api/admin-stats.js
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url        = 'https://cocugdgelatgjzgkyhpz.supabase.co';
  if (!serviceKey) return res.status(503).json({ error: 'Service key not configured' });
  const h = { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' };
  async function q(path) {
    const r = await fetch(`${url}/rest/v1/${path}`, { headers: h });
    return r.json();
  }
  const now  = new Date();
  const day  = new Date(now - 86400000).toISOString();
  const week = new Date(now - 7*86400000).toISOString();
  const [allUsers, trialUsers, proUsers, allEstimates, todayEst, weekEst] = await Promise.all([
    q('profiles?select=id,tier,trial_end_date,referral_source,created_at'),
    q('profiles?tier=eq.trial&select=id,trial_end_date'),
    q('profiles?tier=eq.pro&select=id,created_at'),
    q('estimates?select=id,building_category,building_subtype,created_at'),
    q(`estimates?created_at=gte.${day}&select=id`),
    q(`estimates?created_at=gte.${week}&select=id`),
  ]);
  const dailySignups  = (allUsers||[]).filter(u => u.created_at >= day).length;
  const weeklySignups = (allUsers||[]).filter(u => u.created_at >= week).length;
  const activeTrials  = (trialUsers||[]).filter(u => u.trial_end_date && new Date(u.trial_end_date) > now).length;
  const proCount      = (proUsers||[]).length;
  const totalUsers    = (allUsers||[]).length;
  const convRate      = totalUsers > 0 ? ((proCount/totalUsers)*100).toFixed(1) : '0.0';
  const mrr = proCount * 149;
  const arr = mrr * 12;
  const typeCount = {};
  (allEstimates||[]).forEach(e => {
    const k = e.building_subtype || e.building_category || 'Unknown';
    typeCount[k] = (typeCount[k]||0) + 1;
  });
  const topTypes = Object.entries(typeCount).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name,count])=>({name,count}));
  const refCount = {};
  (allUsers||[]).forEach(u => {
    const k = u.referral_source || 'direct';
    refCount[k] = (refCount[k]||0) + 1;
  });
  const referrals = Object.entries(refCount).sort((a,b)=>b[1]-a[1]).map(([source,count])=>({source,count}));
  return res.status(200).json({
    users:      { total: totalUsers, daily: dailySignups, weekly: weeklySignups },
    trials:     { active: activeTrials },
    pro:        { total: proCount, monthly: proCount, annual: 0 },
    conversion: parseFloat(convRate),
    estimates:  { total: (allEstimates||[]).length, today: (todayEst||[]).length, weekly: (weekEst||[]).length },
    revenue:    { mrr, arr },
    topTypes,
    referrals,
  });
}
