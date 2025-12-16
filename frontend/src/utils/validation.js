// Validation utilities for form inputs

/**
 * Format phone number as user types
 * Converts input to (xxx) xxx-xxxx format
 */
export const formatPhoneNumber = (value) => {
  if (!value) return '';
  
  // Remove all non-digits
  const phoneNumber = value.replace(/\D/g, '');
  
  // Limit to 10 digits
  const limited = phoneNumber.slice(0, 10);
  
  // Format based on length
  if (limited.length < 4) {
    return limited;
  } else if (limited.length < 7) {
    return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  } else {
    return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
  }
};

/**
 * Validate phone number format
 */
export const validatePhoneNumber = (value) => {
  if (!value) return { valid: true, error: '' };
  
  // Remove formatting to check digits
  const digits = value.replace(/\D/g, '');
  
  if (digits.length === 0) {
    return { valid: true, error: '' };
  }
  
  if (digits.length !== 10) {
    return { valid: false, error: 'Phone number must be 10 digits' };
  }
  
  return { valid: true, error: '' };
};

/**
 * Format zip code as user types
 * Supports 5-digit (12345) or 5+4 format (12345-6789)
 */
export const formatZipCode = (value) => {
  if (!value) return '';
  
  // Remove all non-digits
  const zipCode = value.replace(/\D/g, '');
  
  // Limit to 9 digits
  const limited = zipCode.slice(0, 9);
  
  // Format based on length
  if (limited.length <= 5) {
    return limited;
  } else {
    return `${limited.slice(0, 5)}-${limited.slice(5)}`;
  }
};

/**
 * Validate zip code format
 */
export const validateZipCode = (value) => {
  if (!value) return { valid: true, error: '' };
  
  // Remove formatting to check digits
  const digits = value.replace(/\D/g, '');
  
  if (digits.length === 0) {
    return { valid: true, error: '' };
  }
  
  if (digits.length !== 5 && digits.length !== 9) {
    return { valid: false, error: 'Zip code must be 5 digits or 5+4 format' };
  }
  
  return { valid: true, error: '' };
};

/**
 * Format SSN last 4 digits
 */
export const formatSSNLast4 = (value) => {
  if (!value) return '';
  
  // Remove all non-digits and limit to 4
  return value.replace(/\D/g, '').slice(0, 4);
};

/**
 * Validate SSN last 4 digits
 */
export const validateSSNLast4 = (value) => {
  if (!value) return { valid: true, error: '' };
  
  const digits = value.replace(/\D/g, '');
  
  if (digits.length === 0) {
    return { valid: true, error: '' };
  }
  
  if (digits.length !== 4) {
    return { valid: false, error: 'Must be exactly 4 digits' };
  }
  
  return { valid: true, error: '' };
};

/**
 * Format bank account last 4 digits
 */
export const formatBankLast4 = (value) => {
  if (!value) return '';
  
  // Remove all non-digits and limit to 4
  return value.replace(/\D/g, '').slice(0, 4);
};

/**
 * Validate bank account last 4 digits
 */
export const validateBankLast4 = (value) => {
  if (!value) return { valid: true, error: '' };
  
  const digits = value.replace(/\D/g, '');
  
  if (digits.length === 0) {
    return { valid: true, error: '' };
  }
  
  if (digits.length !== 4) {
    return { valid: false, error: 'Must be exactly 4 digits' };
  }
  
  return { valid: true, error: '' };
};

/**
 * Format EIN (Employer Identification Number)
 * Format: xx-xxxxxxx
 */
export const formatEIN = (value) => {
  if (!value) return '';
  
  // Remove all non-digits
  const ein = value.replace(/\D/g, '');
  
  // Limit to 9 digits
  const limited = ein.slice(0, 9);
  
  // Format based on length
  if (limited.length <= 2) {
    return limited;
  } else {
    return `${limited.slice(0, 2)}-${limited.slice(2)}`;
  }
};

/**
 * Validate EIN format
 */
export const validateEIN = (value) => {
  if (!value) return { valid: true, error: '' };
  
  // Remove formatting to check digits
  const digits = value.replace(/\D/g, '');
  
  if (digits.length === 0) {
    return { valid: true, error: '' };
  }
  
  if (digits.length !== 9) {
    return { valid: false, error: 'EIN must be 9 digits (xx-xxxxxxx)' };
  }
  
  return { valid: true, error: '' };
};

/**
 * Format full SSN
 * Format: xxx-xx-xxxx
 */
export const formatFullSSN = (value) => {
  if (!value) return '';
  
  // Remove all non-digits
  const ssn = value.replace(/\D/g, '');
  
  // Limit to 9 digits
  const limited = ssn.slice(0, 9);
  
  // Format based on length
  if (limited.length <= 3) {
    return limited;
  } else if (limited.length <= 5) {
    return `${limited.slice(0, 3)}-${limited.slice(3)}`;
  } else {
    return `${limited.slice(0, 3)}-${limited.slice(3, 5)}-${limited.slice(5)}`;
  }
};

/**
 * Validate full SSN format
 */
export const validateFullSSN = (value) => {
  if (!value) return { valid: true, error: '' };
  
  // Remove formatting to check digits
  const digits = value.replace(/\D/g, '');
  
  if (digits.length === 0) {
    return { valid: true, error: '' };
  }
  
  if (digits.length !== 9) {
    return { valid: false, error: 'SSN must be 9 digits (xxx-xx-xxxx)' };
  }
  
  return { valid: true, error: '' };
};

/**
 * Format account number (digits only)
 */
export const formatAccountNumber = (value) => {
  if (!value) return '';
  
  // Remove all non-digits
  return value.replace(/\D/g, '');
};

/**
 * Validate account number
 */
export const validateAccountNumber = (value) => {
  if (!value) return { valid: true, error: '' };
  
  const digits = value.replace(/\D/g, '');
  
  if (digits.length === 0) {
    return { valid: true, error: '' };
  }
  
  if (digits.length < 4) {
    return { valid: false, error: 'Account number must be at least 4 digits' };
  }
  
  if (digits.length > 17) {
    return { valid: false, error: 'Account number cannot exceed 17 digits' };
  }
  
  return { valid: true, error: '' };
};
