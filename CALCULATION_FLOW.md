## AprIQ Calculation Flow Document (Source of Truth)

This document captures the **exact** calculation sequence used by AprIQ, derived from:

- `src/engine/calculator.js` → `calculate(inputs)`
- `src/engine/rates.js` → base rates, multipliers, land assumptions, breakdown elements

For modelling purposes, treat `src/engine/calculator.js` as the **production source of truth**.

---

## 1) Inputs (fields consumed)

The following fields are destructured by `calculate(inputs)` in `src/engine/calculator.js`:

- **Use categories (up to 3)**
  - `use1Category`, `use1Subtype`, `use1Allocation`
  - `use2Category`, `use2Subtype`, `use2Allocation`
  - `use3Category`, `use3Subtype`, `use3Allocation`
- **Areas**
  - `floorArea`
  - `renovationArea`
- **Multipliers / selector keys**
  - `qualityKey` (maps to `QUALITY`)
  - `complexityKey` (maps to `COMPLEXITY`)
  - `siteAccessKey` (maps to `SITE_ACCESS`)
  - `projectTypeKey` (maps to `PROJECT_TYPE`)
  - `renovationComplexityKey` (maps to `RENOVATION_COMPLEXITY`)
  - `landProcurementType` (maps to `LAND_PROCUREMENT`)
  - `landSlopeKey` (maps to `LAND_SLOPE`)
- **Financial additions (fractions, not % points)**
  - `contingencyPct`
  - `profitPct`
  - `preliminariesPct`
  - `feesPct`
  - `vatPct`
- **Land**
  - `landArea`
  - `customLandRatePerM2` (only used when `landProcurementType === 'Manual Input'`)
  - `manualLandDevelopmentPct` (only used when `landProcurementType === 'Manual Input'`)
- **Escalation**
  - `includeEscalation` (boolean)
  - `escalationRate` (percent per annum, e.g. `7`)
  - `estimatedStartDate` (date string)
- **Element split**
  - `useCustomSplit` (boolean)
  - `customElementPcts` (array of 11 fractions)
- **Per-use rate adjustments (percent points)**
  - `rate1Adjustment`, `rate2Adjustment`, `rate3Adjustment`

---

## 2) Source tables / constants

From `src/engine/rates.js`:

- **Base rates**: `BUILDING_RATES[category].subtypes[subtype].rate` (ZAR/m²)
- **Multipliers**
  - `QUALITY[key].multiplier`
  - `COMPLEXITY[key].multiplier`
  - `SITE_ACCESS[key].multiplier`
  - `PROJECT_TYPE[key].multiplier`
  - `RENOVATION_COMPLEXITY[key].multiplier`
  - `LAND_SLOPE[key].multiplier`
- **Land procurement**
  - `LAND_PROCUREMENT[type].ratePerM2`
  - `LAND_PROCUREMENT[type].developmentMultiplier`
- **Default breakdown elements** (11): `BREAKDOWN_ELEMENTS[i].pct` (fractions summing to 1)

From `src/engine/calculator.js`:

- **Hidden element weights** (length 11; affects *Rand distribution only*):
  - `ELEMENT_WEIGHTS = [0.55, 0.90, 1.25, 1.05, 1.30, 0.95, 1.45, 1.35, 0.70, 1.40, 0.80]`

---

## 3) Calculation sequence (order matters)

All steps below are within `calculate(inputs)` in `src/engine/calculator.js`.

### 3.1 Base rates + per-use adjustments

1. **Raw rates**:
   - `rate1Raw = getRate(use1Category, use1Subtype)`
   - `rate2Raw = getRate(use2Category, use2Subtype)`
   - `rate3Raw = getRate(use3Category, use3Subtype)`

2. **Adjusted rates** (percent-point adjustments):
   - `rate1 = rate1Raw * (1 + rate1Adjustment/100)`
   - `rate2 = rate2Raw * (1 + rate2Adjustment/100)`
   - `rate3 = rate3Raw * (1 + rate3Adjustment/100)`

3. **Weighted base rate** (allocations are fractions):
   - `weightedBaseRate = rate1*use1Allocation + rate2*use2Allocation + rate3*use3Allocation`

4. **Allocation check**:
   - `allocationTotal = use1Allocation + use2Allocation + use3Allocation`
   - `allocationCheck = (ABS(allocationTotal - 1) < 0.0001) ? "OK" : "ERROR"`

### 3.2 Multipliers → blended multiplier → adjusted base rate

Multipliers are looked up with safe defaults of 1:

- `qualityMultiplier = QUALITY[qualityKey]?.multiplier ?? 1`
- `complexityMultiplier = COMPLEXITY[complexityKey]?.multiplier ?? 1`
- `siteMultiplier = SITE_ACCESS[siteAccessKey]?.multiplier ?? 1`
- `projectTypeMultiplier = PROJECT_TYPE[projectTypeKey]?.multiplier ?? 1`
- `renovationMultiplier = RENOVATION_COMPLEXITY[renovationComplexityKey]?.multiplier ?? 1`

**Important**: AprIQ uses a **blended additive multiplier stack**, not a compounded product:

- `blendedMultiplier = 1 + (qualityMultiplier-1)*1.00 + (complexityMultiplier-1)*0.75 + (siteMultiplier-1)*0.50`

Then:

- `totalAdjustedBaseRate = weightedBaseRate * blendedMultiplier`

### 3.3 Construction cost split: New vs Renovation

Let:

- `constructionCost = baseConstructionCostNew + baseConstructionCostRenovation`

If `projectTypeKey === "Renovation"`:

- `newArea = MAX(0, floorArea - renovationArea)`
- `renovArea = MIN(renovationArea, floorArea)`
- `baseConstructionCostNew = totalAdjustedBaseRate * newArea` (no projectType multiplier in this branch)
- `baseConstructionCostRenovation = totalAdjustedBaseRate * renovationMultiplier * renovArea`

Else (all non-renovation project types):

- `newArea = floorArea`
- `renovArea = 0`
- `baseConstructionCostNew = totalAdjustedBaseRate * projectTypeMultiplier * floorArea`
- `baseConstructionCostRenovation = 0`

And:

- `totalConstructionCost = constructionCost` (currently identical)

### 3.4 Land costs (procurement + slope uplift + development allowance)

Manual land logic:

- `isManualLand = (landProcurementType === "Manual Input")`
- `manualLandRatePerM2 = asNumber(customLandRatePerM2)`
- `manualLandDevPct = asNumber(manualLandDevelopmentPct)` (NOTE: this is a fraction like 0.15)

Land procurement rate per m²:

- `landProcurementRatePerM2 = isManualLand ? manualLandRatePerM2 : LAND_PROCUREMENT[type].ratePerM2`

Land development multiplier:

- `landDevelopmentMultiplier = isManualLand ? manualLandDevPct : LAND_PROCUREMENT[type].developmentMultiplier`

Slope multiplier:

- `earthworksMultiplier = LAND_SLOPE[landSlopeKey].multiplier`

Land costs:

- `landProcurementCostBase = landProcurementRatePerM2 * landArea`
- `earthworksCost = landProcurementCostBase * (earthworksMultiplier - 1)` (reported separately)
- `landProcurementCost = landProcurementCostBase * earthworksMultiplier`
- `landDevelopmentCost = landProcurementCost * landDevelopmentMultiplier`
- `totalLandCost = landProcurementCost + landDevelopmentCost`

### 3.5 Financial additions (applied to construction cost only)

All additions stack sequentially:

- `contingencyAmount = constructionCost * contingencyPct`
- `contractorProfit = (constructionCost + contingencyAmount) * profitPct`
- `preliminaries = (constructionCost + contingencyAmount + contractorProfit) * preliminariesPct`
- `subtotalBeforeFees = constructionCost + contingencyAmount + contractorProfit + preliminaries`
- `professionalFees = subtotalBeforeFees * feesPct`
- `subtotalExVAT = subtotalBeforeFees + professionalFees`
- `vatAmount = subtotalExVAT * vatPct`

Rollups:

- `totalFinancialAdditions = contingencyAmount + contractorProfit + preliminaries + professionalFees + vatAmount`
- `totalProjectCost = constructionCost + totalFinancialAdditions + totalLandCost`

### 3.6 Elemental breakdown (weighted Rand distribution)

Element % inputs:

- If `(useCustomSplit && customElementPcts)`, then `effectivePcts = customElementPcts`
- Else `effectivePcts = BREAKDOWN_ELEMENTS.map(e => e.pct)`

Validation (tolerant):

- `customPctTotal = SUM(effectivePcts)`
- `customPctOk = ABS(customPctTotal - 1) < 0.005`

Weighted distribution (critical: **NOT equal split**; also **NOT simple pct*constructionCost**):

1. `weightedShare_i = effectivePct_i * ELEMENT_WEIGHTS[i]`
2. `totalWeightedShare = SUM(weightedShare_i)`
3. `amount_i = (weightedShare_i / totalWeightedShare) * constructionCost` (if denominator > 0)

### 3.7 Escalation (optional)

Escalation is applied to **totalProjectCost** (construction + additions + land).

Only applies if `includeEscalation && estimatedStartDate`:

- `monthsToStart = MAX(0, (startDate - now) / (1000*60*60*24*30.44))`
- `yearsToStart = monthsToStart / 12`

If `yearsToStart >= 1`:

- For each whole year \(i = 1..FLOOR(yearsToStart)\):
  - `yearTotal_i = totalProjectCost * (1 + escalationRate/100)^i`
  - `prevTotal_i = totalProjectCost * (1 + escalationRate/100)^(i-1)`
  - `increment_i = yearTotal_i - prevTotal_i`
- Continuous escalation total:
  - `escalatedTotal = totalProjectCost * (1 + escalationRate/100)^(yearsToStart)`

Else:

- `escalatedTotal = totalProjectCost` (no change)

---

## 4) Known modelling notes / flags

- **Blended multipliers**: Quality/Complexity/Site are blended additively with fixed influences (1.00 / 0.75 / 0.50). This is not a standard compounded multiplier stack.
- **Project type behaviour**: `projectTypeMultiplier` is applied only in the non-renovation branch. Renovation branch computes new vs renovation separately.
- **Element breakdown uses hidden weights**: Users see % splits, but Rand amounts are redistributed using `ELEMENT_WEIGHTS`.
- **Escalation uses JavaScript “now”**: Escalation depends on the exact date/time `calculate()` runs, and uses 30.44 days/month. Excel validation must replicate this to match perfectly.

