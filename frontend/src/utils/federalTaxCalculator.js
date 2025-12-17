// Federal Tax Calculator based on 2024 IRS Tax Brackets and Filing Status
// Reference: IRS Publication 15-T (Federal Income Tax Withholding Methods)

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
  married_separately: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 365600, rate: 0.35 },
    { min: 365600, max: Infinity, rate: 0.37 },
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

// Standard deduction amounts (2024)
const STANDARD_DEDUCTIONS = {
  single: 14600,
  married_jointly: 29200,
  married_separately: 14600,
  head_of_household: 21900,
};

// Exemption/allowance value per withholding allowance (approximate annual value)
const EXEMPTION_VALUE = 4300; // Per allowance annual reduction

/**
 * Calculate federal income tax withholding based on filing status and exemptions
 * @param {number} grossPay - Gross pay for the period
 * @param {string} payFrequency - 'weekly' or 'biweekly'
 * @param {string} filingStatus - Filing status (single, married_jointly, etc.)
 * @param {number} exemptions - Number of withholding allowances
 * @returns {number} Federal tax withholding for the period
 */
export function calculateFederalTax(grossPay, payFrequency, filingStatus = 'single', exemptions = 0) {
  if (!filingStatus || filingStatus === '') {
    // Default flat rate if no filing status selected (approximate 22% effective rate)
    return grossPay * 0.22;
  }

  // Convert period pay to annual
  const periodsPerYear = payFrequency === 'weekly' ? 52 : 26;
  const annualGross = grossPay * periodsPerYear;

  // Get standard deduction for filing status
  const standardDeduction = STANDARD_DEDUCTIONS[filingStatus] || STANDARD_DEDUCTIONS.single;
  
  // Calculate exemption reduction
  const exemptionReduction = (parseInt(exemptions) || 0) * EXEMPTION_VALUE;
  
  // Taxable income after standard deduction and exemptions
  const taxableIncome = Math.max(0, annualGross - standardDeduction - exemptionReduction);

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
 * Calculate state income tax withholding based on filing status and exemptions
 * This is a simplified calculation - actual state taxes vary significantly
 * @param {number} grossPay - Gross pay for the period
 * @param {string} state - State abbreviation
 * @param {string} payFrequency - 'weekly' or 'biweekly'
 * @param {string} filingStatus - Filing status
 * @param {number} exemptions - Number of state exemptions
 * @param {number} baseStateRate - Base state tax rate (decimal)
 * @returns {number} State tax withholding for the period
 */
export function calculateStateTax(grossPay, state, payFrequency, filingStatus = 'single', exemptions = 0, baseStateRate = 0.05) {
  // States with no income tax
  const noTaxStates = ['AK', 'FL', 'NV', 'NH', 'SD', 'TN', 'TX', 'WA', 'WY'];
  if (noTaxStates.includes(state?.toUpperCase())) {
    return 0;
  }

  if (!filingStatus || filingStatus === '') {
    // Default flat rate if no filing status selected
    return grossPay * baseStateRate;
  }

  // Convert period pay to annual
  const periodsPerYear = payFrequency === 'weekly' ? 52 : 26;
  const annualGross = grossPay * periodsPerYear;

  // State exemption value (varies by state, using approximate value)
  const stateExemptionValue = 2500;
  const exemptionReduction = (parseInt(exemptions) || 0) * stateExemptionValue;

  // State standard deduction (simplified - varies by state and filing status)
  const stateStandardDeductions = {
    single: 5000,
    married_jointly: 10000,
    married_separately: 5000,
    head_of_household: 7500,
  };
  const stateStandardDeduction = stateStandardDeductions[filingStatus] || stateStandardDeductions.single;

  // Taxable income after deductions
  const taxableIncome = Math.max(0, annualGross - stateStandardDeduction - exemptionReduction);

  // Apply state rate to taxable income
  // Many states use progressive brackets, but we'll use effective rate for simplicity
  // Adjust rate based on filing status (married usually has lower effective rate)
  let effectiveRate = baseStateRate;
  if (filingStatus === 'married_jointly') {
    effectiveRate = baseStateRate * 0.9; // Slightly lower effective rate for married
  } else if (filingStatus === 'head_of_household') {
    effectiveRate = baseStateRate * 0.95;
  }

  const annualTax = taxableIncome * effectiveRate;
  const periodTax = annualTax / periodsPerYear;

  return Math.max(0, periodTax);
}

/**
 * Get effective tax rate description for display
 */
export function getEffectiveTaxInfo(filingStatus, exemptions) {
  if (!filingStatus) return null;
  
  const statusLabels = {
    single: 'Single',
    married_jointly: 'Married Filing Jointly',
    married_separately: 'Married Filing Separately',
    head_of_household: 'Head of Household',
  };
  
  return {
    status: statusLabels[filingStatus] || filingStatus,
    exemptions: parseInt(exemptions) || 0,
    standardDeduction: STANDARD_DEDUCTIONS[filingStatus] || STANDARD_DEDUCTIONS.single,
  };
}
