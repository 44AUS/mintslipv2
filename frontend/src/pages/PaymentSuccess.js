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
      <div className="max-w-lg w-full">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-green-100 overflow-hidden">
          {/* Header with checkmark */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-10 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4 shadow-lg">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
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
            
            {/* Download info */}
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
              <Download className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-800">Your Download</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Your document has been downloaded automatically. Check your downloads folder for the PDF file.
                </p>
              </div>
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
