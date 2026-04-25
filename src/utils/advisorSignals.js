function asNumber(value) {
  const n = typeof value === 'string' ? parseFloat(value) : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normText(value) {
  return String(value || '').trim();
}

function normKey(value) {
  return normText(value).toLowerCase();
}

export function getRatePosition(adjustedRate, baseRate) {
  const adj = asNumber(adjustedRate);
  const base = asNumber(baseRate);
  if (!base) return 'aligned';
  const diff = (adj - base) / base;
  if (diff <= -0.15) return 'under';
  if (diff >= 0.15) return 'premium';
  return 'aligned';
}

export function getLocationType(location) {
  const loc = normKey(location);
  if (loc.includes('cape town') || loc.includes('ballito') || loc.includes('durban')) return 'coastal';
  if (loc.includes('pretoria') || loc.includes('johannesburg')) return 'metro';
  if (loc.includes('bloemfontein')) return 'regional';
  if (loc.includes('cederberg') || loc.includes('clanwilliam')) return 'remote';
  return 'regional';
}

function normaliseComplexity(complexity) {
  const c = normKey(complexity);
  if (c.includes('high')) return 'high';
  if (c.includes('medium')) return 'medium';
  return 'low';
}

export function getProjectRisk(projectType, complexity) {
  const pt = normKey(projectType);
  const cx = normaliseComplexity(complexity);
  if (pt === 'renovation') return 'high';
  if (cx === 'high') return 'high';
  if (cx === 'medium') return 'medium';
  return 'low';
}

export function getContingencyAssessment(contingency, projectType) {
  const c = asNumber(contingency);
  const pt = normKey(projectType);
  if (pt === 'renovation' && c < 0.15) return 'low';
  if (c < 0.08) return 'low';
  if (c > 0.15) return 'high';
  return 'adequate';
}

export function getPrelimsAssessment(prelims) {
  const p = asNumber(prelims);
  if (p > 0.15) return 'high';
  if (p < 0.08) return 'low';
  return 'normal';
}

export function getTopDrivers(breakdown) {
  // Supports either:
  // - object map: { key: amount }
  // - AprIQ elementBreakdown array: [{ key, label, amount }]
  if (Array.isArray(breakdown)) {
    return breakdown
      .map((row) => ({
        key: normText(row?.key || row?.label || ''),
        amount: asNumber(row?.amount),
      }))
      .filter((r) => r.key && r.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3)
      .map((r) => r.key);
  }

  const obj = breakdown && typeof breakdown === 'object' ? breakdown : {};
  return Object.entries(obj)
    .map(([k, v]) => [normText(k), asNumber(v)])
    .filter(([k, v]) => k && v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key]) => key);
}

export function calculateEscalationExposure(cost, rate, durationMonths) {
  const c = asNumber(cost);
  const r = asNumber(rate);
  const m = asNumber(durationMonths);
  if (!r || !m) return 0;
  const years = m / 12;
  return c * r * years;
}

function estimateMonthsToStart(estimatedStartDate) {
  const dateStr = normText(estimatedStartDate);
  if (!dateStr) return 0;
  const start = new Date(dateStr);
  if (Number.isNaN(start.getTime())) return 0;
  const now = new Date();
  const ms = start.getTime() - now.getTime();
  const months = Math.max(0, ms / (1000 * 60 * 60 * 24 * 30.44));
  return months;
}

export function buildAdvisorSignals(estimateState) {
  const baseRate = asNumber(estimateState?.baseRate);
  const adjustedRate = asNumber(estimateState?.adjustedBaseRate);
  const ratePosition = getRatePosition(adjustedRate, baseRate);

  const address = estimateState?.projectLocation?.address || '';
  const locationType = getLocationType(address);

  const projectType = estimateState?.projectTypeKey || '';
  const complexity = estimateState?.complexityKey || '';
  const projectRisk = getProjectRisk(projectType, complexity);

  const contingencyPct = asNumber(estimateState?.contingencyPct);
  const contingencyAdequacy = getContingencyAssessment(contingencyPct, projectType);

  const prelimsPct = asNumber(estimateState?.preliminariesPct);
  const prelimsPressure = getPrelimsAssessment(prelimsPct);

  const topCostDrivers = getTopDrivers(estimateState?.elementBreakdown || estimateState?.elementBreakdownMap || {});

  const totalCost = asNumber(estimateState?.totalCost);
  const escalationRatePct = asNumber(estimateState?.escalationRate);
  const includeEscalation = Boolean(estimateState?.includeEscalation);
  const durationMonths = includeEscalation ? estimateMonthsToStart(estimateState?.estimatedStartDate) : 0;

  const escalationExposure = includeEscalation
    ? calculateEscalationExposure(totalCost, escalationRatePct / 100, durationMonths)
    : 0;

  const escalationRisk = escalationExposure > 0 ? 'moderate' : 'low';

  return {
    ratePosition,
    locationType,
    projectRisk,
    contingencyAdequacy,
    prelimsPressure,
    topCostDrivers,
    escalationExposure,
    escalationRisk,
  };
}

