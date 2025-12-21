// Google Analytics 4 Event Tracking + Local Storage for MintSlip
// This sends custom events to GA AND stores locally for dashboard display

const GA_MEASUREMENT_ID = 'G-L409EVV9LG';
const STORAGE_KEY = 'mintslip_analytics';

/**
 * Get stored analytics data
 */
export const getStoredAnalytics = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading analytics:', e);
  }
  return { documents: [], lastUpdated: null };
};

/**
 * Save analytics data to localStorage
 */
const saveAnalytics = (data) => {
  try {
    data.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving analytics:', e);
  }
};

/**
 * Track a document generation event
 */
export const trackDocumentGenerated = (documentType, template = null, amount = 0, paymentMethod = 'paypal') => {
  const timestamp = new Date().toISOString();
  const entry = {
    id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    documentType,
    template: template || 'default',
    amount,
    paymentMethod,
    timestamp,
    date: timestamp.split('T')[0] // YYYY-MM-DD format
  };

  // Save to localStorage
  const data = getStoredAnalytics();
  data.documents.push(entry);
  
  // Keep only last 1000 entries to prevent storage overflow
  if (data.documents.length > 1000) {
    data.documents = data.documents.slice(-1000);
  }
  
  saveAnalytics(data);

  // Also send to Google Analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: entry.id,
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

    window.gtag('event', 'document_generated', {
      document_type: documentType,
      template: template || 'default',
      amount: amount,
      payment_method: paymentMethod
    });
  }

  console.log(`[Analytics] Tracked: ${documentType}, $${amount}`);
  return entry;
};

/**
 * Get analytics summary for dashboard
 */
export const getAnalyticsSummary = (days = 30) => {
  const data = getStoredAnalytics();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  // Filter documents within date range
  const filtered = data.documents.filter(doc => new Date(doc.timestamp) >= cutoffDate);
  
  // Calculate totals
  const totalDocuments = filtered.length;
  const totalRevenue = filtered.reduce((sum, doc) => sum + (doc.amount || 0), 0);
  
  // Group by document type
  const documentsByType = {};
  const revenueByType = {};
  
  filtered.forEach(doc => {
    const type = doc.documentType || 'unknown';
    documentsByType[type] = (documentsByType[type] || 0) + 1;
    revenueByType[type] = (revenueByType[type] || 0) + (doc.amount || 0);
  });
  
  // Daily stats for charts
  const dailyStats = {};
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    const dateStr = date.toISOString().split('T')[0];
    dailyStats[dateStr] = { date: dateStr, documents: 0, revenue: 0 };
  }
  
  filtered.forEach(doc => {
    const dateStr = doc.date;
    if (dailyStats[dateStr]) {
      dailyStats[dateStr].documents += 1;
      dailyStats[dateStr].revenue += (doc.amount || 0);
    }
  });
  
  const dailyArray = Object.values(dailyStats).map(day => ({
    ...day,
    dateLabel: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }));
  
  // Document type data for pie chart
  const typeData = Object.entries(documentsByType).map(([name, value]) => ({
    name: getDocumentName(name),
    value,
    revenue: revenueByType[name] || 0
  })).sort((a, b) => b.value - a.value);
  
  return {
    totalDocuments,
    totalRevenue,
    documentsByType,
    revenueByType,
    dailyStats: dailyArray,
    typeData,
    recentDocuments: filtered.slice(-10).reverse()
  };
};

/**
 * Clear all stored analytics (for testing)
 */
export const clearAnalytics = () => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * Add sample data for testing
 */
export const addSampleData = () => {
  const types = ['paystub', 'w2', 'bank_statement', '1099-nec', 'offer_letter', 'w9'];
  const prices = { paystub: 9.99, w2: 15.00, bank_statement: 50.00, '1099-nec': 12.00, offer_letter: 9.99, w9: 10.00 };
  
  const data = getStoredAnalytics();
  
  // Generate 30 days of sample data
  for (let i = 30; i >= 0; i--) {
    const numDocs = Math.floor(Math.random() * 8) + 2; // 2-10 docs per day
    
    for (let j = 0; j < numDocs; j++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
      
      data.documents.push({
        id: `sample_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        documentType: type,
        template: 'default',
        amount: prices[type],
        paymentMethod: 'paypal',
        timestamp: date.toISOString(),
        date: date.toISOString().split('T')[0]
      });
    }
  }
  
  saveAnalytics(data);
  return data.documents.length;
};

/**
 * Get human-readable document name
 */
const getDocumentName = (documentType) => {
  const names = {
    'paystub': 'Paystub',
    'w2': 'W-2 Form',
    'w9': 'W-9 Form',
    '1099-nec': '1099-NEC',
    '1099-misc': '1099-MISC',
    'bank_statement': 'Bank Statement',
    'offer_letter': 'Offer Letter',
    'schedule_c': 'Schedule C',
    'vehicle_bill_of_sale': 'Vehicle Bill of Sale',
    'utility_bill': 'Utility Bill',
    'canadian_paystub': 'Canadian Paystub'
  };
  return names[documentType] || documentType;
};

export { getDocumentName };
