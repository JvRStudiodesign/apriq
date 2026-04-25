// AprIQ Base Rates — AprIQ Cost Intelligence Platform 2025/26
// All rates in ZAR per m² (GFA)
// To add/edit/remove: update the BUILDING_RATES object below.
// Keys use snake_case versions of the labels for code consistency.

export const BUILDING_RATES = {

  Residential: {
    label: 'Residential',
    subtypes: {
      'Single Dwelling':                                    { label: 'Single Dwelling',                                   rate: 12000 },
      'Luxury Dwelling':                                    { label: 'Luxury Dwelling',                                   rate: 22000 },
      'Townhouses / Cluster Housing':                       { label: 'Townhouses / Cluster Housing',                      rate: 10500 },
      'Apartments (Low Rise)':                              { label: 'Apartments (Low Rise)',                             rate: 12500 },
      'Apartments (High Rise)':                             { label: 'Apartments (High Rise)',                            rate: 14500 },
      'Student Accommodation':                              { label: 'Student Accommodation',                             rate: 14000 },
      'Retirement / Assisted Living':                       { label: 'Retirement / Assisted Living',                      rate: 15000 },
      'Low Cost Housing - High Density (Apartment Blocks)': { label: 'Low Cost Housing - High Density (Apartment Blocks)', rate: 7500  },
      'Low Cost Housing - Low Density (Single Dwelling)':   { label: 'Low Cost Housing - Low Density (Single Dwelling)',   rate: 6500  },
      'Low Cost Housing - Medium Density (Duplex Clusters)':{ label: 'Low Cost Housing - Medium Density (Duplex Clusters)',rate: 7000  },
    },
  },

  Office: {
    label: 'Office',
    subtypes: {
      'Grade A Offices':        { label: 'Grade A Offices',        rate: 16500 },
      'CBD High-Rise Offices':  { label: 'CBD High-Rise Offices',  rate: 19000 },
      'Suburban Offices':       { label: 'Suburban Offices',       rate: 13000 },
      'Corporate Headquarters': { label: 'Corporate Headquarters', rate: 23000 },
      'Mixed-Use Office Space': { label: 'Mixed-Use Office Space', rate: 17000 },
      'Co-working Spaces':      { label: 'Co-working Spaces',      rate: 15000 },
    },
  },

  Retail: {
    label: 'Retail',
    subtypes: {
      'Regional Shopping Mall':       { label: 'Regional Shopping Mall',       rate: 18000 },
      'Community Shopping Centre':    { label: 'Community Shopping Centre',    rate: 15500 },
      'Strip Mall':                   { label: 'Strip Mall',                   rate: 14000 },
      'Standalone Retail Store':      { label: 'Standalone Retail Store',      rate: 14500 },
      'Supermarket / Hypermarket':    { label: 'Supermarket / Hypermarket',    rate: 16000 },
      'Warehouse Retail / Bulk Retail':{ label: 'Warehouse Retail / Bulk Retail', rate: 13500 },
    },
  },

  Industrial: {
    label: 'Industrial',
    subtypes: {
      'Warehouse':                    { label: 'Warehouse',                    rate: 8500  },
      'Distribution Centre':          { label: 'Distribution Centre',          rate: 9800  },
      'Logistics Hub':                { label: 'Logistics Hub',                rate: 10500 },
      'Light Manufacturing':          { label: 'Light Manufacturing',          rate: 11000 },
      'Heavy Industrial Facility':    { label: 'Heavy Industrial Facility',    rate: 14500 },
      'Industrial Park / Mini Units': { label: 'Industrial Park / Mini Units', rate: 9500  },
      'Dealership / Showroom':        { label: 'Dealership / Showroom',        rate: 15500 },
      'Commercial Vehicle Facility':  { label: 'Commercial Vehicle Facility',  rate: 16500 },
    },
  },

  Hospitality: {
    label: 'Hospitality',
    subtypes: {
      'Budget Hotel':       { label: 'Budget Hotel',       rate: 16500 },
      'Luxury Hotel':       { label: 'Luxury Hotel',       rate: 38000 },
      'Resort':             { label: 'Resort',             rate: 22000 },
      'Lodge':              { label: 'Lodge',              rate: 18000 },
      'Conference Centre':  { label: 'Conference Centre',  rate: 38000 },
      'Entertainment Venue':{ label: 'Entertainment Venue',rate: 21000 },
    },
  },

  Healthcare: {
    label: 'Healthcare',
    subtypes: {
      'Private Hospital':         { label: 'Private Hospital',         rate: 32000 },
      'Public Hospital':          { label: 'Public Hospital',          rate: 35000 },
      'Day Clinic':               { label: 'Day Clinic',               rate: 22000 },
      'Specialist Medical Centre':{ label: 'Specialist Medical Centre', rate: 26000 },
      'Laboratory':               { label: 'Laboratory',               rate: 24000 },
      'Outpatient Facility':      { label: 'Outpatient Facility',       rate: 20000 },
    },
  },

  Education: {
    label: 'Education',
    subtypes: {
      'Primary School':      { label: 'Primary School',      rate: 10500 },
      'Secondary School':    { label: 'Secondary School',    rate: 12500 },
      'University Building': { label: 'University Building', rate: 17500 },
      'Lecture Building':    { label: 'Lecture Building',    rate: 16000 },
      'Student Housing':     { label: 'Student Housing',     rate: 14000 },
      'Training Centre':     { label: 'Training Centre',     rate: 13000 },
      'Nursery':             { label: 'Nursery',             rate: 10000 },
      'Daycare centre':      { label: 'Daycare centre',      rate: 9500  },
      'Kids playground':     { label: 'Kids playground',     rate: 1800  },
    },
  },

  Civic: {
    label: 'Civic',
    subtypes: {
      'Government Office':          { label: 'Government Office',          rate: 16500 },
      'Municipal Building':         { label: 'Municipal Building',         rate: 16000 },
      'Court':                      { label: 'Court',                      rate: 21000 },
      'Police Station':             { label: 'Police Station',             rate: 17000 },
      'Fire Station':               { label: 'Fire Station',               rate: 17500 },
      'Community Hall / Centre':    { label: 'Community Hall / Centre',    rate: 13000 },
      'Church / Religious Building':{ label: 'Church / Religious Building', rate: 15500 },
    },
  },

  Transport: {
    label: 'Transport',
    subtypes: {
      'Airport Terminal':               { label: 'Airport Terminal',               rate: 30000 },
      'Parking Structure':              { label: 'Parking Structure',              rate: 8000  },
      'Bus Terminal':                   { label: 'Bus Terminal',                   rate: 16500 },
      'Railway Station':                { label: 'Railway Station',                rate: 24000 },
      'Maintenance Depot':              { label: 'Maintenance Depot',              rate: 14500 },
      'Taxi Rank / Transport Interchange':{ label: 'Taxi Rank / Transport Interchange', rate: 15000 },
    },
  },

  'Special / Complex': {
    label: 'Special / Complex',
    subtypes: {
      'Data Centre':                  { label: 'Data Centre',                  rate: 30000 },
      'Sports Stadium':               { label: 'Sports Stadium',               rate: 28000 },
      'Arena':                        { label: 'Arena',                        rate: 26000 },
      'Prison / Correctional Facility':{ label: 'Prison / Correctional Facility', rate: 24000 },
      'Research Laboratory':          { label: 'Research Laboratory',          rate: 35000 },
    },
  },

  Commercial: {
    label: 'Commercial',
    subtypes: {
      'Mixed-Use Development':        { label: 'Mixed-Use Development',        rate: 17500 },
      'Business Park':                { label: 'Business Park',                rate: 16000 },
      'Office + Retail Hybrid':       { label: 'Office + Retail Hybrid',       rate: 16800 },
      'Bank / Financial Institution': { label: 'Bank / Financial Institution', rate: 18500 },
      'Call Centre':                  { label: 'Call Centre',                  rate: 14500 },
      'Corporate Campus':             { label: 'Corporate Campus',             rate: 17500 },
    },
  },

  'Ancillary / Minor Works': {
    label: 'Ancillary / Minor Works',
    subtypes: {
      'Carport (Soft Cover)': { label: 'Carport (Soft Cover)', rate: 2500 },
      'Carport (Hard Cover)': { label: 'Carport (Hard Cover)', rate: 4500 },
      'Boundary Wall':        { label: 'Boundary Wall',        rate: 1800 },
      'Guard House':          { label: 'Guard House',          rate: 9000 },
      'Small Outbuilding':    { label: 'Small Outbuilding',    rate: 7500 },
      'Storage Shed':         { label: 'Storage Shed',         rate: 5500 },
    },
  },

  'Civil Works': {
    label: 'Civil Works',
    subtypes: {
      'Access Roads':             { label: 'Access Roads',             rate: 2200 },
      'Parking Areas':            { label: 'Parking Areas',            rate: 1800 },
      'Bulk Earthworks':          { label: 'Bulk Earthworks',          rate: 950  },
      'Stormwater Infrastructure':{ label: 'Stormwater Infrastructure', rate: 2600 },
      'Sewer Infrastructure':     { label: 'Sewer Infrastructure',     rate: 3200 },
      'Water Reticulation':       { label: 'Water Reticulation',       rate: 2800 },
      'External Services':        { label: 'External Services',        rate: 3000 },
      'Platforms / Terracing':    { label: 'Platforms / Terracing',    rate: 1500 },
    },
  },

  'Internal renovation': {
    label: 'Internal Renovation',
    subtypes: {
      'Residential':      { label: 'Residential',      rate: 3500 },
      'Office':           { label: 'Office',           rate: 5500 },
      'Retail':           { label: 'Retail',           rate: 6000 },
      'Industrial':       { label: 'Industrial',       rate: 2100 },
      'Hospitality':      { label: 'Hospitality',      rate: 8000 },
      'Healthcare':       { label: 'Healthcare',       rate: 6500 },
      'Education':        { label: 'Education',        rate: 3000 },
      'Civic':            { label: 'Civic',            rate: 3500 },
      'Transport':        { label: 'Transport',        rate: 3500 },
      'Special / Complex':{ label: 'Special / Complex', rate: 7500 },
      'Commercial':       { label: 'Commercial',       rate: 5000 },
    },
  },

};

// ── MULTIPLIERS (source: Excel multiplier sheets) ─────────────

export const QUALITY = {
  'Low':     { label: 'Low',     multiplier: 0.85 },
  'Medium':  { label: 'Medium',  multiplier: 1.00 },
  'High':    { label: 'High',    multiplier: 1.25 },
  'Premium': { label: 'Premium', multiplier: 1.60 },
};

export const SITE_ACCESS = {
  'Urban Setting':              { label: 'Urban Setting',              multiplier: 1.000 },
  'Suburban Setting':           { label: 'Suburban Setting',           multiplier: 1.075 },
  'Peri-Urban Setting':         { label: 'Peri-Urban Setting',         multiplier: 1.150 },
  'Rural Setting':              { label: 'Rural Setting',              multiplier: 1.275 },
  'Exurban Setting':            { label: 'Exurban Setting',            multiplier: 1.400 },
  'Specialized/Natural Setting':{ label: 'Specialized/Natural Setting',multiplier: 1.750 },
};

export const PROJECT_TYPE = {
  'New':        { label: 'New',        multiplier: 1.00 },
  'Renovation': { label: 'Renovation', multiplier: 1.00 },
  'Addition':   { label: 'Addition',   multiplier: 1.15 },
};

export const RENOVATION_COMPLEXITY = {
  'Low':    { label: 'Low',    multiplier: 1.10, description: 'Light refresh / minor upgrades' },
  'Medium': { label: 'Medium', multiplier: 1.22, description: 'Moderate internal alterations / standard refurbishment' },
  'High':   { label: 'High',   multiplier: 1.35, description: 'Heavy strip-out / complex refurbishment' },
};

export const COMPLEXITY = {
  'Low Complexity':    { label: 'Low Complexity',    multiplier: 1.00, description: 'Simple, functional, low-tech projects.' },
  'Medium Complexity': { label: 'Medium Complexity', multiplier: 1.25, description: 'Standard structural/civil works with moderate services.' },
  'High Complexity':   { label: 'High Complexity',   multiplier: 1.35, description: 'High-performance projects with complex structural/services requirements.' },
};

export const LAND_PROCUREMENT = {
  'Prime Serviced Land':     { label: 'Prime Serviced Land',     ratePerM2: 1500, developmentMultiplier: 0.07, description: 'Very high land cost, fully serviced, ready to build' },
  'Brownfield Land':         { label: 'Brownfield Land',         ratePerM2: 1300, developmentMultiplier: 0.20, description: 'Medium-high land cost, demolition and remediation risk' },
  'Fully Serviced Land':     { label: 'Fully Serviced Land',     ratePerM2: 1100, developmentMultiplier: 0.00, description: 'High land cost, low services required, fast rollout' },
  'Partially Serviced Land': { label: 'Partially Serviced Land', ratePerM2: 650,  developmentMultiplier: 0.15, description: 'Medium land cost, partial services, moderate development required' },
  'Unserviced Land':         { label: 'Unserviced Land',         ratePerM2: 300,  developmentMultiplier: 0.30, description: 'Low land cost, high services required, slow rollout' },
  'N/A':                     { label: 'N/A',                     ratePerM2: 0,    developmentMultiplier: 0.00, description: 'No land cost included' },
};

export const LAND_SLOPE = {
  'Flat Land (0-5%)':               { label: 'Flat Land (0–5%)',               multiplier: 1.00 },
  'Moderately Sloped Land (5-15%)': { label: 'Moderately Sloped Land (5–15%)', multiplier: 1.10 },
  'Steep / Hilly Land (15%+)':      { label: 'Steep / Hilly Land (15%+)',      multiplier: 1.25 },
  'Irregular / Constrained Land':   { label: 'Irregular / Constrained Land',   multiplier: 1.35 },
};

// ── COST BREAKDOWN (11 elements, must total 100%) ─────────────
// Source: Breakdown sheet. Earthworks handled separately in financial stack.
export const BREAKDOWN_ELEMENTS = [
  { key: 'earthworks',            label: 'Earthworks',                         pct: 0.08 },
  { key: 'substructure',          label: 'Substructure',                        pct: 0.10 },
  { key: 'structure',             label: 'Structure',                           pct: 0.20 },
  { key: 'roof',                  label: 'Roof structure and coverings',        pct: 0.10 },
  { key: 'envelope',              label: 'External envelope',                   pct: 0.10 },
  { key: 'internal_construction', label: 'Internal construction',               pct: 0.07 },
  { key: 'internal_finishes',     label: 'Internal finishes',                   pct: 0.12 },
  { key: 'joinery',               label: 'Joinery',                             pct: 0.05 },
  { key: 'landscaping',           label: 'Landscaping, paving and circulation', pct: 0.08 },
  { key: 'services',              label: 'Services',                            pct: 0.05 },
  { key: 'pgs',                   label: "P&G's",                              pct: 0.05 },
];

// ── HELPERS ───────────────────────────────────────────────────

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
