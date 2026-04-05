import {
  getRate, QUALITY, SITE_ACCESS, PROJECT_TYPE, RENOVATION_COMPLEXITY,
  COMPLEXITY, LAND_PROCUREMENT, LAND_SLOPE, BREAKDOWN_ELEMENTS,
} from './rates.js';

export function calculate(inputs) {
  const {
    use1Category = null, use1Subtype = null, use1Allocation = 1,
    use2Category = null, use2Subtype = null, use2Allocation = 0,
    use3Category = null, use3Subtype = null, use3Allocation = 0,
    floorArea = 0, complexityKey = 'Low Complexity', siteAccessKey = 'Urban Setting',
    projectTypeKey = 'New', renovationArea = 0, renovationComplexityKey = 'Low',
    qualityKey = 'Medium', contingencyPct = 0.10, profitPct = 0.10, feesPct = 0.12,
    vatPct = 0.15, landProcurementType = 'N/A', landArea = 0, landSlopeKey = 'Flat Land (0-5%)',
    escalationRate = 7, estimatedStartDate = null, includeEscalation = false,
  } = inputs;

  const rate1 = getRate(use1Category, use1Subtype);
  const rate2 = getRate(use2Category, use2Subtype);
  const rate3 = getRate(use3Category, use3Subtype);
  const weightedBaseRate = rate1 * use1Allocation + rate2 * use2Allocation + rate3 * use3Allocation;
  const allocationTotal = use1Allocation + use2Allocation + use3Allocation;
  const allocationCheck = Math.abs(allocationTotal - 1) < 0.0001 ? 'OK' : 'ERROR: Allocations must total 100%';

  const qualityMultiplier     = QUALITY[qualityKey]?.multiplier ?? 1;
  const siteMultiplier        = SITE_ACCESS[siteAccessKey]?.multiplier ?? 1;
  const projectTypeMultiplier = PROJECT_TYPE[projectTypeKey]?.multiplier ?? 1;
  const renovationMultiplier  = RENOVATION_COMPLEXITY[renovationComplexityKey]?.multiplier ?? 1;
  const complexityMultiplier  = COMPLEXITY[complexityKey]?.multiplier ?? 1;

  let baseConstructionCostNew = 0;
  let baseConstructionCostRenovation = 0;

  if (projectTypeKey === 'Renovation') {
    const newArea = Math.max(0, floorArea - renovationArea);
    const renArea = Math.min(renovationArea, floorArea);
    if (newArea > 0) baseConstructionCostNew = weightedBaseRate * qualityMultiplier * siteMultiplier * complexityMultiplier * newArea;
    if (renArea > 0) baseConstructionCostRenovation = weightedBaseRate * qualityMultiplier * siteMultiplier * renovationMultiplier * complexityMultiplier * renArea;
  } else {
    baseConstructionCostNew = weightedBaseRate * qualityMultiplier * siteMultiplier * projectTypeMultiplier * complexityMultiplier * floorArea;
  }

  const landProcurementRatePerM2 = LAND_PROCUREMENT[landProcurementType]?.ratePerM2 ?? 0;
  const landProcurementCost      = landProcurementRatePerM2 * landArea;
  const earthworksMultiplier     = LAND_SLOPE[landSlopeKey]?.multiplier ?? 1;
  const earthworksCost           = landProcurementCost * earthworksMultiplier;
  const nonEarthworksConstructionCost = baseConstructionCostNew + baseConstructionCostRenovation;
  const totalConstructionCost = nonEarthworksConstructionCost + earthworksCost;

  const contingencyAmount  = totalConstructionCost * contingencyPct;
  const contractorProfit   = (totalConstructionCost + contingencyAmount) * profitPct;
  const preliminaries      = (totalConstructionCost + contingencyAmount + contractorProfit) * 0.05;
  const subtotalBeforeFees = totalConstructionCost + contingencyAmount + contractorProfit + preliminaries;
  const professionalFees   = subtotalBeforeFees * feesPct;
  const subtotalExVAT      = subtotalBeforeFees + professionalFees;
  const vatAmount          = subtotalExVAT * vatPct;
  const totalProjectCost   = subtotalExVAT + vatAmount;

  let escalationYears = [];
  let escalatedTotal = totalProjectCost;
  let monthsToStart = 0, yearsToStart = 0;

  if (includeEscalation && estimatedStartDate) {
    const now = new Date();
    const start = new Date(estimatedStartDate);
    monthsToStart = Math.max(0, (start - now) / (1000 * 60 * 60 * 24 * 30.44));
    yearsToStart = monthsToStart / 12;
    if (yearsToStart >= 1) {
      const wholeYears = Math.floor(yearsToStart);
      const startYear = now.getFullYear();
      for (let i = 1; i <= wholeYears; i++) {
        const total = totalProjectCost * Math.pow(1 + escalationRate / 100, i);
        const prevTotal = i === 1 ? totalProjectCost : totalProjectCost * Math.pow(1 + escalationRate / 100, i - 1);
        escalationYears.push({ year: i, label: 'Year ' + i + ' (' + (startYear + i) + ')', total, increment: total - prevTotal });
      }
      escalatedTotal = totalProjectCost * Math.pow(1 + escalationRate / 100, yearsToStart);
    }
  }

  const costBreakdown = BREAKDOWN_ELEMENTS.map(el => ({ key: el.key, label: el.label, pct: el.pct, amount: nonEarthworksConstructionCost * el.pct }));

  return {
    rate1, rate2, rate3, weightedBaseRate, allocationTotal, allocationCheck,
    qualityMultiplier, siteMultiplier, projectTypeMultiplier, renovationMultiplier, complexityMultiplier,
    baseConstructionCostNew, baseConstructionCostRenovation, earthworksCost,
    nonEarthworksConstructionCost, totalConstructionCost, landProcurementRatePerM2,
    landProcurementCost, earthworksMultiplier, contingencyAmount, contractorProfit,
    preliminaries, subtotalBeforeFees, professionalFees, subtotalExVAT, vatAmount, totalProjectCost,
    escalatedTotal, escalationYears, monthsToStart: Math.round(monthsToStart), yearsToStart, costBreakdown,
  };
}