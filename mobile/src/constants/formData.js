// US States
export const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' },
];

// Canadian Provinces
export const CA_PROVINCES = [
  { value: 'AB', label: 'Alberta' },
  { value: 'BC', label: 'British Columbia' },
  { value: 'MB', label: 'Manitoba' },
  { value: 'NB', label: 'New Brunswick' },
  { value: 'NL', label: 'Newfoundland and Labrador' },
  { value: 'NS', label: 'Nova Scotia' },
  { value: 'NT', label: 'Northwest Territories' },
  { value: 'NU', label: 'Nunavut' },
  { value: 'ON', label: 'Ontario' },
  { value: 'PE', label: 'Prince Edward Island' },
  { value: 'QC', label: 'Quebec' },
  { value: 'SK', label: 'Saskatchewan' },
  { value: 'YT', label: 'Yukon' },
];

// Pay Frequencies
export const PAY_FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-Weekly' },
  { value: 'semimonthly', label: 'Semi-Monthly' },
  { value: 'monthly', label: 'Monthly' },
];

// Filing Statuses
export const FILING_STATUSES = [
  { value: 'single', label: 'Single' },
  { value: 'married_jointly', label: 'Married Filing Jointly' },
  { value: 'married_separately', label: 'Married Filing Separately' },
  { value: 'head_of_household', label: 'Head of Household' },
];

// Payroll Templates
export const PAYROLL_TEMPLATES = [
  { 
    id: 'template-a', 
    name: 'Gusto Style', 
    description: 'Modern, clean design with green accents',
    icon: '🟢',
  },
  { 
    id: 'template-c', 
    name: 'Workday Style', 
    description: 'Professional corporate layout',
    icon: '💼',
  },
  { 
    id: 'template-h', 
    name: 'OnPay Style', 
    description: 'Simple and straightforward format',
    icon: '📄',
  },
];

// Canadian Payroll Templates
export const CANADIAN_TEMPLATES = [
  { 
    id: 'template-h', 
    name: 'Standard Canadian', 
    description: 'Standard Canadian pay stub format',
    icon: '🇨🇦',
  },
  { 
    id: 'template-i', 
    name: 'Quebec Style', 
    description: 'Quebec-specific format with RRQ',
    icon: '⚜️',
  },
];

// W2 Box Descriptions
export const W2_BOXES = {
  box1: 'Wages, tips, other compensation',
  box2: 'Federal income tax withheld',
  box3: 'Social security wages',
  box4: 'Social security tax withheld',
  box5: 'Medicare wages and tips',
  box6: 'Medicare tax withheld',
  box7: 'Social security tips',
  box8: 'Allocated tips',
  box10: 'Dependent care benefits',
  box11: 'Nonqualified plans',
  box12: 'See instructions for box 12',
  box13: 'Statutory employee, Retirement plan, Third-party sick pay',
  box14: 'Other',
};

// Resume Templates
export const RESUME_TEMPLATES = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clean and modern design for corporate roles',
    icon: '💼',
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Bold design for creative industries',
    icon: '🎨',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple and elegant layout',
    icon: '✨',
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Distinguished format for senior roles',
    icon: '🌟',
  },
];

// Common Deductions
export const DEDUCTION_TYPES = [
  { value: 'health_insurance', label: 'Health Insurance', preTax: true },
  { value: 'dental_insurance', label: 'Dental Insurance', preTax: true },
  { value: 'vision_insurance', label: 'Vision Insurance', preTax: true },
  { value: '401k', label: '401(k)', preTax: true },
  { value: 'roth_401k', label: 'Roth 401(k)', preTax: false },
  { value: 'hsa', label: 'HSA', preTax: true },
  { value: 'fsa', label: 'FSA', preTax: true },
  { value: 'life_insurance', label: 'Life Insurance', preTax: false },
  { value: 'union_dues', label: 'Union Dues', preTax: false },
  { value: 'garnishment', label: 'Garnishment', preTax: false },
  { value: 'other', label: 'Other', preTax: false },
];

// Document Prices
export const DOCUMENT_PRICES = {
  paystub: 9.99,
  'canadian-paystub': 9.99,
  w2: 14.99,
  resume: 4.99,
  '1099-nec': 9.99,
  '1099-misc': 9.99,
  'bank-statement': 49.99,
};
