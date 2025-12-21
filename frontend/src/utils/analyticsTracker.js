// Google Analytics 4 Event Tracking for MintSlip
// This sends custom events to track document generation and revenue

// GA4 Measurement ID (from your index.html)
const GA_MEASUREMENT_ID = 'G-L409EVV9LG';

/**
 * Track a document generation event
 * @param {string} documentType - Type of document (paystub, w2, bank_statement, etc.)
 * @param {string} template - Template used (optional)
 * @param {number} amount - Payment amount in USD
 * @param {string} paymentMethod - Payment method (paypal, etc.)
 */
export const trackDocumentGenerated = (documentType, template = null, amount = 0, paymentMethod = 'paypal') => {
  // Check if gtag is available
  if (typeof window !== 'undefined' && window.gtag) {
    // Send purchase event (for revenue tracking)
    window.gtag('event', 'purchase', {
      transaction_id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      value: amount,
      currency: 'USD',
      items: [{
        item_id: documentType,
        item_name: getDocumentName(documentType),
        item_category: 'document',
        item_variant: template || 'default',
        price: amount,
        quantity: 1
      }]
    });

    // Send custom document_generated event
    window.gtag('event', 'document_generated', {
      document_type: documentType,
      template: template || 'default',
      amount: amount,
      payment_method: paymentMethod
    });

    console.log(`[Analytics] Tracked: ${documentType}, $${amount}`);
  } else {
    console.warn('[Analytics] gtag not available');
  }
};

/**
 * Track a document preview event
 * @param {string} documentType - Type of document
 */
export const trackDocumentPreview = (documentType) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'document_preview', {
      document_type: documentType
    });
  }
};

/**
 * Track form start event
 * @param {string} documentType - Type of document form started
 */
export const trackFormStart = (documentType) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'form_start', {
      document_type: documentType
    });
  }
};

/**
 * Track payment initiated event
 * @param {string} documentType - Type of document
 * @param {number} amount - Payment amount
 */
export const trackPaymentInitiated = (documentType, amount) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'begin_checkout', {
      currency: 'USD',
      value: amount,
      items: [{
        item_id: documentType,
        item_name: getDocumentName(documentType),
        price: amount,
        quantity: 1
      }]
    });
  }
};

/**
 * Get human-readable document name
 */
const getDocumentName = (documentType) => {
  const names = {
    'paystub': 'Paystub',
    'w2': 'W-2 Form',
    'w9': 'W-9 Form',
    '1099-nec': '1099-NEC Form',
    '1099-misc': '1099-MISC Form',
    'bank_statement': 'Bank Statement',
    'offer_letter': 'Offer Letter',
    'schedule_c': 'Schedule C',
    'vehicle_bill_of_sale': 'Vehicle Bill of Sale',
    'utility_bill': 'Utility Bill',
    'canadian_paystub': 'Canadian Paystub'
  };
  return names[documentType] || documentType;
};

/**
 * Document prices for reference
 */
export const DOCUMENT_PRICES = {
  'paystub': 9.99,
  'w2': 15.00,
  'w9': 10.00,
  '1099-nec': 12.00,
  '1099-misc': 12.00,
  'bank_statement': 50.00,
  'bank_statement_premium': 70.00,
  'offer_letter': 9.99,
  'schedule_c': 15.00,
  'vehicle_bill_of_sale': 10.00,
  'utility_bill': 10.00,
  'canadian_paystub': 9.99
};
