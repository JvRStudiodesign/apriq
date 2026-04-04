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

test('Rate: Single Dwelling = 12000', () => {
  assert(getRate('Residential', 'Single Dwelling') === 12000, 'Got: ' + getRate('Residential', 'Single Dwelling'));
});

test('Rate: Grade A Offices = 16500', () => {
  assert(getRate('Office', 'Grade A Offices') === 16500, 'Got: ' + getRate('Office', 'Grade A Offices'));
});

test('Rate: Unknown returns 0', () => {
  assert(getRate('Unknown', 'Unknown') === 0, 'Should return 0');
});

test('Breakdown pcts total <= 1', () => {
  const total = BREAKDOWN_ELEMENTS.reduce((s, el) => s + el.pct, 0);
  assert(total <= 1.0001, 'Total: ' + total);
});

test('Basic new build: Single Dwelling 200m2', () => {
  const result = calculate({
    use1Category: 'Residential', use1Subtype: 'Single Dwelling', use1Allocation: 1,
    floorArea: 200, projectTypeKey: 'New', qualityKey: 'Medium',
    siteAccessKey: 'Urban Setting', complexityKey: 'Low Complexity',
    contingencyPct: 0.10, profitPct: 0.10, feesPct: 0.12, vatPct: 0.15,
    landProcurementType: 'N/A', landArea: 0, landSlopeKey: 'Flat Land (0-5%)',
  });
  assert(result.baseConstructionCostNew === 2400000, 'Base: ' + result.baseConstructionCostNew);
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

test('Weighted base rate: 60% Residential + 40% Retail', () => {
  const result = calculate({
    use1Category: 'Residential', use1Subtype: 'Single Dwelling', use1Allocation: 0.6,
    use2Category: 'Retail', use2Subtype: 'Strip Mall', use2Allocation: 0.4,
    floorArea: 100, projectTypeKey: 'New', qualityKey: 'Medium',
    siteAccessKey: 'Urban Setting', complexityKey: 'Low Complexity',
  });
  const expected = 12000 * 0.6 + 14000 * 0.4;
  assert(approx(result.weightedBaseRate, expected), 'Got: ' + result.weightedBaseRate + ' expected: ' + expected);
});

test('Renovation: uses renovationArea not floorArea', () => {
  const result = calculate({
    use1Category: 'Residential', use1Subtype: 'Single Dwelling', use1Allocation: 1,
    floorArea: 500, renovationArea: 100, projectTypeKey: 'Renovation',
    renovationComplexityKey: 'Low', qualityKey: 'Medium',
    siteAccessKey: 'Urban Setting', complexityKey: 'Low Complexity',
  });
  assert(result.baseConstructionCostNew === 0, 'New cost should be 0');
  assert(result.baseConstructionCostRenovation > 0, 'Renovation cost > 0');
  assert(result.costedArea === 100, 'Costed area should be 100');
});

test('Steep slope increases earthworks but not construction cost', () => {
  const base = {
    use1Category: 'Residential', use1Subtype: 'Single Dwelling', use1Allocation: 1,
    floorArea: 200, projectTypeKey: 'New', qualityKey: 'Medium',
    siteAccessKey: 'Urban Setting', complexityKey: 'Low Complexity',
    landProcurementType: 'Fully Serviced Land', landArea: 500
  };
  const flat  = calculate({ ...base, landSlopeKey: 'Flat Land (0-5%)' });
  const steep = calculate({ ...base, landSlopeKey: 'Steep / Hilly Land (15%+)' });
  assert(steep.earthworksCost > flat.earthworksCost, 'Steep should cost more');
  assert(steep.baseConstructionCostNew === flat.baseConstructionCostNew, 'Construction unchanged');
});

test('Financial stack order: total > exVAT > beforeFees > construction', () => {
  const result = calculate({
    use1Category: 'Office', use1Subtype: 'Grade A Offices', use1Allocation: 1,
    floorArea: 1000, projectTypeKey: 'New', qualityKey: 'High',
    siteAccessKey: 'Urban Setting', complexityKey: 'Medium Complexity',
    contingencyPct: 0.10, profitPct: 0.10, feesPct: 0.12, vatPct: 0.15,
  });
  assert(result.totalProjectCost > result.subtotalExVAT, 'Total > exVAT');
  assert(result.subtotalExVAT > result.subtotalBeforeFees, 'exVAT > beforeFees');
  assert(result.subtotalBeforeFees > result.totalConstructionCost, 'beforeFees > construction');
});

console.log(`\nResults: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
if (failed > 0) process.exit(1);
