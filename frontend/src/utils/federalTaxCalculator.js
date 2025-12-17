// Federal Tax Calculator based on 2024 IRS Tax Brackets and Filing Status
// Reference: IRS Publication 15-T (Federal Income Tax Withholding Methods)
// Updated for 2020+ W-4 (no more allowances for federal)

// 2024 Federal Tax Brackets (Annual)
const FEDERAL_TAX_BRACKETS = {
  single: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 },
  ],
  married_jointly: [
    { min: 0, max: 23200, rate: 0.10 },
    { min: 23200, max: 94300, rate: 0.12 },
    { min: 94300, max: 201050, rate: 0.22 },
    { min: 201050, max: 383900, rate: 0.24 },
    { min: 383900, max: 487450, rate: 0.32 },
    { min: 487450, max: 731200, rate: 0.35 },
    { min: 731200, max: Infinity, rate: 0.37 },
  ],
  head_of_household: [
    { min: 0, max: 16550, rate: 0.10 },
    { min: 16550, max: 63100, rate: 0.12 },
    { min: 63100, max: 100500, rate: 0.22 },
    { min: 100500, max: 191950, rate: 0.24 },
    { min: 191950, max: 243700, rate: 0.32 },
    { min: 243700, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 },
  ],
};

// Standard deduction amounts (2024) - per 2020+ W-4
const STANDARD_DEDUCTIONS = {
  single: 14600,
  married_jointly: 29200,
  head_of_household: 21900,
};

// States that use withholding allowances (updated per document)
const STATES_WITH_ALLOWANCES = [
  'GA', 'HI', 'ID', 'KS', 'KY', 'ME', 'MN', 'MS', 'MO', 'MT', 
  'NE', 'NM', 'ND', 'SC', 'UT', 'VT', 'VA', 'WV', 'WI'
];

// States with no income tax
const NO_TAX_STATES = ['AK', 'FL', 'NV', 'SD', 'TX', 'WA', 'WY'];

// States with interest/dividends tax only
const INTEREST_DIVIDENDS_ONLY_STATES = ['NH', 'TN'];

// States with local/county tax that applies
const STATES_WITH_LOCAL_TAX = ['IN', 'MD', 'OH', 'PA'];

// State tax rates (2024 approximate flat/top marginal rates)
const STATE_TAX_RATES = {
  AL: 0.05,    // Alabama - 2-5% progressive
  AK: 0,       // Alaska - No state income tax
  AZ: 0.025,   // Arizona - 2.5% flat
  AR: 0.047,   // Arkansas - 2-4.7% progressive
  CA: 0.093,   // California - 1-12.3% progressive (using ~9.3% effective)
  CO: 0.044,   // Colorado - 4.4% flat
  CT: 0.0699,  // Connecticut - 3-6.99% progressive
  DE: 0.066,   // Delaware - 2.2-6.6% progressive
  FL: 0,       // Florida - No state income tax
  GA: 0.0549,  // Georgia - 5.49% flat (2024)
  HI: 0.0825,  // Hawaii - 1.4-11% progressive
  ID: 0.058,   // Idaho - 5.8% flat
  IL: 0.0495,  // Illinois - 4.95% flat
  IN: 0.0305,  // Indiana - 3.05% flat
  IA: 0.057,   // Iowa - 4.4-5.7% progressive
  KS: 0.057,   // Kansas - 3.1-5.7% progressive
  KY: 0.04,    // Kentucky - 4% flat
  LA: 0.0425,  // Louisiana - 1.85-4.25% progressive
  ME: 0.0715,  // Maine - 5.8-7.15% progressive
  MD: 0.0575,  // Maryland - 2-5.75% progressive (+ local)
  MA: 0.05,    // Massachusetts - 5% flat
  MI: 0.0425,  // Michigan - 4.25% flat
  MN: 0.0985,  // Minnesota - 5.35-9.85% progressive
  MS: 0.05,    // Mississippi - 5% flat (2024)
  MO: 0.048,   // Missouri - 2-4.8% progressive
  MT: 0.059,   // Montana - 4.7-5.9% progressive
  NE: 0.0584,  // Nebraska - 2.46-5.84% progressive
  NV: 0,       // Nevada - No state income tax
  NH: 0,       // New Hampshire - Interest/dividends only
  NJ: 0.0897,  // New Jersey - 1.4-10.75% progressive
  NM: 0.059,   // New Mexico - 1.7-5.9% progressive
  NY: 0.0685,  // New York - 4-10.9% progressive
  NC: 0.0475,  // North Carolina - 4.75% flat (2024)
  ND: 0.029,   // North Dakota - 1.95-2.9% progressive
  OH: 0.035,   // Ohio - 0-3.5% progressive (+ school district)
  OK: 0.0475,  // Oklahoma - 0.25-4.75% progressive
  OR: 0.099,   // Oregon - 4.75-9.9% progressive
  PA: 0.0307,  // Pennsylvania - 3.07% flat (+ local)
  RI: 0.0599,  // Rhode Island - 3.75-5.99% progressive
  SC: 0.064,   // South Carolina - 0-6.4% progressive
  SD: 0,       // South Dakota - No state income tax
  TN: 0,       // Tennessee - Interest/dividends only
  TX: 0,       // Texas - No state income tax
  UT: 0.0465,  // Utah - 4.65% flat
  VT: 0.0875,  // Vermont - 3.35-8.75% progressive
  VA: 0.0575,  // Virginia - 2-5.75% progressive
  WA: 0,       // Washington - No state income tax
  WV: 0.055,   // West Virginia - 3-5.5% progressive
  WI: 0.0765,  // Wisconsin - 3.5-7.65% progressive
  WY: 0,       // Wyoming - No state income tax
  DC: 0.0975,  // DC - 4-10.75% progressive
};

// State allowance value (approximate annual value per allowance)
const STATE_ALLOWANCE_VALUE = 2500;

/**
 * Calculate federal income tax withholding based on filing status
 * Per 2020+ W-4, federal no longer uses allowances
 */
export function calculateFederalTax(grossPay, payFrequency, filingStatus = 'single') {
  if (!filingStatus || filingStatus === '') {
    return grossPay * 0.22;
  }

  const periodsPerYear = payFrequency === 'weekly' ? 52 : 26;
  const annualGross = grossPay * periodsPerYear;
  const standardDeduction = STANDARD_DEDUCTIONS[filingStatus] || STANDARD_DEDUCTIONS.single;
  const taxableIncome = Math.max(0, annualGross - standardDeduction);
  const brackets = FEDERAL_TAX_BRACKETS[filingStatus] || FEDERAL_TAX_BRACKETS.single;

  let annualTax = 0;
  let remainingIncome = taxableIncome;

  for (const bracket of brackets) {
    if (remainingIncome <= 0) break;
    const bracketSize = bracket.max - bracket.min;
    const taxableInBracket = Math.min(remainingIncome, bracketSize);
    annualTax += taxableInBracket * bracket.rate;
    remainingIncome -= taxableInBracket;
  }

  return Math.max(0, annualTax / periodsPerYear);
}

/**
 * Calculate state income tax withholding
 */
export function calculateStateTax(grossPay, state, payFrequency, allowances = 0, baseStateRate = null) {
  const stateUpper = state?.toUpperCase() || '';
  
  // Get actual state rate
  const stateRate = baseStateRate !== null ? baseStateRate : (STATE_TAX_RATES[stateUpper] || 0.05);
  
  // States with no income tax
  if (NO_TAX_STATES.includes(stateUpper) || INTEREST_DIVIDENDS_ONLY_STATES.includes(stateUpper)) {
    return 0;
  }

  const periodsPerYear = payFrequency === 'weekly' ? 52 : 26;
  const annualGross = grossPay * periodsPerYear;

  // Calculate allowance reduction (only for states that use them)
  let allowanceReduction = 0;
  if (STATES_WITH_ALLOWANCES.includes(stateUpper)) {
    allowanceReduction = (parseInt(allowances) || 0) * STATE_ALLOWANCE_VALUE;
  }

  const taxableIncome = Math.max(0, annualGross - allowanceReduction);
  const annualTax = taxableIncome * stateRate;

  return Math.max(0, annualTax / periodsPerYear);
}

/**
 * Get state tax rate
 */
export function getStateTaxRate(state) {
  return STATE_TAX_RATES[state?.toUpperCase()] || 0.05;
}

/**
 * Check if a state uses withholding allowances
 */
export function stateUsesAllowances(state) {
  return STATES_WITH_ALLOWANCES.includes(state?.toUpperCase());
}

/**
 * Check if a state has no income tax
 */
export function stateHasNoIncomeTax(state) {
  const stateUpper = state?.toUpperCase();
  return NO_TAX_STATES.includes(stateUpper) || INTEREST_DIVIDENDS_ONLY_STATES.includes(stateUpper);
}

/**
 * Check if state has local/county tax
 */
export function stateHasLocalTax(state) {
  return STATES_WITH_LOCAL_TAX.includes(state?.toUpperCase());
}

/**
 * Get filing status label for display
 */
export function getFilingStatusLabel(status) {
  const labels = {
    single: 'Single/MFS',
    married_jointly: 'MFJ',
    head_of_household: 'HOH',
  };
  return labels[status] || status;
}

/**
 * Get state tax info for display
 */
export function getStateTaxInfo(state) {
  const stateUpper = state?.toUpperCase();
  
  if (NO_TAX_STATES.includes(stateUpper)) {
    return { type: 'no_tax', message: `${state} has no state income tax` };
  }
  
  if (INTEREST_DIVIDENDS_ONLY_STATES.includes(stateUpper)) {
    return { type: 'interest_only', message: `${state} only taxes interest/dividends` };
  }
  
  if (STATES_WITH_ALLOWANCES.includes(stateUpper)) {
    return { type: 'allowances', message: `${state} uses withholding allowances`, rate: STATE_TAX_RATES[stateUpper] };
  }
  
  if (STATES_WITH_LOCAL_TAX.includes(stateUpper)) {
    return { type: 'local_tax', message: `${state} has local/county tax`, rate: STATE_TAX_RATES[stateUpper] };
  }
  
  return { type: 'standard', message: `${state} does not use allowances`, rate: STATE_TAX_RATES[stateUpper] };
}
