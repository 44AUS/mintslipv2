/**
 * Utility for sending download confirmation emails with PDF attachments
 * PDF is sent to backend in memory (not stored) - respects user privacy
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

/**
 * Convert a Blob to base64 string
 * @param {Blob} blob - The PDF blob
 * @returns {Promise<string>} - Base64 encoded string (without data URI prefix)
 */
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Send download confirmation email with PDF attached
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} [options.userName] - User's name (optional)
 * @param {string} options.documentType - Type of document (paystub, w2, etc.)
 * @param {Blob} options.pdfBlob - The PDF blob to attach
 * @param {string} [options.fileName] - Custom filename (optional)
 * @param {boolean} [options.isGuest] - Whether user is a guest (default: false)
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export const sendDownloadEmailWithPdf = async ({
  email,
  userName = '',
  documentType,
  pdfBlob,
  fileName = null,
  isGuest = false
}) => {
  if (!email || !pdfBlob) {
    console.error('sendDownloadEmailWithPdf: email and pdfBlob are required');
    return { success: false, error: 'Email and PDF are required' };
  }

  try {
    // Convert blob to base64
    const pdfBase64 = await blobToBase64(pdfBlob);
    
    const response = await fetch(`${BACKEND_URL}/api/send-download-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        userName,
        documentType,
        pdfBase64,
        fileName,
        isGuest
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Failed to send download email:', data);
      return { success: false, error: data.detail || 'Failed to send email' };
    }

    console.log('Download email sent successfully with PDF attachment');
    return { success: true, message: data.message };
    
  } catch (error) {
    console.error('Error sending download email with PDF:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Document type to readable name mapping
 */
export const documentTypeNames = {
  'paystub': 'Pay Stub',
  'canadian-paystub': 'Canadian Pay Stub',
  'w2': 'W-2 Form',
  'w9': 'W-9 Form',
  '1099-nec': '1099-NEC Form',
  '1099-misc': '1099-MISC Form',
  'bank-statement': 'Bank Statement',
  'ai-resume': 'AI Resume',
  'offer-letter': 'Offer Letter',
  'schedule-c': 'Schedule C',
  'utility-bill': 'Utility Bill',
  'vehicle-bill-of-sale': 'Vehicle Bill of Sale'
};

/**
 * Generate a filename for the PDF
 * @param {string} documentType - Type of document
 * @returns {string} - Generated filename
 */
export const generatePdfFileName = (documentType) => {
  const docName = documentTypeNames[documentType] || documentType.replace(/-/g, ' ');
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  return `MintSlip_${docName.replace(/\s+/g, '_')}_${date}.pdf`;
};

export default sendDownloadEmailWithPdf;
