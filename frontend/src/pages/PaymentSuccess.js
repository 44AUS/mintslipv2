import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Mail, HelpCircle, ArrowLeft, FileText, FolderArchive } from 'lucide-react';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderType = searchParams.get('type') || 'paystub';
  const orderId = searchParams.get('order_id');
  const fileCount = parseInt(searchParams.get('count') || '1', 10);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [fileName, setFileName] = useState('');
  const isZipFile = fileCount > 1;
  
  // Retrieve download info from sessionStorage (set by generator before redirect)
  useEffect(() => {
    const storedDownloadUrl = sessionStorage.getItem('lastDownloadUrl');
    const storedFileName = sessionStorage.getItem('lastDownloadFileName');
    if (storedDownloadUrl) {
      setDownloadUrl(storedDownloadUrl);
    }
    if (storedFileName) {
      setFileName(storedFileName);
    }
  }, []);
  
  // Track conversion for Google Analytics
  useEffect(() => {
    // Google Analytics 4 conversion tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: orderId || `order_${Date.now()}`,
        value: orderType === 'paystub' ? 9.99 : 14.99,
        currency: 'USD',
        items: [{
          item_id: orderType,
          item_name: orderType === 'paystub' ? 'Paystub Generator' : 'Document Generator',
          quantity: 1
        }]
      });
      
      // Also fire a conversion event
      window.gtag('event', 'conversion', {
        send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL', // Replace with your actual conversion ID
        value: orderType === 'paystub' ? 9.99 : 14.99,
        currency: 'USD',
        transaction_id: orderId || `order_${Date.now()}`
      });
    }
    
    // Facebook Pixel conversion tracking (if available)
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Purchase', {
        value: orderType === 'paystub' ? 9.99 : 14.99,
        currency: 'USD',
        content_type: 'product',
        content_ids: [orderType]
      });
    }
  }, [orderId, orderType]);

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
        @keyframes circle-fill {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
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
              {/* Pulse ring effect */}
              <div className="absolute w-24 h-24 bg-white/20 rounded-full pulse-ring"></div>
              {/* Main checkmark container */}
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
            {orderId && (
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-sm text-green-700">Order ID</p>
                <p className="font-mono text-lg font-semibold text-green-800">{orderId}</p>
              </div>
            )}
            
            {/* Your Download Section */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <Download className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-slate-800 text-lg">Your Download</h3>
              </div>
              
              <p className="text-sm text-slate-600 mb-4">
                Your document has been downloaded automatically. If it didn't download, click below to download again.
              </p>
              
              {/* Download Button with File Icon */}
              <button
                onClick={() => {
                  if (downloadUrl) {
                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.download = fileName || (isZipFile ? 'documents.zip' : 'document.pdf');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  } else {
                    // Fallback: try to find recent download in browser
                    alert('Your file was downloaded automatically. Check your Downloads folder.');
                  }
                }}
                className="w-full flex items-center gap-4 p-4 bg-white border-2 border-slate-200 hover:border-green-500 hover:bg-green-50 rounded-xl transition-all group cursor-pointer"
              >
                {/* File/Folder Icon */}
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isZipFile ? 'bg-amber-100' : 'bg-red-100'}`}>
                  {isZipFile ? (
                    <FolderArchive className="w-7 h-7 text-amber-600" />
                  ) : (
                    <FileText className="w-7 h-7 text-red-600" />
                  )}
                </div>
                
                {/* File Info */}
                <div className="flex-1 text-left">
                  <p className="font-medium text-slate-800 group-hover:text-green-700 transition-colors">
                    {fileName || (isZipFile ? `Documents (${fileCount} files)` : 'Your Document')}
                  </p>
                  <p className="text-sm text-slate-500">
                    {isZipFile ? 'ZIP Archive' : 'PDF Document'}
                  </p>
                </div>
                
                {/* Download Icon */}
                <div className="w-10 h-10 rounded-full bg-green-100 group-hover:bg-green-600 flex items-center justify-center transition-colors">
                  <Download className="w-5 h-5 text-green-600 group-hover:text-white transition-colors" />
                </div>
              </button>
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
              href="mailto:support@mintslip.com?subject=Support%20Request%20-%20Order%20" 
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
              onClick={() => navigate(orderType === 'canadian-paystub' ? '/canadian-paystub-generator' : '/paystub-generator')}
              className="w-full text-center text-green-600 hover:text-green-700 font-medium py-2"
            >
              Create Another Document →
            </button>
          </div>
        </div>
        
        {/* Footer note */}
        <p className="text-center text-sm text-slate-500 mt-6">
          A confirmation email has been sent to your PayPal email address.
        </p>
      </div>
    </div>
  );
}
