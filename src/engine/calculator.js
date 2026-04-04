import {
  getRate,
  QUALITY,
  SITE_ACCESS,
  PROJECT_TYPE,
  RENOVATION_COMPLEXITY,
  COMPLEXITY,
  LAND_PROCUREMENT,
  LAND_SLOPE,
  BREAKDOWN_ELEMENTS,
} from './rates.js';

// ── MAIN CALCULATOR ──────────────────────────────────────────────────────────
// Mirrors the logic in AprIQ_Cost_engine_V6.xlsx exactly.
// All inputs match the Inputs sheet. All outputs match the Summary sheet.

export function calculate(inputs) {
  const {
    // Building mix (up to 3 uses)
    use1Category = null,
    use1Subtype = null,
    use1Allocation = 1,
    use2Category = null,
    use2Subtype = null,
    use2Allocation = 0,
    use3Category = null,
    use3Subtype = null,
    use3Allocation = 0,

    // Project inputs
    floorArea = 0,
    complexityKey = 'Low Complexity',
    siteAccessKey = 'Urban Setting',
    projectTypeKey = 'Renovation',
    renovationArea = 0,
    renovationComplexityKey = 'Low',
    qualityKey = 'Low',

    // Financial inputs
    contingencyPct = 0.10,
    profitPct = 0.10,
    feesPct = 0.12,
    vatPct = 0.15,

    // Land inputs
    landProcurementType = 'N/A',
    landArea = 0,
    landSlopeKey = 'Flat Land (0-5%)',

    // Escalation
    escalationRate = 7,
    estimatedStartDate = null,
  } = inputs;

  // 1. Base rates per use
  const rate1 = getRate(use1Category, use1Subtype);
  const rate2 = getRate(use2Category, use2Subtype);
  const rate3 = getRate(use3Category, use3Subtype);

  // 2. Weighted base rate
  const weightedBaseRate =
    rate1 * use1Allocation +
    rate2 * use2Allocation +
    rate3 * use3Allocation;

  // 3. Allocation validation
  const allocationTotal = use1Allocation + use2Allocation + use3Allocation;
  const allocationCheck = Math.abs(allocationTotal - 1) < 0.0001 ? 'OK' : 'ERROR: Allocations must total 100%';

  // 4. Multipliers
  const qualityMultiplier       = QUALITY[qualityKey]?.multiplier ?? 1;
  const siteMultiplier          = SITE_ACCESS[siteAccessKey]?.multiplier ?? 1;
  const projectTypeMultiplier   = PROJECT_TYPE[projectTypeKey]?.multiplier ?? 1;
  const renovationMultiplier    = projectTypeKey === 'Renovation'
    ? RENOVATION_COMPLEXITY[renovationComplexityKey]?.multiplier ?? 1
    : 1;
  const complexityMultiplier    = COMPLEXITY[complexityKey]?.multiplier ?? 1;

  // 5. Costed areas
  // For renovation: costed area = renovation area; for new/addition: costed area = floor area
  const costedArea = projectTypeKey === 'Renovation' ? renovationArea : floorArea;

  // 6. Base construction costs (kept separate as per Excel)
  const baseConstructionCostNew        = projectTypeKey !== 'Renovation'
    ? weightedBaseRate * qualityMultiplier * siteMultiplier * projectTypeMultiplier * complexityMultiplier * floorArea
    : 0;
  const baseConstructionCostRenovation = projectTypeKey === 'Renovation'
    ? weightedBaseRate * qualityMultiplier * siteMultiplier * renovationMultiplier * complexityMultiplier * renovationArea
    : 0;

  // 7. Land procurement
  const landProcurementRatePerM2 = LAND_PROCUREMENT[landProcurementType]?.ratePerM2 ?? 0;
  const landProcurementCost      = landProcurementRatePerM2 * landArea;

  // 8. Earthworks (slope multiplier applies to earthworks only)
  const earthworksMultiplier = LAND_SLOPE[landSlopeKey]?.multiplier ?? 1;
  // Earthworks cost = land procurement cost adjusted for slope
  const earthworksCost = landProcurementCost * earthworksMultiplier;

  // 9. Non-earthworks construction cost
  const nonEarthworksConstructionCost = baseConstructionCostNew + baseConstructionCostRenovation;

  // 10. Total construction cost
  const totalConstructionCost = nonEarthworksConstructionCost + earthworksCost;

  // 11. Financial stack (mirrors Excel Summary sheet exactly)
  const contingencyAmount  = totalConstructionCost * contingencyPct;
  const contractorProfit   = (totalConstructionCost + contingencyAmount) * profitPct;
  const preliminaries      = (totalConstructionCost + contingencyAmount + contractorProfit) * 0.05; // 5% of subtotal
  const subtotalBeforeFees = totalConstructionCost + contingencyAmount + contractorProfit + preliminaries;
  const professionalFees   = subtotalBeforeFees * feesPct;
  const subtotalExVAT      = subtotalBeforeFees + professionalFees;
  const vatAmount          = subtotalExVAT * vatPct;
  const totalProjectCost   = subtotalExVAT + vatAmount;

  // 12. Escalation
  let escalatedTotal = totalProjectCost;
  let monthsToStart = 0;
  if (estimatedStartDate) {
    const now = new Date();
    const start = new Date(estimatedStartDate);
    monthsToStart = Math.max(0, (start - now) / (1000 * 60 * 60 * 24 * 30.44));
    const yearsToStart = monthsToStart / 12;
    escalatedTotal = totalProjectCost * Math.pow(1 + escalationRate / 100, yearsToStart);
  }

  // 13. Cost breakdown (applied to non-earthworks construction cost)
  const costBreakdown = BREAKDOWN_ELEMENTS.map((el) => ({
    key:    el.key,
    label:  el.label,
    pct:    el.pct,
    amount: nonEarthworksConstructionCost * el.pct,
  }));

  return {
    // Rates
    rate1, rate2, rate3,
    weightedBaseRate,
    allocationTotal,
    allocationCheck,

    // Multipliers
    qualityMultiplier,
    siteMultiplier,
    projectTypeMultiplier,
    renovationMultiplier,
    complexityMultiplier,

    // Areas
    costedArea,

    // Construction costs
    baseConstructionCostNew,
    baseConstructionCostRenovation,
    earthworksCost,
    nonEarthworksConstructionCost,
    totalConstructionCost,

    // Land
    landProcurementRatePerM2,
    landProcurementCost,
    earthworksMultiplier,

    // Financial stack
    contingencyAmount,
    contractorProfit,
    preliminaries,
    subtotalBeforeFees,
    professionalFees,
    subtotalExVAT,
    vatAmount,
    totalProjectCost,

    // Escalation
    escalatedTotal,
    monthsToStart: Math.round(monthsToStart),

    // Breakdown
    costBreakdown,
  };
}
