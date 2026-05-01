// AprIQ Calculation Engine — Test Suite
// Run with: node --experimental-vm-modules src/engine/test.js
import { calculate } from './calculator.js';
import { getRate, BREAKDOWN_ELEMENTS } from './rates.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); console.log('✅ PASS:', name); passed++; }
  catch (e) { console.log('❌ FAIL:', name, '—', e.message); failed++; }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function approx(a, b, tolerance = 1) {
  return Math.abs(a - b) <= tolerance;
}

// ── Rate table tests ──────────────────────────────────────────────────────────

test('Rate: Single Dwelling = 9400', () => {
  assert(getRate('Residential', 'Single Dwelling') === 9400, 'Got: ' + getRate('Residential', 'Single Dwelling'));
});

test('Rate: Grade A Offices = 13900', () => {
  assert(getRate('Office', 'Grade A Offices') === 13900, 'Got: ' + getRate('Office', 'Grade A Offices'));
});

test('Rate: Budget Hotel = 22400 (stripped rate)', () => {
  assert(getRate('Hospitality', 'Budget Hotel') === 22400, 'Got: ' + getRate('Hospitality', 'Budget Hotel'));
});

test('Rate: Private Hospital = 39200 (stripped rate)', () => {
  assert(getRate('Healthcare', 'Private Hospital') === 39200, 'Got: ' + getRate('Healthcare', 'Private Hospital'));
});

test('Rate: Internal Renovation Full — Residential = 7000', () => {
  assert(getRate('Internal renovation', 'Residential') === 7000, 'Got: ' + getRate('Internal renovation', 'Residential'));
});

test('Rate: Internal Renovation Light — Residential = 2500', () => {
  assert(getRate('Internal Renovation - Light', 'Residential') === 2500, 'Got: ' + getRate('Internal Renovation - Light', 'Residential'));
});

test('Rate: Unknown returns 0', () => {
  assert(getRate('Unknown', 'Unknown') === 0, 'Should return 0');
});

// ── Breakdown elements ────────────────────────────────────────────────────────

test('Breakdown has exactly 10 elements (P&Gs removed)', () => {
  assert(BREAKDOWN_ELEMENTS.length === 10, 'Count: ' + BREAKDOWN_ELEMENTS.length);
});

test('Breakdown pcts total 1.00 (no P&Gs)', () => {
  const total = BREAKDOWN_ELEMENTS.reduce((s, el) => s + el.pct, 0);
  assert(Math.abs(total - 1.0) < 0.001, 'Total: ' + total);
});

test('Breakdown has no P&Gs element', () => {
  const hasPgs = BREAKDOWN_ELEMENTS.some(el => el.key === 'pgs');
  assert(!hasPgs, 'P&Gs should not be in breakdown');
});

// ── Basic calculations ────────────────────────────────────────────────────────

test('Basic new build: Single Dwelling 200m²', () => {
  const result = calculate({
    use1Category: 'Residential', use1Subtype: 'Single Dwelling', use1Allocation: 1,
    floorArea: 200, projectTypeKey: 'New', qualityKey: 'Medium',
    siteAccessKey: 'Urban Setting', complexityKey: 'Low Complexity',
    contingencyPct: 0.10, profitPct: 0.10, preliminariesPct: 0.12,
    feesPct: 0.12, vatPct: 0.15,
    landProcurementType: 'N/A', landArea: 0, landSlopeKey: 'Flat Land (0-5%)',
  });
  assert(approx(result.baseConstructionCostNew, 9400 * 200), 'Base: ' + result.baseConstructionCostNew);
  assert(result.totalProjectCost > result.baseConstructionCostNew, 'Total > base');
});

test('Allocation OK when totals 1', () => {
  const result = calculate({
    use1Category: 'Residential', use1Subtype: 'Single Dwelling', use1Allocation: 0.6,
    use2Category: 'Retail', use2Subtype: 'Strip Mall', use2Allocation: 0.4,
    floorArea: 500, projectTypeKey: 'New', qualityKey: 'Medium',
    siteAccessKey: 'Urban Setting', complexityKey: 'Low Complexity',
  });
  assert(result.allocationCheck === 'OK', result.allocationCheck);
});

test('Allocation ERROR when not totaling 1', () => {
  const result = calculate({
    use1Category: 'Residential', use1Subtype: 'Single Dwelling', use1Allocation: 0.5,
    use2Category: 'Retail', use2Subtype: 'Strip Mall', use2Allocation: 0.4,
    floorArea: 500, projectTypeKey: 'New', qualityKey: 'Medium',
    siteAccessKey: 'Urban Setting', complexityKey: 'Low Complexity',
  });
  assert(result.allocationCheck !== 'OK', 'Should flag error');
});

test('Weighted base rate: 60% Residential + 40% Retail Strip Mall', () => {
  const result = calculate({
    use1Category: 'Residential', use1Subtype: 'Single Dwelling', use1Allocation: 0.6,
    use2Category: 'Retail', use2Subtype: 'Strip Mall', use2Allocation: 0.4,
    floorArea: 100, projectTypeKey: 'New', qualityKey: 'Medium',
    siteAccessKey: 'Urban Setting', complexityKey: 'Low Complexity',
  });
  const expected = 9400 * 0.6 + 9800 * 0.4;
  assert(approx(result.weightedBaseRate, expected, 5), 'Got: ' + result.weightedBaseRate + ' expected: ' + expected);
});

// ── Renovation logic ──────────────────────────────────────────────────────────

test('Full Renovation: renovArea gets complexity multiplier, newArea gets 1.0', () => {
  const result = calculate({
    use1Category: 'Residential', use1Subtype: 'Single Dwelling', use1Allocation: 1,
    floorArea: 300, renovationArea: 100, projectTypeKey: 'Renovation',
    renovationComplexityKey: 'Low', qualityKey: 'Medium',
    siteAccessKey: 'Urban Setting', complexityKey: 'Low Complexity',
  });
  // newArea = 300 - 100 = 200; renovArea = 100
  assert(result.newArea === 200, 'New area should be 200, got: ' + result.newArea);
  assert(result.renovArea === 100, 'Reno area should be 100, got: ' + result.renovArea);
  assert(result.baseConstructionCostNew > 0, 'New area should have cost');
  assert(result.baseConstructionCostRenovation > 0, 'Renovation area should have cost');
  // Reno cost should be higher per m² than new cost due to 1.10 multiplier
  const newPerM2 = result.baseConstructionCostNew / result.newArea;
  const renovPerM2 = result.baseConstructionCostRenovation / result.renovArea;
  assert(renovPerM2 > newPerM2, 'Reno per m² should exceed new per m²');
});

test('Full Renovation: all area renovation when renovArea = floorArea', () => {
  const result = calculate({
    use1Category: 'Residential', use1Subtype: 'Single Dwelling', use1Allocation: 1,
    floorArea: 100, renovationArea: 100, projectTypeKey: 'Renovation',
    renovationComplexityKey: 'Low', qualityKey: 'Medium',
    siteAccessKey: 'Urban Setting', complexityKey: 'Low Complexity',
  });
  assert(result.baseConstructionCostNew === 0, 'New cost should be 0 when all area is renovation');
  assert(result.baseConstructionCostRenovation > 0, 'Renovation cost > 0');
});

test('Addition applies 1.20 multiplier', () => {
  const newBuild = calculate({
    use1Category: 'Office', use1Subtype: 'Grade A Offices', use1Allocation: 1,
    floorArea: 500, projectTypeKey: 'New', qualityKey: 'Medium',
    siteAccessKey: 'Urban Setting', complexityKey: 'Low Complexity',
  });
  const addition = calculate({
    use1Category: 'Office', use1Subtype: 'Grade A Offices', use1Allocation: 1,
    floorArea: 500, projectTypeKey: 'Addition', qualityKey: 'Medium',
    siteAccessKey: 'Urban Setting', complexityKey: 'Low Complexity',
  });
  assert(approx(addition.baseConstructionCostNew / newBuild.baseConstructionCostNew, 1.20, 0.01),
    'Addition should be 1.20× new build. Ratio: ' + (addition.baseConstructionCostNew / newBuild.baseConstructionCostNew));
});

// ── Slope / land ──────────────────────────────────────────────────────────────

test('Steep slope increases earthworks cost but not construction cost', () => {
  const base = {
    use1Category: 'Residential', use1Subtype: 'Single Dwelling', use1Allocation: 1,
    floorArea: 200, projectTypeKey: 'New', qualityKey: 'Medium',
    siteAccessKey: 'Urban Setting', complexityKey: 'Low Complexity',
    landProcurementType: 'Fully Serviced Land', landArea: 500,
  };
  const flat  = calculate({ ...base, landSlopeKey: 'Flat Land (0-5%)' });
  const steep = calculate({ ...base, landSlopeKey: 'Steep / Hilly Land (15%+)' });
  assert(steep.earthworksCost > flat.earthworksCost, 'Steep should cost more in earthworks');
  assert(steep.baseConstructionCostNew === flat.baseConstructionCostNew, 'Construction unchanged by slope');
});

test('Very Steep slope (new) applies 1.50 multiplier', () => {
  const base = {
    use1Category: 'Residential', use1Subtype: 'Single Dwelling', use1Allocation: 1,
    floorArea: 200, projectTypeKey: 'New', qualityKey: 'Medium',
    siteAccessKey: 'Urban Setting', complexityKey: 'Low Complexity',
    landProcurementType: 'Fully Serviced Land', landArea: 500,
  };
  const flat      = calculate({ ...base, landSlopeKey: 'Flat Land (0-5%)' });
  const verysteep = calculate({ ...base, landSlopeKey: 'Very Steep Land (30%+)' });
  assert(approx(verysteep.earthworksMultiplier, 1.50, 0.01), 'Very Steep multiplier should be 1.50');
  assert(verysteep.earthworksCost > flat.earthworksCost, 'Very steep should exceed flat');
});

// ── Financial stack ───────────────────────────────────────────────────────────

test('Financial stack order: total > exVAT > beforeFees > construction', () => {
  const result = calculate({
    use1Category: 'Office', use1Subtype: 'Grade A Offices', use1Allocation: 1,
    floorArea: 1000, projectTypeKey: 'New', qualityKey: 'High',
    siteAccessKey: 'Urban Setting', complexityKey: 'Medium Complexity',
    contingencyPct: 0.10, profitPct: 0.10, preliminariesPct: 0.12,
    feesPct: 0.12, vatPct: 0.15,
  });
  assert(result.totalProjectCost > result.subtotalExVAT, 'Total > exVAT');
  assert(result.subtotalExVAT > result.subtotalBeforeFees, 'exVAT > beforeFees');
  assert(result.subtotalBeforeFees > result.totalConstructionCost, 'beforeFees > construction');
});

test('Prelims default is 12% (naked rate model)', () => {
  const result = calculate({
    use1Category: 'Residential', use1Subtype: 'Single Dwelling', use1Allocation: 1,
    floorArea: 100, projectTypeKey: 'New', qualityKey: 'Medium',
    siteAccessKey: 'Urban Setting', complexityKey: 'Low Complexity',
  });
  // With default prelims 12%, preliminaries = constructionCost * (1+contingency) * (1+profit) * 0.12
  // Just verify it's substantially larger than the old 5% figure
  assert(result.preliminaries > result.totalConstructionCost * 0.10,
    'Prelims should reflect 12% default, got: ' + result.preliminaries);
});

test('Quality multipliers: Premium > High > Medium > Low', () => {
  const make = (q) => calculate({
    use1Category: 'Office', use1Subtype: 'Grade A Offices', use1Allocation: 1,
    floorArea: 500, projectTypeKey: 'New', qualityKey: q,
    siteAccessKey: 'Urban Setting', complexityKey: 'Low Complexity',
  });
  const low = make('Low'); const med = make('Medium');
  const high = make('High'); const prem = make('Premium');
  assert(prem.totalProjectCost > high.totalProjectCost, 'Premium > High');
  assert(high.totalProjectCost > med.totalProjectCost, 'High > Medium');
  assert(med.totalProjectCost > low.totalProjectCost, 'Medium > Low');
});

// ── New categories ────────────────────────────────────────────────────────────

test('Internal Renovation Light rates are ~35% of Full rates', () => {
  const fullRes = getRate('Internal renovation', 'Residential');
  const lightRes = getRate('Internal Renovation - Light', 'Residential');
  const ratio = lightRes / fullRes;
  assert(ratio > 0.30 && ratio < 0.45, 'Light/Full ratio should be ~35%, got: ' + ratio.toFixed(2));
});

test('Cold Storage Freezer rate exists and is higher than Warehouse', () => {
  const cold = getRate('Industrial', 'Cold Storage (Freezer -25°C)');
  const wh   = getRate('Industrial', 'Warehouse');
  assert(cold > wh * 2, 'Cold storage should be >2× warehouse rate');
});

test('Data Centre Tier III > Tier II', () => {
  const t2 = getRate('Special / Complex', 'Data Centre (Tier II)');
  const t3 = getRate('Special / Complex', 'Data Centre (Tier III)');
  assert(t3 > t2, 'Tier III should exceed Tier II');
});

console.log(`\nResults: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
if (failed > 0) process.exit(1);
