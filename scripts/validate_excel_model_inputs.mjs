import { calculate } from '../src/engine/calculator.js';

// Deterministic validation scenario (no escalation because JS depends on "now")
const inputs = {
  use1Category: 'Residential',
  use1Subtype: 'Single Dwelling',
  use1Allocation: 0.65,
  use2Category: 'Retail',
  use2Subtype: 'Community Shopping Centre',
  use2Allocation: 0.35,
  use3Category: null,
  use3Subtype: null,
  use3Allocation: 0,
  floorArea: 4200,
  complexityKey: 'Medium Complexity',
  siteAccessKey: 'Suburban Setting',
  projectTypeKey: 'New',
  renovationArea: 0,
  renovationComplexityKey: 'Low',
  qualityKey: 'High',
  contingencyPct: 0.10,
  profitPct: 0.10,
  preliminariesPct: 0.05,
  feesPct: 0.12,
  vatPct: 0.15,
  landProcurementType: 'Partially Serviced Land',
  landArea: 8000,
  landSlopeKey: 'Moderately Sloped Land (5-15%)',
  includeEscalation: false,
  escalationRate: 7,
  estimatedStartDate: null,
  useCustomSplit: false,
  customElementPcts: null,
  rate1Adjustment: 0,
  rate2Adjustment: 0,
  rate3Adjustment: 0,
};

const out = calculate(inputs);
console.log(JSON.stringify({ inputs, outputs: {
  weightedBaseRate: out.weightedBaseRate,
  blendedMultiplier: (out.totalAdjustedBaseRate / out.weightedBaseRate),
  totalAdjustedBaseRate: out.totalAdjustedBaseRate,
  baseConstructionCostNew: out.baseConstructionCostNew,
  baseConstructionCostRenovation: out.baseConstructionCostRenovation,
  constructionCost: out.constructionCost,
  totalFinancialAdditions: out.totalFinancialAdditions,
  totalLandCost: out.totalLandCost,
  totalProjectCost: out.totalProjectCost,
  // breakdown integrity checks
  breakdownSum: out.elementBreakdown.reduce((s, e) => s + e.amount, 0),
}}, null, 2));

