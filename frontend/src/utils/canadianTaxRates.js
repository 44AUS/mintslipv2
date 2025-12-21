// Canadian Tax Rates for 2024/2025
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

// CPP (Canada Pension Plan) - 2024 rates
export const CPP_RATE = 0.0595; // 5.95% employee contribution
export const CPP_MAX_PENSIONABLE_EARNINGS = 68500;
export const CPP_BASIC_EXEMPTION = 3500;
export const CPP_MAX_CONTRIBUTION = (CPP_MAX_PENSIONABLE_EARNINGS - CPP_BASIC_EXEMPTION) * CPP_RATE; // $3,867.50

// QPP (Quebec Pension Plan) - 2024 rates (Quebec uses QPP instead of CPP)
export const QPP_RATE = 0.064; // 6.40% employee contribution
export const QPP_MAX_PENSIONABLE_EARNINGS = 68500;
export const QPP_BASIC_EXEMPTION = 3500;
export const QPP_MAX_CONTRIBUTION = (QPP_MAX_PENSIONABLE_EARNINGS - QPP_BASIC_EXEMPTION) * QPP_RATE; // $4,160

// EI (Employment Insurance) - 2024 rates
export const EI_RATE = 0.0166; // 1.66% for most provinces
export const EI_RATE_QUEBEC = 0.0132; // 1.32% for Quebec (reduced due to QPIP)
export const EI_MAX_INSURABLE_EARNINGS = 63200;
export const EI_MAX_CONTRIBUTION = EI_MAX_INSURABLE_EARNINGS * EI_RATE; // $1,049.12
export const EI_MAX_CONTRIBUTION_QUEBEC = EI_MAX_INSURABLE_EARNINGS * EI_RATE_QUEBEC; // $834.24

// QPIP (Quebec Parental Insurance Plan) - 2024 rates (Quebec only)
export const QPIP_RATE = 0.00494; // 0.494% employee contribution
export const QPIP_MAX_INSURABLE_EARNINGS = 94000;
export const QPIP_MAX_CONTRIBUTION = QPIP_MAX_INSURABLE_EARNINGS * QPIP_RATE; // $464.36

// Federal Tax Brackets 2024
export const FEDERAL_TAX_BRACKETS = [
  { min: 0, max: 55867, rate: 0.15 },
  { min: 55867, max: 111733, rate: 0.205 },
  { min: 111733, max: 173205, rate: 0.26 },
  { min: 173205, max: 246752, rate: 0.29 },
  { min: 246752, max: Infinity, rate: 0.33 },
];

// Federal Basic Personal Amount 2024
export const FEDERAL_BASIC_PERSONAL_AMOUNT = 15705;

// Provincial Tax Brackets 2024
export const PROVINCIAL_TAX_BRACKETS = {
  AB: [ // Alberta - flat tax
    { min: 0, max: Infinity, rate: 0.10 },
  ],
  BC: [ // British Columbia
    { min: 0, max: 47937, rate: 0.0506 },
    { min: 47937, max: 95875, rate: 0.077 },
    { min: 95875, max: 110076, rate: 0.105 },
    { min: 110076, max: 133664, rate: 0.1229 },
    { min: 133664, max: 181232, rate: 0.147 },
    { min: 181232, max: 252752, rate: 0.168 },
    { min: 252752, max: Infinity, rate: 0.205 },
  ],
  MB: [ // Manitoba
    { min: 0, max: 47000, rate: 0.108 },
    { min: 47000, max: 100000, rate: 0.1275 },
    { min: 100000, max: Infinity, rate: 0.174 },
  ],
  NB: [ // New Brunswick
    { min: 0, max: 49958, rate: 0.094 },
    { min: 49958, max: 99916, rate: 0.14 },
    { min: 99916, max: 185064, rate: 0.16 },
    { min: 185064, max: Infinity, rate: 0.195 },
  ],
  NL: [ // Newfoundland and Labrador
    { min: 0, max: 43198, rate: 0.087 },
    { min: 43198, max: 86395, rate: 0.145 },
    { min: 86395, max: 154244, rate: 0.158 },
    { min: 154244, max: 215943, rate: 0.178 },
    { min: 215943, max: 275870, rate: 0.198 },
    { min: 275870, max: 551739, rate: 0.208 },
    { min: 551739, max: 1103478, rate: 0.213 },
    { min: 1103478, max: Infinity, rate: 0.218 },
  ],
  NS: [ // Nova Scotia
    { min: 0, max: 29590, rate: 0.0879 },
    { min: 29590, max: 59180, rate: 0.1495 },
    { min: 59180, max: 93000, rate: 0.1667 },
    { min: 93000, max: 150000, rate: 0.175 },
    { min: 150000, max: Infinity, rate: 0.21 },
  ],
  NT: [ // Northwest Territories
    { min: 0, max: 50597, rate: 0.059 },
    { min: 50597, max: 101198, rate: 0.086 },
    { min: 101198, max: 164525, rate: 0.122 },
    { min: 164525, max: Infinity, rate: 0.1405 },
  ],
  NU: [ // Nunavut
    { min: 0, max: 53268, rate: 0.04 },
    { min: 53268, max: 106537, rate: 0.07 },
    { min: 106537, max: 173205, rate: 0.09 },
    { min: 173205, max: Infinity, rate: 0.115 },
  ],
  ON: [ // Ontario
    { min: 0, max: 51446, rate: 0.0505 },
    { min: 51446, max: 102894, rate: 0.0915 },
    { min: 102894, max: 150000, rate: 0.1116 },
    { min: 150000, max: 220000, rate: 0.1216 },
    { min: 220000, max: Infinity, rate: 0.1316 },
  ],
  PE: [ // Prince Edward Island
    { min: 0, max: 32656, rate: 0.098 },
    { min: 32656, max: 64313, rate: 0.138 },
    { min: 64313, max: 105000, rate: 0.167 },
    { min: 105000, max: 140000, rate: 0.1775 },
    { min: 140000, max: Infinity, rate: 0.19 },
  ],
  QC: [ // Quebec
    { min: 0, max: 51780, rate: 0.14 },
    { min: 51780, max: 103545, rate: 0.19 },
    { min: 103545, max: 126000, rate: 0.24 },
    { min: 126000, max: Infinity, rate: 0.2575 },
  ],
  SK: [ // Saskatchewan
    { min: 0, max: 52057, rate: 0.105 },
    { min: 52057, max: 148734, rate: 0.125 },
    { min: 148734, max: Infinity, rate: 0.145 },
  ],
  YT: [ // Yukon
    { min: 0, max: 55867, rate: 0.064 },
    { min: 55867, max: 111733, rate: 0.09 },
    { min: 111733, max: 173205, rate: 0.109 },
    { min: 173205, max: 500000, rate: 0.128 },
    { min: 500000, max: Infinity, rate: 0.15 },
  ],
};

// Provincial Basic Personal Amounts 2024
export const PROVINCIAL_BASIC_PERSONAL_AMOUNTS = {
  AB: 21003,
  BC: 12580,
  MB: 15780,
  NB: 13044,
  NL: 10818,
  NS: 8481,
  NT: 17373,
  NU: 18767,
  ON: 12399,
  PE: 13500,
  QC: 18056, // Quebec uses different system
  SK: 18491,
  YT: 15705,
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
export function calculateCanadianTaxes(grossPay, payFrequency, provinceCode, ytdEarnings = 0, federalAllowances = 0, provincialAllowances = 0) {
  const isQuebec = provinceCode === 'QC';
  const periodsPerYear = payFrequency === 'weekly' ? 52 : 26;
  const annualizedIncome = grossPay * periodsPerYear;
  
  // CPP/QPP
  const cpp = calculateCPP(grossPay, payFrequency, ytdEarnings, isQuebec);
  
  // EI
  const ei = calculateEI(grossPay, payFrequency, ytdEarnings, isQuebec);
  
  // QPIP (Quebec only)
  const qpip = isQuebec ? calculateQPIP(grossPay, payFrequency, ytdEarnings) : 0;
  
  // Federal Tax (per period)
  // Federal allowances reduce taxable income - each allowance is worth approximately $2,500 in 2024
  const federalAllowanceCredit = (parseFloat(federalAllowances) || 0) * 2500;
  const adjustedFederalIncome = Math.max(0, annualizedIncome - federalAllowanceCredit);
  const annualFederalTax = calculateFederalTax(adjustedFederalIncome);
  const federalTax = annualFederalTax / periodsPerYear;
  
  // Provincial Tax (per period)
  // Provincial allowances reduce taxable income - each allowance is worth approximately $2,000 in 2024
  const provincialAllowanceCredit = (parseFloat(provincialAllowances) || 0) * 2000;
  const adjustedProvincialIncome = Math.max(0, annualizedIncome - provincialAllowanceCredit);
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
