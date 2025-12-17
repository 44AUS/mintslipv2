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

// States that use withholding allowances
const STATES_WITH_ALLOWANCES = [
  'CA', 'CO', 'DE', 'DC', 'GA', 'HI', 'ID', 'IL', 'IA', 'KS', 
  'ME', 'MN', 'MT', 'NE', 'NJ', 'NY', 'NC', 'OK', 'RI', 'SC', 'VT'
];

// States with no income tax
const NO_TAX_STATES = ['AK', 'FL', 'NV', 'NH', 'SD', 'TN', 'TX', 'WA', 'WY'];

// State allowance value (approximate annual value per allowance)
const STATE_ALLOWANCE_VALUE = 2500;

/**
 * Calculate federal income tax withholding based on filing status
 * Per 2020+ W-4, federal no longer uses allowances
 * @param {number} grossPay - Gross pay for the period
 * @param {string} payFrequency - 'weekly' or 'biweekly'
 * @param {string} filingStatus - Filing status (single, married_jointly, head_of_household)
 * @returns {number} Federal tax withholding for the period
 */
export function calculateFederalTax(grossPay, payFrequency, filingStatus = 'single') {
  if (!filingStatus || filingStatus === '') {
    // Default flat rate if no filing status selected (approximate 22% effective rate)
    return grossPay * 0.22;
  }

  // Convert period pay to annual
  const periodsPerYear = payFrequency === 'weekly' ? 52 : 26;
  const annualGross = grossPay * periodsPerYear;

  // Get standard deduction for filing status
  const standardDeduction = STANDARD_DEDUCTIONS[filingStatus] || STANDARD_DEDUCTIONS.single;
  
  // Taxable income after standard deduction (no more allowances for federal per 2020+ W-4)
  const taxableIncome = Math.max(0, annualGross - standardDeduction);

  // Get tax brackets for filing status
  const brackets = FEDERAL_TAX_BRACKETS[filingStatus] || FEDERAL_TAX_BRACKETS.single;

  // Calculate tax using progressive brackets
  let annualTax = 0;
  let remainingIncome = taxableIncome;

  for (const bracket of brackets) {
    if (remainingIncome <= 0) break;
    
    const bracketSize = bracket.max - bracket.min;
    const taxableInBracket = Math.min(remainingIncome, bracketSize);
    annualTax += taxableInBracket * bracket.rate;
    remainingIncome -= taxableInBracket;
  }

  // Convert annual tax to period tax
  const periodTax = annualTax / periodsPerYear;
  
  return Math.max(0, periodTax);
}

/**
 * Calculate state income tax withholding
 * Some states use allowances, some don't, some have no income tax
 * @param {number} grossPay - Gross pay for the period
 * @param {string} state - State abbreviation
 * @param {string} payFrequency - 'weekly' or 'biweekly'
 * @param {number} allowances - Number of state allowances (only applies to states that use them)
 * @param {number} baseStateRate - Base state tax rate (decimal)
 * @returns {number} State tax withholding for the period
 */
export function calculateStateTax(grossPay, state, payFrequency, allowances = 0, baseStateRate = 0.05) {
  const stateUpper = state?.toUpperCase() || '';
  
  // States with no income tax
  if (NO_TAX_STATES.includes(stateUpper)) {
    return 0;
  }

  // Convert period pay to annual
  const periodsPerYear = payFrequency === 'weekly' ? 52 : 26;
  const annualGross = grossPay * periodsPerYear;

  // Calculate allowance reduction (only for states that use them)
  let allowanceReduction = 0;
  if (STATES_WITH_ALLOWANCES.includes(stateUpper)) {
    allowanceReduction = (parseInt(allowances) || 0) * STATE_ALLOWANCE_VALUE;
  }

  // Taxable income after allowances
  const taxableIncome = Math.max(0, annualGross - allowanceReduction);

  // Apply state rate
  const annualTax = taxableIncome * baseStateRate;
  const periodTax = annualTax / periodsPerYear;

  return Math.max(0, periodTax);
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
  return NO_TAX_STATES.includes(state?.toUpperCase());
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
