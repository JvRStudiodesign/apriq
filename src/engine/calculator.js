import {
  getRate, QUALITY, SITE_ACCESS, PROJECT_TYPE,
  RENOVATION_COMPLEXITY, COMPLEXITY, LAND_PROCUREMENT, LAND_SLOPE, BREAKDOWN_ELEMENTS,
} from './rates.js';

function asNumber(v) {
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function calculate(inputs) {
  const {
    use1Category = null, use1Subtype = null, use1Allocation = 1,
    use2Category = null, use2Subtype = null, use2Allocation = 0,
    use3Category = null, use3Subtype = null, use3Allocation = 0,
    floorArea = 0, complexityKey = 'Low Complexity', siteAccessKey = 'Urban Setting',
    projectTypeKey = 'New', renovationArea = 0, renovationComplexityKey = 'Low',
    qualityKey = 'Medium', contingencyPct = 0.10, profitPct = 0.10,
    preliminariesPct = 0.05, feesPct = 0.12, vatPct = 0.15,
    landProcurementType = 'N/A', landArea = 0, landSlopeKey = 'Flat Land (0-5%)',
    escalationRate = 7, estimatedStartDate = null, includeEscalation = false,
    useCustomSplit = false, customElementPcts = null,
    rate1Adjustment = 0, rate2Adjustment = 0, rate3Adjustment = 0,
  } = inputs;

  const rate1Raw = getRate(use1Category, use1Subtype);
  const rate2Raw = getRate(use2Category, use2Subtype);
  const rate3Raw = getRate(use3Category, use3Subtype);

  const rate1 = rate1Raw * (1 + rate1Adjustment / 100);
  const rate2 = rate2Raw * (1 + rate2Adjustment / 100);
  const rate3 = rate3Raw * (1 + rate3Adjustment / 100);

  const weightedBaseRate = rate1 * use1Allocation + rate2 * use2Allocation + rate3 * use3Allocation;

  const allocationTotal = use1Allocation + use2Allocation + use3Allocation;
  const allocationCheck = Math.abs(allocationTotal - 1) < 0.0001 ? 'OK' : 'ERROR';

  const qualityMultiplier     = QUALITY[qualityKey]?.multiplier ?? 1;
  const siteMultiplier        = SITE_ACCESS[siteAccessKey]?.multiplier ?? 1;
  const projectTypeMultiplier = PROJECT_TYPE[projectTypeKey]?.multiplier ?? 1;
  const renovationMultiplier  = RENOVATION_COMPLEXITY[renovationComplexityKey]?.multiplier ?? 1;
  const complexityMultiplier  = COMPLEXITY[complexityKey]?.multiplier ?? 1;

  // Core fix: totalAdjustedBaseRate = weightedBaseRate x multipliers ONLY
  // elementScopeRatio removed — element pcts apply to cost display only, not the rate
  // Blended multiplier — weighted additive stack (replaces compounded multiplication)
  // Quality influence: 1.00 | Complexity influence: 0.75 | Site influence: 0.50
  const blendedMultiplier = 1
    + (qualityMultiplier - 1) * 1.00
    + (complexityMultiplier - 1) * 0.75
    + (siteMultiplier - 1) * 0.50;
  const totalAdjustedBaseRate = weightedBaseRate * blendedMultiplier;

  const effectivePcts = (useCustomSplit && customElementPcts) ? customElementPcts : BREAKDOWN_ELEMENTS.map(e => e.pct);
  const customPctTotal = effectivePcts.reduce((s, p) => s + p, 0);
  const customPctOk = Math.abs(customPctTotal - 1) < 0.005;

  let baseConstructionCostNew = 0;
  let baseConstructionCostRenovation = 0;
  let newArea = floorArea;
  let renovArea = 0;

  if (projectTypeKey === 'Renovation') {
    newArea   = Math.max(0, floorArea - renovationArea);
    renovArea = Math.min(renovationArea, floorArea);
    if (newArea > 0)   baseConstructionCostNew        = totalAdjustedBaseRate * newArea;
    if (renovArea > 0) baseConstructionCostRenovation = totalAdjustedBaseRate * renovationMultiplier * renovArea;
  } else {
    newArea   = floorArea;
    renovArea = 0;
    baseConstructionCostNew = totalAdjustedBaseRate * projectTypeMultiplier * floorArea;
  }

  const isManualLand = landProcurementType === 'Manual Input';
  const manualLandRatePerM2 = asNumber(inputs.customLandRatePerM2);
  const manualLandDevPct = asNumber(inputs.manualLandDevelopmentPct);

  const landProcurementRatePerM2 = isManualLand
    ? manualLandRatePerM2
    : (LAND_PROCUREMENT[landProcurementType]?.ratePerM2 ?? 0);

  const landDevelopmentMultiplier = isManualLand
    ? manualLandDevPct
    : (LAND_PROCUREMENT[landProcurementType]?.developmentMultiplier ?? 0);
  const earthworksMultiplier     = LAND_SLOPE[landSlopeKey]?.multiplier ?? 1;

  const constructionCost      = baseConstructionCostNew + baseConstructionCostRenovation;
  const totalConstructionCost = constructionCost;

  // Land procurement (slope multiplier is a land-side uplift)
  const landProcurementCostBase = landProcurementRatePerM2 * landArea;
  const earthworksCost          = landProcurementCostBase * (earthworksMultiplier - 1);
  const landProcurementCost     = landProcurementCostBase * earthworksMultiplier;

  // Land development allowance is based on land procurement cost (after slope uplift)
  const landDevelopmentCost   = landProcurementCost * landDevelopmentMultiplier;

  // Financial additions must apply ONLY to construction cost
  const contingencyAmount  = constructionCost * contingencyPct;
  const contractorProfit   = (constructionCost + contingencyAmount) * profitPct;
  const preliminaries      = (constructionCost + contingencyAmount + contractorProfit) * preliminariesPct;
  const subtotalBeforeFees = constructionCost + contingencyAmount + contractorProfit + preliminaries;
  const professionalFees   = subtotalBeforeFees * feesPct;
  const subtotalExVAT      = subtotalBeforeFees + professionalFees;
  const vatAmount          = subtotalExVAT * vatPct;
  const totalFinancialAdditions = contingencyAmount + contractorProfit + preliminaries + professionalFees + vatAmount;
  const totalLandCost = landProcurementCost + landDevelopmentCost;
  const totalProjectCost = constructionCost + totalFinancialAdditions + totalLandCost;

  // Hidden backend weights — influence Rand distribution only, never exposed in UI
  const ELEMENT_WEIGHTS = [0.55, 0.90, 1.25, 1.05, 1.30, 0.95, 1.45, 1.35, 0.70, 1.40, 0.80];

  // Step 1: weighted_share_i = effectivePct_i x hidden_weight_i
  const weightedShares = BREAKDOWN_ELEMENTS.map((el, i) => {
    const pct = effectivePcts[i] ?? el.pct;
    return pct * (ELEMENT_WEIGHTS[i] ?? 1);
  });

  // Step 2: total_weighted_share = SUM(all weighted_share_i)
  const totalWeightedShare = weightedShares.reduce((s, w) => s + w, 0);

  // Step 3: final_cost_i = (weighted_share_i / total_weighted_share) x constructionCost
  const elementBreakdown = BREAKDOWN_ELEMENTS.map((el, i) => ({
    key:          el.key,
    label:        el.label,
    defaultPct:   el.pct,
    effectivePct: effectivePcts[i] ?? el.pct,
    amount:       totalWeightedShare > 0
                    ? (weightedShares[i] / totalWeightedShare) * constructionCost
                    : 0,
  }));

  let escalationYears = [], escalatedTotal = totalProjectCost, monthsToStart = 0, yearsToStart = 0;
  if (includeEscalation && estimatedStartDate) {
    const now = new Date(), start = new Date(estimatedStartDate);
    monthsToStart = Math.max(0, (start - now) / (1000 * 60 * 60 * 24 * 30.44));
    yearsToStart  = monthsToStart / 12;
    if (yearsToStart >= 1) {
      const wholeYears = Math.floor(yearsToStart), startYear = now.getFullYear();
      for (let i = 1; i <= wholeYears; i++) {
        const total = totalProjectCost * Math.pow(1 + escalationRate / 100, i);
        const prev  = totalProjectCost * Math.pow(1 + escalationRate / 100, i - 1);
        escalationYears.push({ year: i, label: `Year ${i} (${startYear + i})`, total, increment: total - prev });
      }
      escalatedTotal = totalProjectCost * Math.pow(1 + escalationRate / 100, yearsToStart);
    }
  }

  return {
    rate1Raw, rate2Raw, rate3Raw,
    rate1, rate2, rate3,
    rate1Adjustment, rate2Adjustment, rate3Adjustment,
    weightedBaseRate,
    totalAdjustedBaseRate,
    appliedRate: totalAdjustedBaseRate,
    qualityMultiplier, siteMultiplier, projectTypeMultiplier,
    renovationMultiplier, complexityMultiplier,
    allocationTotal, allocationCheck,
    newArea, renovArea,
    baseConstructionCostNew, baseConstructionCostRenovation,
    constructionCost, totalConstructionCost,
    landProcurementRatePerM2,
    landProcurementCost,
    landDevelopmentMultiplier,
    landDevelopmentCost,
    totalLandCost,
    earthworksMultiplier,
    earthworksCost,
    contingencyAmount, contractorProfit, preliminaries,
    subtotalBeforeFees, professionalFees, subtotalExVAT, vatAmount,
    totalFinancialAdditions,
    totalProjectCost,
    escalatedTotal, escalationYears,
    monthsToStart: Math.round(monthsToStart), yearsToStart,
    elementBreakdown, customPctTotal, customPctOk,
  };
}
