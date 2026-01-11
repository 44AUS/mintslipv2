/**
 * Utility for sending download confirmation emails with PDF/ZIP attachments
 * Files are sent to backend in memory (not stored) - respects user privacy
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

/**
 * Convert a Blob to base64 string
 * @param {Blob} blob - The file blob
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
 * Send download confirmation email with file attached (PDF or ZIP)
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} [options.userName] - User's name (optional)
 * @param {string} options.documentType - Type of document (paystub, w2, etc.)
 * @param {Blob} options.fileBlob - The file blob to attach (PDF or ZIP)
 * @param {string} [options.fileName] - Custom filename (optional)
 * @param {boolean} [options.isGuest] - Whether user is a guest (default: false)
 * @param {boolean} [options.isZip] - Whether the file is a ZIP (default: false)
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export const sendDownloadEmailWithPdf = async ({
  email,
  userName = '',
  documentType,
  pdfBlob,  // Keep old name for backward compatibility
  fileBlob = null,  // New name
  fileName = null,
  isGuest = false,
  isZip = false
}) => {
  const blob = fileBlob || pdfBlob;
  
  if (!email || !blob) {
    console.error('sendDownloadEmailWithPdf: email and file blob are required');
    return { success: false, error: 'Email and file are required' };
  }

  try {
    // Convert blob to base64
    const fileBase64 = await blobToBase64(blob);
    
    // Auto-detect if it's a ZIP file based on blob type
    const isZipFile = isZip || blob.type === 'application/zip' || blob.type === 'application/x-zip-compressed';
    
    const response = await fetch(`${BACKEND_URL}/api/send-download-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        userName,
        documentType,
        pdfBase64: fileBase64,  // Keep field name for backend compatibility
        fileName,
        isGuest,
        isZip: isZipFile
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Failed to send download email:', data);
      return { success: false, error: data.detail || 'Failed to send email' };
    }

    console.log('Download email sent successfully with attachment');
    return { success: true, message: data.message };
    
  } catch (error) {
    console.error('Error sending download email with attachment:', error);
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
