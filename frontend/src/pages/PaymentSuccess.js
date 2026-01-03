import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Mail, HelpCircle, ArrowLeft, FileText, FolderArchive, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// Import all generators
import { generateAndDownloadPaystub } from '@/utils/paystubGenerator';
import { generateAndDownloadW2 } from '@/utils/w2Generator';
import { generateAndDownloadW9 } from '@/utils/w9Generator';
import { generateAndDownloadBankStatement } from '@/utils/bankStatementGenerator';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderType = searchParams.get('type') || 'paystub';
  const sessionId = searchParams.get('session_id');
  const fileCount = parseInt(searchParams.get('count') || '1', 10);
  
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isVerifying, setIsVerifying] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [error, setError] = useState(null);
  const [documentGenerated, setDocumentGenerated] = useState(false);
  
  const isZipFile = fileCount > 1;

  // Clear any stale download data at the start of a new payment verification
  useEffect(() => {
    // Clear old download URLs when a new session starts
    if (sessionId) {
      localStorage.removeItem('lastDownloadUrl');
      localStorage.removeItem('lastDownloadFileName');
    }
  }, [sessionId]);

  // Verify payment and generate document
  const verifyAndGenerate = useCallback(async () => {
    if (!sessionId) {
      // No session ID - show error (don't use old cached data)
      setError('No payment session found. Please contact support if you were charged.');
      setIsVerifying(false);
      return;
    }

    try {
      // Step 1: Verify payment with backend
      const response = await fetch(`${BACKEND_URL}/api/stripe/checkout-status/${sessionId}`);
      
      if (!response.ok) {
        // API error - could be invalid session ID
        console.error('Checkout status API error:', response.status);
        // Still try to generate if we have form data - user might have paid
        setPaymentVerified(true);
        setIsVerifying(false);
        await generateDocument();
        return;
      }
      
      const data = await response.json();

      if (data.payment_status === 'paid' || data.status === 'complete') {
        setPaymentVerified(true);
        setIsVerifying(false);
        
        // Step 2: Generate document if we have pending data
        await generateDocument();
      } else if (data.status === 'expired') {
        setError('Payment session expired. Please try again.');
        setIsVerifying(false);
      } else if (data.status === 'open') {
        // Payment still processing, poll again (max 10 times)
        const pollCount = parseInt(sessionStorage.getItem('paymentPollCount') || '0');
        if (pollCount < 10) {
          sessionStorage.setItem('paymentPollCount', (pollCount + 1).toString());
          setTimeout(verifyAndGenerate, 2000);
        } else {
          // Stop polling, assume payment succeeded and try to generate
          sessionStorage.removeItem('paymentPollCount');
          setPaymentVerified(true);
          setIsVerifying(false);
          await generateDocument();
        }
      } else {
        // Unknown status - assume payment and try to generate
        setPaymentVerified(true);
        setIsVerifying(false);
        await generateDocument();
      }
    } catch (err) {
      console.error('Error verifying payment:', err);
      // Network error - still try to generate if we have form data
      setPaymentVerified(true);
      setIsVerifying(false);
      await generateDocument();
    }
  }, [sessionId]);

  // Generate document based on type
  const generateDocument = async () => {
    setIsGenerating(true);
    
    try {
      let generated = false;
      
      if (orderType === 'paystub') {
        const formDataStr = localStorage.getItem('pendingPaystubData');
        const template = localStorage.getItem('pendingPaystubTemplate') || 'template-a';
        const numStubs = parseInt(localStorage.getItem('pendingPaystubCount') || '1', 10);
        
        if (formDataStr) {
          const formData = JSON.parse(formDataStr);
          console.log('Generating paystub with stored data...', { template, numStubs });
          
          // Generate paystub - pass numStubs for ZIP generation when multiple
          await generateAndDownloadPaystub(formData, template, numStubs);
          generated = true;
          
          // DON'T clear form data yet - user may need to re-download
          // Data will be cleared when they start a new payment flow
          
          toast.success(numStubs > 1 ? `Your ${numStubs} paystubs have been downloaded!` : 'Your paystub has been downloaded!');
        }
      } else if (orderType === 'w2') {
        const formDataStr = localStorage.getItem('pendingW2Data');
        
        if (formDataStr) {
          const formData = JSON.parse(formDataStr);
          const taxYear = localStorage.getItem('pendingW2TaxYear') || '2024';
          
          await generateAndDownloadW2(formData, taxYear);
          generated = true;
          
          localStorage.removeItem('pendingW2Data');
          localStorage.removeItem('pendingW2TaxYear');
          
          toast.success('Your W-2 has been downloaded!');
        }
      } else if (orderType === 'w9') {
        const formDataStr = localStorage.getItem('pendingW9Data');
        
        if (formDataStr) {
          const formData = JSON.parse(formDataStr);
          
          await generateAndDownloadW9(formData);
          generated = true;
          
          localStorage.removeItem('pendingW9Data');
          
          toast.success('Your W-9 has been downloaded!');
        }
      } else if (orderType === 'bank-statement') {
        const formDataStr = localStorage.getItem('pendingBankStatementData');
        
        if (formDataStr) {
          const formData = JSON.parse(formDataStr);
          const template = localStorage.getItem('pendingBankStatementTemplate') || 'chase';
          
          await generateAndDownloadBankStatement(formData, template);
          generated = true;
          
          localStorage.removeItem('pendingBankStatementData');
          localStorage.removeItem('pendingBankStatementTemplate');
          
          toast.success('Your bank statement has been downloaded!');
        }
      }
      // Add more document types as needed...
      
      if (generated) {
        setDocumentGenerated(true);
        
        // Check for stored download URL from the generator
        const storedUrl = localStorage.getItem('lastDownloadUrl');
        const storedName = localStorage.getItem('lastDownloadFileName');
        if (storedUrl) {
          setDownloadUrl(storedUrl);
          setFileName(storedName || getDefaultFileName(orderType, fileCount));
        } else {
          setFileName(getDefaultFileName(orderType, fileCount));
        }
      } else {
        // No stored data found - show manual download option
        console.log('No stored form data found for type:', orderType);
        setError('Unable to generate document automatically. Your form data may have been lost. Please try creating your document again.');
      }
    } catch (err) {
      console.error('Error generating document:', err);
      setError('There was an issue generating your document. Please contact support.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getDefaultFileName = (type, count) => {
    const names = {
      'paystub': count > 1 ? `paystubs_${count}.zip` : 'paystub.pdf',
      'canadian-paystub': count > 1 ? `canadian_paystubs_${count}.zip` : 'canadian_paystub.pdf',
      'w2': 'w2_form.pdf',
      'w9': 'w9_form.pdf',
      '1099-misc': '1099_misc.pdf',
      '1099-nec': '1099_nec.pdf',
      'bank-statement': 'bank_statement.pdf',
      'offer-letter': 'offer_letter.pdf',
      'schedule-c': 'schedule_c.pdf',
      'utility-bill': 'utility_bill.pdf',
      'vehicle-bill-of-sale': 'vehicle_bill_of_sale.pdf',
      'ai-resume': 'resume.zip'
    };
    return names[type] || 'document.pdf';
  };

  const getDocumentTypeDisplay = (type) => {
    const names = {
      'paystub': 'Pay Stub',
      'canadian-paystub': 'Canadian Pay Stub',
      'w2': 'W-2 Form',
      'w9': 'W-9 Form',
      '1099-misc': '1099-MISC Form',
      '1099-nec': '1099-NEC Form',
      'bank-statement': 'Bank Statement',
      'offer-letter': 'Offer Letter',
      'schedule-c': 'Schedule C',
      'utility-bill': 'Utility Bill',
      'vehicle-bill-of-sale': 'Vehicle Bill of Sale',
      'ai-resume': 'AI Resume'
    };
    return names[type] || 'Document';
  };

  // Handle manual re-download - regenerate the document
  const handleRedownload = async () => {
    setIsGenerating(true);
    toast.info('Preparing your download...');
    
    try {
      // Try to regenerate using stored form data
      let regenerated = false;
      
      if (orderType === 'paystub') {
        const formDataStr = localStorage.getItem('pendingPaystubData');
        const template = localStorage.getItem('pendingPaystubTemplate') || 'template-a';
        const numStubs = parseInt(localStorage.getItem('pendingPaystubCount') || fileCount.toString(), 10);
        
        if (formDataStr) {
          const formData = JSON.parse(formDataStr);
          await generateAndDownloadPaystub(formData, template, numStubs);
          regenerated = true;
          toast.success('Download started!');
        }
      } else if (orderType === 'w2') {
        const formDataStr = localStorage.getItem('pendingW2Data');
        if (formDataStr) {
          const formData = JSON.parse(formDataStr);
          const taxYear = localStorage.getItem('pendingW2TaxYear') || '2024';
          await generateAndDownloadW2(formData, taxYear);
          regenerated = true;
          toast.success('Download started!');
        }
      } else if (orderType === 'w9') {
        const formDataStr = localStorage.getItem('pendingW9Data');
        if (formDataStr) {
          const formData = JSON.parse(formDataStr);
          await generateAndDownloadW9(formData);
          regenerated = true;
          toast.success('Download started!');
        }
      } else if (orderType === 'bank-statement') {
        const formDataStr = localStorage.getItem('pendingBankStatementData');
        if (formDataStr) {
          const formData = JSON.parse(formDataStr);
          const template = localStorage.getItem('pendingBankStatementTemplate') || 'chase';
          await generateAndDownloadBankStatement(formData, template);
          regenerated = true;
          toast.success('Download started!');
        }
      }
      
      if (!regenerated) {
        // Try using blob URL as last resort
        if (downloadUrl) {
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = fileName || 'document.pdf';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success('Download started!');
        } else {
          toast.error('Unable to download. Please try creating your document again.');
        }
      }
    } catch (err) {
      console.error('Error regenerating document:', err);
      toast.error('Download failed. Please try creating your document again.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    verifyAndGenerate();
  }, [verifyAndGenerate]);

  // Track conversion for Google Analytics
  useEffect(() => {
    if (paymentVerified && typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: sessionId || `order_${Date.now()}`,
        value: orderType === 'paystub' ? 9.99 : 14.99,
        currency: 'USD',
        items: [{
          item_id: orderType,
          item_name: getDocumentTypeDisplay(orderType),
          quantity: 1
        }]
      });
    }
  }, [paymentVerified, sessionId, orderType]);

  // Loading state while verifying payment
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          <div className="bg-white rounded-2xl shadow-xl border border-green-100 p-8">
            <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Verifying Payment...</h2>
            <p className="text-slate-600">Please wait while we confirm your payment.</p>
          </div>
        </div>
      </div>
    );
  }

  // Generating state
  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          <div className="bg-white rounded-2xl shadow-xl border border-green-100 p-8">
            <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Generating Your Document...</h2>
            <p className="text-slate-600">Your {getDocumentTypeDisplay(orderType)} is being created.</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !paymentVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-amber-100 p-8">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 text-center mb-2">Something Went Wrong</h2>
            <p className="text-slate-600 text-center mb-6">{error}</p>
            <div className="space-y-3">
              <Button 
                onClick={() => navigate(`/${orderType}-generator`)}
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                Try Again
              </Button>
              <a 
                href="mailto:support@mintslip.com?subject=Payment%20Issue" 
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium transition-colors"
              >
                <Mail className="w-5 h-5" />
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      {/* CSS Animation Styles */}
      <style>{`
        @keyframes checkmark-pop {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes checkmark-draw {
          0% { stroke-dashoffset: 50; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        .checkmark-container {
          animation: checkmark-pop 0.5s ease-out forwards;
        }
        .checkmark-icon {
          animation: checkmark-draw 0.6s ease-out 0.3s forwards;
        }
        .pulse-ring {
          animation: pulse-ring 1.5s ease-out infinite;
        }
      `}</style>
      
      <div className="max-w-lg w-full">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-green-100 overflow-hidden">
          {/* Header with animated checkmark */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-10 text-center">
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute w-24 h-24 bg-white/20 rounded-full pulse-ring"></div>
              <div className="checkmark-container relative inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg">
                <svg 
                  className="w-12 h-12" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path 
                    className="checkmark-icon text-green-600" 
                    d="M5 13l4 4L19 7"
                    style={{ 
                      stroke: '#16a34a',
                      strokeDasharray: 50,
                      strokeDashoffset: 50 
                    }}
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 mt-4">Payment Successful!</h1>
            <p className="text-green-100">Thank you for your purchase</p>
          </div>
          
          {/* Content */}
          <div className="px-8 py-8 space-y-6">
            {/* Order confirmation */}
            {sessionId && (
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-sm text-green-700">Session ID</p>
                <p className="font-mono text-sm font-semibold text-green-800 truncate">{sessionId}</p>
              </div>
            )}
            
            {/* Your Download Section */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <Download className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-slate-800 text-lg">Your Download</h3>
              </div>
              
              {documentGenerated ? (
                <>
                  <p className="text-sm text-slate-600 mb-4">
                    Your {getDocumentTypeDisplay(orderType)} has been downloaded. If it didn't download, click below to download again.
                  </p>
                  
                  <button
                    onClick={handleRedownload}
                    className="w-full flex items-center gap-4 p-4 bg-white border-2 border-slate-200 hover:border-green-500 hover:bg-green-50 rounded-xl transition-all group cursor-pointer"
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isZipFile ? 'bg-amber-100' : 'bg-red-100'}`}>
                      {isZipFile ? (
                        <FolderArchive className="w-7 h-7 text-amber-600" />
                      ) : (
                        <FileText className="w-7 h-7 text-red-600" />
                      )}
                    </div>
                    
                    <div className="flex-1 text-left">
                      <p className="font-medium text-slate-800 group-hover:text-green-700 transition-colors">
                        {fileName || getDefaultFileName(orderType, fileCount)}
                      </p>
                      <p className="text-sm text-slate-500">
                        {isZipFile ? 'ZIP Archive' : 'PDF Document'}
                      </p>
                    </div>
                    
                    <div className="w-10 h-10 rounded-full bg-green-100 group-hover:bg-green-600 flex items-center justify-center transition-colors">
                      <Download className="w-5 h-5 text-green-600 group-hover:text-white transition-colors" />
                    </div>
                  </button>
                </>
              ) : (
                <div className="text-center py-4">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 mb-4">
                    {error || 'We couldn\'t automatically generate your document. Please try creating it again.'}
                  </p>
                  <Button 
                    onClick={() => navigate(`/${orderType}-generator`)}
                    variant="outline"
                    className="border-amber-500 text-amber-600 hover:bg-amber-50"
                  >
                    Create Document Again
                  </Button>
                </div>
              )}
            </div>
            
            {/* Support info */}
            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
              <HelpCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-800">Need Help?</h3>
                <p className="text-sm text-slate-600 mt-1">
                  If you have any issues or questions about your document, please don't hesitate to contact us.
                </p>
              </div>
            </div>
            
            {/* Contact button */}
            <a 
              href={`mailto:support@mintslip.com?subject=Support%20Request%20-%20${sessionId || 'Order'}`} 
              className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium transition-colors"
            >
              <Mail className="w-5 h-5" />
              Contact Support
            </a>
            
            {/* Divider */}
            <div className="border-t border-slate-200"></div>
            
            {/* Back button */}
            <Button 
              onClick={() => navigate('/')}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold rounded-xl"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Home
            </Button>
            
            {/* Create another */}
            <button
              onClick={() => navigate(`/${orderType === 'canadian-paystub' ? 'canadian-paystub' : orderType}-generator`)}
              className="w-full text-center text-green-600 hover:text-green-700 font-medium py-2"
            >
              Create Another Document →
            </button>
          </div>
        </div>
        
        {/* Footer note */}
        <p className="text-center text-sm text-slate-500 mt-6">
          A confirmation email has been sent to your email address.
        </p>
      </div>
    </div>
  );
}
