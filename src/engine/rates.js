// AprIQ Base Rates — AprIQ Cost Intelligence Platform 2025/26
// All rates in ZAR per m² (GFA) — STRIPPED naked construction cost only
// Materials + labour + specialist subcontractors. No P&G, profit, or overhead embedded.
// Financial additions (prelims, profit, contingency, fees, VAT) are applied separately
// in the calculator financial stack.
// Calibration: SA construction market data 2024/25, Gauteng baseline.
// User may adjust any rate ±30% in Pro mode.

export const BUILDING_RATES = {

  Residential: {
    label: 'Residential',
    subtypes: {
      'Single Dwelling':                                     { label: 'Single Dwelling',                                    rate: 9400  },
      'Luxury Dwelling':                                     { label: 'Luxury Dwelling',                                    rate: 13500 },
      'Townhouses / Cluster Housing':                        { label: 'Townhouses / Cluster Housing',                       rate: 9400  },
      'Apartments (Low Rise)':                               { label: 'Apartments (Low Rise)',                              rate: 9800  },
      'Apartments (Low Rise Prestige)':                      { label: 'Apartments (Low Rise Prestige)',                     rate: 14800 },
      'Apartments (High Rise)':                              { label: 'Apartments (High Rise)',                             rate: 15200 },
      'Apartments (High Rise Prestige)':                     { label: 'Apartments (High Rise Prestige)',                    rate: 19300 },
      'Student Accommodation':                               { label: 'Student Accommodation',                              rate: 13000 },
      'Retirement / Assisted Living':                        { label: 'Retirement / Assisted Living',                       rate: 10200 },
      'Retirement / Assisted Living (Luxury)':               { label: 'Retirement / Assisted Living (Luxury)',              rate: 15200 },
      'Retirement / Frail Care':                             { label: 'Retirement / Frail Care',                            rate: 14400 },
      'Low Cost Housing - High Density (Apartment Blocks)':  { label: 'Low Cost Housing - High Density (Apartment Blocks)', rate: 7800  },
      'Low Cost Housing - Low Density (Single Dwelling)':    { label: 'Low Cost Housing - Low Density (Single Dwelling)',   rate: 4500  },
      'Low Cost Housing - Medium Density (Duplex Clusters)': { label: 'Low Cost Housing - Medium Density (Duplex Clusters)',rate: 8400  },
    },
  },

  Office: {
    label: 'Office',
    subtypes: {
      'Grade A Offices':        { label: 'Grade A Offices',        rate: 13900 },
      'CBD High-Rise Offices':  { label: 'CBD High-Rise Offices',  rate: 14800 },
      'Suburban Offices':       { label: 'Suburban Offices',       rate: 9800  },
      'Corporate Headquarters': { label: 'Corporate Headquarters', rate: 19300 },
      'Mixed-Use Office Space': { label: 'Mixed-Use Office Space', rate: 13900 },
      'Co-working Spaces':      { label: 'Co-working Spaces',      rate: 12700 },
    },
  },

  Retail: {
    label: 'Retail',
    subtypes: {
      'Regional Shopping Mall':        { label: 'Regional Shopping Mall',        rate: 14300 },
      'Community Shopping Centre':     { label: 'Community Shopping Centre',     rate: 11700 },
      'Neighbourhood Centre':          { label: 'Neighbourhood Centre',          rate: 10900 },
      'Strip Mall':                    { label: 'Strip Mall',                    rate: 9800  },
      'Standalone Retail Store':       { label: 'Standalone Retail Store',       rate: 13100 },
      'Supermarket / Hypermarket':     { label: 'Supermarket / Hypermarket',     rate: 13500 },
      'Warehouse Retail / Bulk Retail':{ label: 'Warehouse Retail / Bulk Retail',rate: 9000  },
    },
  },

  Industrial: {
    label: 'Industrial',
    subtypes: {
      'Warehouse':                    { label: 'Warehouse',                    rate: 5100  },
      'Distribution Centre':          { label: 'Distribution Centre',          rate: 8600  },
      'Logistics Hub':                { label: 'Logistics Hub',                rate: 10200 },
      'Light Manufacturing':          { label: 'Light Manufacturing',          rate: 9300  },
      'Heavy Industrial Facility':    { label: 'Heavy Industrial Facility',    rate: 14800 },
      'Industrial Park / Mini Units': { label: 'Industrial Park / Mini Units', rate: 6400  },
      'Dealership / Showroom':        { label: 'Dealership / Showroom',        rate: 11900 },
      'Commercial Vehicle Facility':  { label: 'Commercial Vehicle Facility',  rate: 7800  },
      'Cold Storage (Freezer -25°C)': { label: 'Cold Storage (Freezer -25°C)', rate: 18400 },
      'Cold Storage (Chiller +2°C)':  { label: 'Cold Storage (Chiller +2°C)', rate: 13500 },
    },
  },

  Hospitality: {
    label: 'Hospitality',
    subtypes: {
      'Budget Hotel':        { label: 'Budget Hotel',        rate: 22400 },
      '3-Star Hotel':        { label: '3-Star Hotel',        rate: 25400 },
      '4-Star Hotel':        { label: '4-Star Hotel',        rate: 30800 },
      'Luxury Hotel':        { label: 'Luxury Hotel',        rate: 40000 },
      'Resort':              { label: 'Resort',              rate: 44000 },
      'Lodge':               { label: 'Lodge',               rate: 17600 },
      'Conference Centre':   { label: 'Conference Centre',   rate: 30800 },
      'Entertainment Venue': { label: 'Entertainment Venue', rate: 17600 },
    },
  },

  Healthcare: {
    label: 'Healthcare',
    subtypes: {
      'Private Hospital':             { label: 'Private Hospital',             rate: 39200 },
      'Public Hospital (District)':   { label: 'Public Hospital (District)',   rate: 29600 },
      'Public Hospital (Regional)':   { label: 'Public Hospital (Regional)',   rate: 34000 },
      'Day Clinic':                   { label: 'Day Clinic',                   rate: 35200 },
      'Primary Healthcare Clinic':    { label: 'Primary Healthcare Clinic',    rate: 19200 },
      'Community Health Centre':      { label: 'Community Health Centre',      rate: 22800 },
      'Specialist Medical Centre':    { label: 'Specialist Medical Centre',    rate: 22400 },
      'Laboratory (Diagnostic)':      { label: 'Laboratory (Diagnostic)',      rate: 19200 },
      'Outpatient Facility':          { label: 'Outpatient Facility',          rate: 17600 },
    },
  },

  Education: {
    label: 'Education',
    subtypes: {
      'Primary School':      { label: 'Primary School',      rate: 7900  },
      'Secondary School':    { label: 'Secondary School',    rate: 9000  },
      'University Building': { label: 'University Building', rate: 18800 },
      'Lecture Building':    { label: 'Lecture Building',    rate: 16300 },
      'Student Housing':     { label: 'Student Housing',     rate: 13200 },
      'Training Centre':     { label: 'Training Centre',     rate: 9600  },
      'Nursery':             { label: 'Nursery',             rate: 8200  },
      'Daycare centre':      { label: 'Daycare centre',      rate: 7700  },
      'Kids playground':     { label: 'Kids playground',     rate: 1300  },
    },
  },

  Civic: {
    label: 'Civic',
    subtypes: {
      'Government Office':           { label: 'Government Office',           rate: 9800  },
      'Municipal Building':          { label: 'Municipal Building',          rate: 10200 },
      'Court (Magistrates)':         { label: 'Court (Magistrates)',         rate: 20500 },
      'High Court':                  { label: 'High Court',                  rate: 28700 },
      'Police Station':              { label: 'Police Station',              rate: 19700 },
      'Fire Station':                { label: 'Fire Station',                rate: 18000 },
      'Community Hall / Centre':     { label: 'Community Hall / Centre',     rate: 13900 },
      'Church / Religious Building': { label: 'Church / Religious Building', rate: 13500 },
      'Library':                     { label: 'Library',                     rate: 12300 },
    },
  },

  Transport: {
    label: 'Transport',
    subtypes: {
      'Airport Terminal':                   { label: 'Airport Terminal',                   rate: 34000 },
      'Parking Structure (Multi-Storey)':   { label: 'Parking Structure (Multi-Storey)',   rate: 4600  },
      'Parking (Surface Asphalt)':          { label: 'Parking (Surface Asphalt)',          rate: 750   },
      'Parking (Basement - Non-CBD)':       { label: 'Parking (Basement - Non-CBD)',       rate: 4600  },
      'Parking (Basement - CBD)':           { label: 'Parking (Basement - CBD)',           rate: 7000  },
      'Bus Terminal':                       { label: 'Bus Terminal',                       rate: 14300 },
      'Railway Station':                    { label: 'Railway Station',                    rate: 18000 },
      'Maintenance Depot':                  { label: 'Maintenance Depot',                  rate: 9400  },
      'Taxi Rank / Transport Interchange':  { label: 'Taxi Rank / Transport Interchange',  rate: 11500 },
    },
  },

  'Special / Complex': {
    label: 'Special / Complex',
    subtypes: {
      'Data Centre (Tier II)':                  { label: 'Data Centre (Tier II)',                  rate: 76800 },
      'Data Centre (Tier III)':                 { label: 'Data Centre (Tier III)',                 rate: 122000},
      'Sports Stadium (PSL)':                   { label: 'Sports Stadium (PSL)',                   rate: 14200 },
      'Sports Stadium (FIFA)':                  { label: 'Sports Stadium (FIFA)',                  rate: 19700 },
      'Arena (Indoor)':                         { label: 'Arena (Indoor)',                         rate: 31500 },
      'Prison (Medium Security)':               { label: 'Prison (Medium Security)',               rate: 21600 },
      'Prison (Maximum Security)':              { label: 'Prison (Maximum Security)',              rate: 30800 },
      'Research Laboratory (BSL-2)':            { label: 'Research Laboratory (BSL-2)',            rate: 30000 },
      'Research Laboratory (BSL-3)':            { label: 'Research Laboratory (BSL-3)',            rate: 55100 },
    },
  },

  Commercial: {
    label: 'Commercial',
    subtypes: {
      'Mixed-Use Development':        { label: 'Mixed-Use Development',        rate: 13900 },
      'Business Park':                { label: 'Business Park',                rate: 11100 },
      'Office + Retail Hybrid':       { label: 'Office + Retail Hybrid',       rate: 13500 },
      'Bank / Financial Institution': { label: 'Bank / Financial Institution', rate: 18000 },
      'Call Centre':                  { label: 'Call Centre',                  rate: 9400  },
      'Corporate Campus':             { label: 'Corporate Campus',             rate: 16000 },
    },
  },

  'Ancillary / Minor Works': {
    label: 'Ancillary / Minor Works',
    subtypes: {
      'Carport (Soft Cover)':    { label: 'Carport (Soft Cover)',    rate: 1600  },
      'Carport (Hard Cover)':    { label: 'Carport (Hard Cover)',    rate: 3900  },
      'Boundary Wall':           { label: 'Boundary Wall',           rate: 1700  },
      'Guard House':             { label: 'Guard House',             rate: 7700  },
      'Small Outbuilding':       { label: 'Small Outbuilding',       rate: 6000  },
      'Storage Shed':            { label: 'Storage Shed',            rate: 3300  },
      'Swimming Pool (Concrete)':{ label: 'Swimming Pool (Concrete)',rate: 10400 },
      'Swimming Pool (Fibreglass)':{ label: 'Swimming Pool (Fibreglass)', rate: 6500 },
      'Paving (Standard 50mm)':  { label: 'Paving (Standard 50mm)', rate: 400   },
      'Paving (Heavy Duty 80mm)':{ label: 'Paving (Heavy Duty 80mm)',rate: 650  },
      'Landscaping (Light)':     { label: 'Landscaping (Light)',     rate: 150   },
      'Landscaping (Dense)':     { label: 'Landscaping (Dense)',     rate: 700   },
    },
  },

  'Civil Works': {
    label: 'Civil Works',
    subtypes: {
      'Access Roads (Estate)':       { label: 'Access Roads (Estate)',       rate: 1400  },
      'Parking Areas':               { label: 'Parking Areas',               rate: 1100  },
      'Bulk Earthworks':             { label: 'Bulk Earthworks',             rate: 300   },
      'Stormwater Infrastructure':   { label: 'Stormwater Infrastructure',   rate: 2400  },
      'Sewer Infrastructure':        { label: 'Sewer Infrastructure',        rate: 2900  },
      'Water Reticulation':          { label: 'Water Reticulation',          rate: 2400  },
      'External Services (Combined)':{ label: 'External Services (Combined)',rate: 2400  },
      'Platforms / Terracing':       { label: 'Platforms / Terracing',       rate: 350   },
      'Municipal Urban Road':        { label: 'Municipal Urban Road',        rate: 2400  },
      'Site Clearance / Platform':   { label: 'Site Clearance / Platform',   rate: 130   },
    },
  },

  // Full interior renovation — strip to structure, all finishes replaced,
  // services upgraded, minor layout changes. Naked rate; user ±30% in Pro.
  'Internal renovation': {
    label: 'Internal Renovation — Full',
    subtypes: {
      'Residential':      { label: 'Residential',      rate: 7000  },
      'Office':           { label: 'Office',           rate: 5100  },
      'Retail':           { label: 'Retail',           rate: 6300  },
      'Industrial':       { label: 'Industrial',       rate: 3500  },
      'Hospitality':      { label: 'Hospitality',      rate: 13300 },
      'Healthcare':       { label: 'Healthcare',       rate: 19500 },
      'Education':        { label: 'Education',        rate: 5100  },
      'Civic':            { label: 'Civic',            rate: 7400  },
      'Transport':        { label: 'Transport',        rate: 11700 },
      'Special / Complex':{ label: 'Special / Complex',rate: 29700 },
      'Commercial':       { label: 'Commercial',       rate: 7400  },
    },
  },

  // Light interior renovation — finishes only (tile, paint, ceilings,
  // sanitaryware, light fittings). No structural or services rework.
  // Naked rate; user ±30% in Pro.
  'Internal Renovation - Light': {
    label: 'Internal Renovation — Light',
    subtypes: {
      'Residential':      { label: 'Residential',      rate: 2500  },
      'Office':           { label: 'Office',           rate: 1800  },
      'Retail':           { label: 'Retail',           rate: 2200  },
      'Industrial':       { label: 'Industrial',       rate: 1200  },
      'Hospitality':      { label: 'Hospitality',      rate: 4800  },
      'Healthcare':       { label: 'Healthcare',       rate: 7000  },
      'Education':        { label: 'Education',        rate: 1800  },
      'Civic':            { label: 'Civic',            rate: 2600  },
      'Transport':        { label: 'Transport',        rate: 4200  },
      'Special / Complex':{ label: 'Special / Complex',rate: 10700 },
      'Commercial':       { label: 'Commercial',       rate: 2600  },
    },
  },

};

// ── MULTIPLIERS ───────────────────────────────────────────────────────────────

export const QUALITY = {
  'Low':     { label: 'Low',     multiplier: 0.80 },
  'Medium':  { label: 'Medium',  multiplier: 1.00 },
  'High':    { label: 'High',    multiplier: 1.35 },
  'Premium': { label: 'Premium', multiplier: 1.75 },
};

export const SITE_ACCESS = {
  'Urban Setting':               { label: 'Urban Setting',               multiplier: 1.000 },
  'Suburban Setting':            { label: 'Suburban Setting',            multiplier: 1.050 },
  'Peri-Urban Setting':          { label: 'Peri-Urban Setting',          multiplier: 1.120 },
  'Rural Setting':               { label: 'Rural Setting',               multiplier: 1.250 },
  'Exurban Setting':             { label: 'Exurban Setting',             multiplier: 1.400 },
  'Specialized/Natural Setting': { label: 'Specialized/Natural Setting', multiplier: 1.700 },
};

export const PROJECT_TYPE = {
  'New':        { label: 'New',              multiplier: 1.00 },
  'Renovation': { label: 'Full Renovation',  multiplier: 1.00 }, // label updated; multiplier handled per-area via RENOVATION_COMPLEXITY
  'Addition':   { label: 'Addition',         multiplier: 1.20 }, // tie-in premium for additions to existing structures
};

export const RENOVATION_COMPLEXITY = {
  'Low':    { label: 'Low',    multiplier: 1.10, description: 'Light refresh / minor upgrades' },
  'Medium': { label: 'Medium', multiplier: 1.22, description: 'Moderate internal alterations / standard refurbishment' },
  'High':   { label: 'High',   multiplier: 1.40, description: 'Heavy strip-out / complex refurbishment' },
};

export const COMPLEXITY = {
  'Low Complexity':    { label: 'Low Complexity',    multiplier: 1.00, description: 'Simple, functional, low-tech projects.' },
  'Medium Complexity': { label: 'Medium Complexity', multiplier: 1.10, description: 'Above-typology features: complex roof, curtain wall, MEP redundancy.' },
  'High Complexity':   { label: 'High Complexity',   multiplier: 1.20, description: 'Significantly atypical demands within typology — specialist systems beyond benchmark.' },
};

export const LAND_PROCUREMENT = {
  'Prime Serviced Land':     { label: 'Prime Serviced Land',     ratePerM2: 1500, developmentMultiplier: 0.07, description: 'Very high land cost, fully serviced, ready to build' },
  'Brownfield Land':         { label: 'Brownfield Land',         ratePerM2: 1200, developmentMultiplier: 0.20, description: 'Previously developed; demolition and remediation risk' },
  'Fully Serviced Land':     { label: 'Fully Serviced Land',     ratePerM2: 1000, developmentMultiplier: 0.00, description: 'Ready-to-build, services in place' },
  'Partially Serviced Land': { label: 'Partially Serviced Land', ratePerM2: 650,  developmentMultiplier: 0.15, description: 'Bulk services nearby; internal reticulation required' },
  'Unserviced Land':         { label: 'Unserviced Land',         ratePerM2: 300,  developmentMultiplier: 0.30, description: 'No bulk or internal services; highest capex risk' },
  'Manual Input':            { label: 'Manual Input',            ratePerM2: 0,    developmentMultiplier: 0.00, description: 'Enter your own land rate and development allowance' },
  'N/A':                     { label: 'N/A',                     ratePerM2: 0,    developmentMultiplier: 0.00, description: 'No land cost included' },
};

export const LAND_SLOPE = {
  'Flat Land (0-5%)':               { label: 'Flat Land (0–5%)',               multiplier: 1.00 },
  'Gentle Slope (5-10%)':           { label: 'Gentle Slope (5–10%)',           multiplier: 1.05 },
  'Moderately Sloped Land (5-15%)': { label: 'Moderately Sloped Land (5–15%)', multiplier: 1.15 },
  'Steep / Hilly Land (15%+)':      { label: 'Steep / Hilly Land (15–30%)',    multiplier: 1.30 },
  'Very Steep Land (30%+)':         { label: 'Very Steep Land (>30%)',          multiplier: 1.50 },
  'Irregular / Constrained Land':   { label: 'Irregular / Constrained Land',   multiplier: 1.35 },
};

// ── COST BREAKDOWN (10 elements — P&Gs removed; handled in financial stack) ───
// Elements must total 100%. Weights applied in calculator (not exposed in UI).
export const BREAKDOWN_ELEMENTS = [
  { key: 'earthworks',            label: 'Earthworks',                         pct: 0.085 },
  { key: 'substructure',          label: 'Substructure',                       pct: 0.105 },
  { key: 'structure',             label: 'Structure',                          pct: 0.210 },
  { key: 'roof',                  label: 'Roof structure and coverings',       pct: 0.105 },
  { key: 'envelope',              label: 'External envelope',                  pct: 0.105 },
  { key: 'internal_construction', label: 'Internal construction',              pct: 0.075 },
  { key: 'internal_finishes',     label: 'Internal finishes',                  pct: 0.125 },
  { key: 'joinery',               label: 'Joinery',                            pct: 0.055 },
  { key: 'landscaping',           label: 'Landscaping, paving and circulation',pct: 0.085 },
  { key: 'services',              label: 'Services',                           pct: 0.050 },
];

// ── MULTIPLIER BLEND WEIGHTS ──────────────────────────────────────────────────
// Used in calculator.js blended formula:
// blended = 1 + (quality-1)*wQ + (complexity-1)*wC + (site-1)*wS
// Quality carries full weight — it is a direct and primary cost driver.
// Complexity is dampened — typology rate already captures most system intensity.
// Site is raised — remote SA construction carries real cumulative cost.
export const MULTIPLIER_WEIGHTS = {
  quality:    1.00,
  complexity: 0.60,
  siteAccess: 0.70,
};

// ── HELPERS ───────────────────────────────────────────────────────────────────

export function getRate(categoryKey, subtypeKey) {
  return BUILDING_RATES[categoryKey]?.subtypes[subtypeKey]?.rate ?? 0;
}

export const CATEGORIES = Object.entries(BUILDING_RATES).map(([key, cat]) => ({
  key,
  label: cat.label,
  subtypes: Object.entries(cat.subtypes).map(([subKey, sub]) => ({
    key: subKey,
    label: sub.label,
    rate: sub.rate,
  })),
}));
