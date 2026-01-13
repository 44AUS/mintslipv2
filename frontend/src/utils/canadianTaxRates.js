// Canadian Tax Rates for 2025
// All rates are based on CRA guidelines

// Canadian Provinces and Territories
export const CANADIAN_PROVINCES = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'YT', name: 'Yukon' },
];

// CPP (Canada Pension Plan) - 2025 rates
export const CPP_RATE = 0.0595; // 5.95% employee contribution (base)
export const CPP2_RATE = 0.04; // 4% additional CPP2 on earnings above first ceiling
export const CPP_MAX_PENSIONABLE_EARNINGS = 71300; // First earnings ceiling 2025
export const CPP2_MAX_PENSIONABLE_EARNINGS = 81200; // Second earnings ceiling 2025 (for CPP2)
export const CPP_BASIC_EXEMPTION = 3500;
export const CPP_MAX_CONTRIBUTION = 4034.10; // Max base CPP contribution 2025
export const CPP2_MAX_CONTRIBUTION = 396.00; // Max additional CPP2 contribution 2025

// QPP (Quebec Pension Plan) - 2025 rates (Quebec uses QPP instead of CPP)
export const QPP_RATE = 0.064; // 6.40% employee contribution (base)
export const QPP2_RATE = 0.04; // 4% additional QPP2 on earnings above first ceiling
export const QPP_MAX_PENSIONABLE_EARNINGS = 71300;
export const QPP2_MAX_PENSIONABLE_EARNINGS = 81200;
export const QPP_BASIC_EXEMPTION = 3500;
export const QPP_MAX_CONTRIBUTION = 4348.32; // Max base QPP contribution 2025
export const QPP2_MAX_CONTRIBUTION = 396.00; // Max additional QPP2 contribution 2025

// EI (Employment Insurance) - 2025 rates
export const EI_RATE = 0.0164; // 1.64% for most provinces (2025)
export const EI_RATE_QUEBEC = 0.0130; // 1.30% for Quebec (reduced due to QPIP)
export const EI_MAX_INSURABLE_EARNINGS = 65700; // 2025
export const EI_MAX_CONTRIBUTION = EI_MAX_INSURABLE_EARNINGS * EI_RATE; // $1,077.48
export const EI_MAX_CONTRIBUTION_QUEBEC = EI_MAX_INSURABLE_EARNINGS * EI_RATE_QUEBEC; // $854.10

// QPIP (Quebec Parental Insurance Plan) - 2025 rates (Quebec only)
export const QPIP_RATE = 0.00494; // 0.494% employee contribution
export const QPIP_MAX_INSURABLE_EARNINGS = 98000; // 2025
export const QPIP_MAX_CONTRIBUTION = QPIP_MAX_INSURABLE_EARNINGS * QPIP_RATE; // $484.12

// Federal Tax Brackets 2025
export const FEDERAL_TAX_BRACKETS = [
  { min: 0, max: 57375, rate: 0.15 },
  { min: 57375, max: 114750, rate: 0.205 },
  { min: 114750, max: 177882, rate: 0.26 },
  { min: 177882, max: 253414, rate: 0.29 },
  { min: 253414, max: Infinity, rate: 0.33 },
];

// Federal Basic Personal Amount 2025
export const FEDERAL_BASIC_PERSONAL_AMOUNT = 16129;

// Provincial Tax Brackets 2025
export const PROVINCIAL_TAX_BRACKETS = {
  AB: [ // Alberta 2025
    { min: 0, max: 151234, rate: 0.10 },
    { min: 151234, max: 181481, rate: 0.12 },
    { min: 181481, max: 241974, rate: 0.13 },
    { min: 241974, max: 362961, rate: 0.14 },
    { min: 362961, max: Infinity, rate: 0.15 },
  ],
  BC: [ // British Columbia 2025
    { min: 0, max: 49279, rate: 0.0506 },
    { min: 49279, max: 98560, rate: 0.077 },
    { min: 98560, max: 113158, rate: 0.105 },
    { min: 113158, max: 137407, rate: 0.1229 },
    { min: 137407, max: 186306, rate: 0.147 },
    { min: 186306, max: 259829, rate: 0.168 },
    { min: 259829, max: Infinity, rate: 0.205 },
  ],
  MB: [ // Manitoba 2025
    { min: 0, max: 47564, rate: 0.108 },
    { min: 47564, max: 101200, rate: 0.1275 },
    { min: 101200, max: Infinity, rate: 0.174 },
  ],
  NB: [ // New Brunswick 2025
    { min: 0, max: 51306, rate: 0.094 },
    { min: 51306, max: 102614, rate: 0.14 },
    { min: 102614, max: 190060, rate: 0.16 },
    { min: 190060, max: Infinity, rate: 0.195 },
  ],
  NL: [ // Newfoundland and Labrador 2025
    { min: 0, max: 44192, rate: 0.087 },
    { min: 44192, max: 88382, rate: 0.145 },
    { min: 88382, max: 157792, rate: 0.158 },
    { min: 157792, max: 220910, rate: 0.178 },
    { min: 220910, max: 282214, rate: 0.198 },
    { min: 282214, max: 564429, rate: 0.208 },
    { min: 564429, max: 1128858, rate: 0.213 },
    { min: 1128858, max: Infinity, rate: 0.218 },
  ],
  NS: [ // Nova Scotia 2025 (indexed 3.1%)
    { min: 0, max: 30507, rate: 0.0879 },
    { min: 30507, max: 61014, rate: 0.1495 },
    { min: 61014, max: 95883, rate: 0.1667 },
    { min: 95883, max: 154650, rate: 0.175 },
    { min: 154650, max: Infinity, rate: 0.21 },
  ],
  NT: [ // Northwest Territories 2025
    { min: 0, max: 51964, rate: 0.059 },
    { min: 51964, max: 103930, rate: 0.086 },
    { min: 103930, max: 168967, rate: 0.122 },
    { min: 168967, max: Infinity, rate: 0.1405 },
  ],
  NU: [ // Nunavut 2025
    { min: 0, max: 54707, rate: 0.04 },
    { min: 54707, max: 109413, rate: 0.07 },
    { min: 109413, max: 177882, rate: 0.09 },
    { min: 177882, max: Infinity, rate: 0.115 },
  ],
  ON: [ // Ontario 2025
    { min: 0, max: 52886, rate: 0.0505 },
    { min: 52886, max: 105775, rate: 0.0915 },
    { min: 105775, max: 150000, rate: 0.1116 },
    { min: 150000, max: 220000, rate: 0.1216 },
    { min: 220000, max: Infinity, rate: 0.1316 },
  ],
  PE: [ // Prince Edward Island 2025
    { min: 0, max: 33328, rate: 0.098 },
    { min: 33328, max: 64656, rate: 0.138 },
    { min: 64656, max: 105000, rate: 0.167 },
    { min: 105000, max: 140000, rate: 0.1775 },
    { min: 140000, max: Infinity, rate: 0.19 },
  ],
  QC: [ // Quebec 2025
    { min: 0, max: 53255, rate: 0.14 },
    { min: 53255, max: 106495, rate: 0.19 },
    { min: 106495, max: 129590, rate: 0.24 },
    { min: 129590, max: Infinity, rate: 0.2575 },
  ],
  SK: [ // Saskatchewan 2025
    { min: 0, max: 52886, rate: 0.105 },
    { min: 52886, max: 151127, rate: 0.125 },
    { min: 151127, max: Infinity, rate: 0.145 },
  ],
  YT: [ // Yukon 2025
    { min: 0, max: 57375, rate: 0.064 },
    { min: 57375, max: 114750, rate: 0.09 },
    { min: 114750, max: 177882, rate: 0.109 },
    { min: 177882, max: 500000, rate: 0.128 },
    { min: 500000, max: Infinity, rate: 0.15 },
  ],
};

// Provincial Basic Personal Amounts 2025
export const PROVINCIAL_BASIC_PERSONAL_AMOUNTS = {
  AB: 22323,   // Alberta 2025
  BC: 12932,   // British Columbia 2025
  MB: 15969,   // Manitoba 2025
  NB: 13396,   // New Brunswick 2025
  NL: 10818,   // Newfoundland and Labrador 2025
  NS: 8744,    // Nova Scotia 2025 (base amount)
  NT: 17842,   // Northwest Territories 2025
  NU: 19274,   // Nunavut 2025
  ON: 12747,   // Ontario 2025
  PE: 13500,   // Prince Edward Island 2025
  QC: 18571,   // Quebec 2025
  SK: 18991,   // Saskatchewan 2025
  YT: 16129,   // Yukon 2025 (follows federal)
};

// Calculate CPP contribution for a pay period
export function calculateCPP(grossPay, payFrequency, ytdEarnings = 0, isQuebec = false) {
  const rate = isQuebec ? QPP_RATE : CPP_RATE;
  const maxEarnings = isQuebec ? QPP_MAX_PENSIONABLE_EARNINGS : CPP_MAX_PENSIONABLE_EARNINGS;
  const basicExemption = isQuebec ? QPP_BASIC_EXEMPTION : CPP_BASIC_EXEMPTION;
  const maxContribution = isQuebec ? QPP_MAX_CONTRIBUTION : CPP_MAX_CONTRIBUTION;
  
  // Calculate periods per year
  const periodsPerYear = payFrequency === 'weekly' ? 52 : 26;
  const periodBasicExemption = basicExemption / periodsPerYear;
  
  // Calculate pensionable earnings for this period
  const pensionableEarnings = Math.max(0, grossPay - periodBasicExemption);
  
  // Check if max contribution reached
  const ytdContribution = ytdEarnings * rate;
  if (ytdContribution >= maxContribution) return 0;
  
  // Calculate contribution
  let contribution = pensionableEarnings * rate;
  
  // Cap at remaining contribution room
  const remainingRoom = maxContribution - ytdContribution;
  contribution = Math.min(contribution, remainingRoom);
  
  return Math.max(0, contribution);
}

// Calculate EI contribution for a pay period
export function calculateEI(grossPay, payFrequency, ytdEarnings = 0, isQuebec = false) {
  const rate = isQuebec ? EI_RATE_QUEBEC : EI_RATE;
  const maxContribution = isQuebec ? EI_MAX_CONTRIBUTION_QUEBEC : EI_MAX_CONTRIBUTION;
  
  // Check if max contribution reached
  const ytdContribution = ytdEarnings * rate;
  if (ytdContribution >= maxContribution) return 0;
  
  // Calculate contribution
  let contribution = grossPay * rate;
  
  // Cap at remaining contribution room
  const remainingRoom = maxContribution - ytdContribution;
  contribution = Math.min(contribution, remainingRoom);
  
  return Math.max(0, contribution);
}

// Calculate QPIP contribution (Quebec only)
export function calculateQPIP(grossPay, payFrequency, ytdEarnings = 0) {
  // Check if max contribution reached
  const ytdContribution = ytdEarnings * QPIP_RATE;
  if (ytdContribution >= QPIP_MAX_CONTRIBUTION) return 0;
  
  // Calculate contribution
  let contribution = grossPay * QPIP_RATE;
  
  // Cap at remaining contribution room
  const remainingRoom = QPIP_MAX_CONTRIBUTION - ytdContribution;
  contribution = Math.min(contribution, remainingRoom);
  
  return Math.max(0, contribution);
}

// Calculate Federal Tax for a pay period
export function calculateFederalTax(annualizedIncome) {
  let tax = 0;
  let remainingIncome = annualizedIncome;
  
  for (const bracket of FEDERAL_TAX_BRACKETS) {
    if (remainingIncome <= 0) break;
    
    const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
    tax += taxableInBracket * bracket.rate;
    remainingIncome -= taxableInBracket;
  }
  
  // Apply basic personal amount credit (15% of BPA)
  const basicCredit = FEDERAL_BASIC_PERSONAL_AMOUNT * 0.15;
  tax = Math.max(0, tax - basicCredit);
  
  return tax;
}

// Calculate Provincial Tax for a pay period
export function calculateProvincialTax(annualizedIncome, provinceCode) {
  const brackets = PROVINCIAL_TAX_BRACKETS[provinceCode];
  if (!brackets) return 0;
  
  let tax = 0;
  let remainingIncome = annualizedIncome;
  
  for (const bracket of brackets) {
    if (remainingIncome <= 0) break;
    
    const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
    tax += taxableInBracket * bracket.rate;
    remainingIncome -= taxableInBracket;
  }
  
  // Apply provincial basic personal amount credit
  const bpa = PROVINCIAL_BASIC_PERSONAL_AMOUNTS[provinceCode] || 0;
  const lowestRate = brackets[0]?.rate || 0;
  const basicCredit = bpa * lowestRate;
  tax = Math.max(0, tax - basicCredit);
  
  return tax;
}

// Calculate all taxes for a Canadian pay period
export function calculateCanadianTaxes(grossPay, payFrequency, provinceCode, ytdEarnings = 0, federalAllowances = 0, provincialAllowances = 0, maritalStatus = 'single') {
  const isQuebec = provinceCode === 'QC';
  const periodsPerYear = payFrequency === 'weekly' ? 52 : 26;
  const annualizedIncome = grossPay * periodsPerYear;
  
  // CPP/QPP
  const cpp = calculateCPP(grossPay, payFrequency, ytdEarnings, isQuebec);
  
  // EI
  const ei = calculateEI(grossPay, payFrequency, ytdEarnings, isQuebec);
  
  // QPIP (Quebec only)
  const qpip = isQuebec ? calculateQPIP(grossPay, payFrequency, ytdEarnings) : 0;
  
  // Marital Status Tax Credit Adjustment
  // In Canada, married/common-law individuals may claim spousal amount if spouse has low/no income
  // For simplicity: married/common-law get additional $2,000 credit (partial spousal amount)
  // Single, separated, divorced, widowed - may claim eligible dependant amount if supporting dependant
  let maritalStatusCredit = 0;
  if (maritalStatus === 'married' || maritalStatus === 'common_law') {
    // Spousal amount credit - assuming spouse has some income, partial credit of ~$2,000
    maritalStatusCredit = 2000;
  } else if (maritalStatus === 'separated' || maritalStatus === 'divorced' || maritalStatus === 'widowed') {
    // Eligible dependant amount - if supporting a dependant, similar to spousal amount
    // For simplicity, give a smaller credit of ~$1,000 (partial eligible dependant)
    maritalStatusCredit = 1000;
  }
  // Single (never married) - basic personal amount only, no additional credit
  
  // Federal Tax (per period)
  // Federal allowances reduce taxable income - each allowance is worth approximately $2,500 in 2024
  const federalAllowanceCredit = (parseFloat(federalAllowances) || 0) * 2500;
  const adjustedFederalIncome = Math.max(0, annualizedIncome - federalAllowanceCredit - maritalStatusCredit);
  const annualFederalTax = calculateFederalTax(adjustedFederalIncome);
  const federalTax = annualFederalTax / periodsPerYear;
  
  // Provincial Tax (per period)
  // Provincial allowances reduce taxable income - each allowance is worth approximately $2,000 in 2024
  const provincialAllowanceCredit = (parseFloat(provincialAllowances) || 0) * 2000;
  // Provincial marital credit is typically smaller, ~60% of federal
  const provincialMaritalCredit = maritalStatusCredit * 0.6;
  const adjustedProvincialIncome = Math.max(0, annualizedIncome - provincialAllowanceCredit - provincialMaritalCredit);
  const annualProvincialTax = calculateProvincialTax(adjustedProvincialIncome, provinceCode);
  const provincialTax = annualProvincialTax / periodsPerYear;
  
  // Total deductions
  const totalTax = cpp + ei + qpip + federalTax + provincialTax;
  
  return {
    cpp,
    ei,
    qpip,
    federalTax,
    provincialTax,
    totalTax,
    isQuebec,
    cppLabel: isQuebec ? 'QPP' : 'CPP',
  };
}

// Get province name from code
export function getProvinceName(code) {
  const province = CANADIAN_PROVINCES.find(p => p.code === code);
  return province ? province.name : code;
}

// Format Canadian currency
export function formatCAD(amount) {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(amount);
}

// Format SIN (Social Insurance Number) - XXX-XXX-XXX
export function formatSIN(value) {
  const digits = value.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

// Validate SIN format
export function validateSIN(value) {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 9) {
    return { isValid: false, error: 'SIN must be 9 digits' };
  }
  return { isValid: true, error: '' };
}

// Format Canadian postal code - A1A 1A1
export function formatPostalCode(value) {
  const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
  if (cleaned.length <= 3) return cleaned;
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
}

// Validate Canadian postal code
export function validatePostalCode(value) {
  const cleaned = value.replace(/\s/g, '').toUpperCase();
  const postalCodeRegex = /^[A-Z]\d[A-Z]\d[A-Z]\d$/;
  if (!postalCodeRegex.test(cleaned)) {
    return { isValid: false, error: 'Invalid postal code format' };
  }
  return { isValid: true, error: '' };
}
