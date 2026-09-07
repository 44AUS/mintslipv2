import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Mail, HelpCircle, ArrowLeft, FileText, FolderArchive, AlertCircle } from 'lucide-react';
import { IonProgressBar } from '@ionic/react';
import { toast } from "@/utils/toast";

// Import all generators
import { generateAndDownloadPaystub, getIndividualPaystubFilename, getMultiplePaystubsZipFilename } from '@/utils/paystubGenerator';
import {
  generateAndDownloadCanadianPaystub,
  getIndividualPaystubFilename as getCanadianPaystubFilename,
  getMultiplePaystubsZipFilename as getCanadianPaystubsZipFilename,
} from '@/utils/canadianPaystubGenerator';
import { generateAndDownloadW2 } from '@/utils/w2Generator';
import { generateAndDownloadW9 } from '@/utils/w9Generator';
import { generateAndDownload1099NEC } from '@/utils/1099necGenerator';
import { generateAndDownload1099MISC } from '@/utils/1099miscGenerator';
import { generateAndDownloadBankStatement } from '@/utils/bankStatementGenerator';
import { generateAndDownloadResume } from '@/utils/resumeGenerator';
import { generateAndDownloadOfferLetter } from '@/utils/offerLetterGenerator';
import { generateAndDownloadCeaseAndDesist } from '@/utils/ceaseAndDesistGenerator';
import { generateAndDownloadLegalDocument } from '@/utils/legalDocumentGenerator';
import { generateAndDownloadPowerOfAttorney } from '@/utils/powerOfAttorneyGenerator';
import { generateAndDownloadCommercialLease } from '@/utils/commercialLeaseGenerator';
import { generateAndDownloadScheduleC } from '@/utils/scheduleCGenerator';
import { generateAndDownloadUtilityBill } from '@/utils/utilityBillGenerator';
import { generateAndDownloadVehicleBillOfSale } from '@/utils/vehicleBillOfSaleGenerator';

// Import email utility for sending PDF attachments
import { sendDownloadEmailWithPdf } from '@/utils/emailWithPdf';

// Notifications
import { addGeneratingNotification, markNotificationReady, markNotificationError } from '@/utils/appNotifications';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

// ── Animated processing screen (whodat-style search screen, MintSlip green) ──
// A floating, spinning 3D leaf over a soft glow, the brand line, an Ionic
// progress bar, and cycling status messages. Background follows the dark/light
// mode the user picked in the app.
function ProcessingScreen({ title, messages }) {
  const dark = typeof window !== "undefined" && localStorage.getItem("appDarkMode") === "true";
  const [progress, setProgress] = useState(0);

  // Ease toward 92% and hold — the real work finishes the screen by unmounting
  useEffect(() => {
    const iv = setInterval(() => {
      setProgress((p) => Math.min(0.92, p + (0.92 - p) * 0.03 + 0.003));
    }, 120);
    return () => clearInterval(iv);
  }, []);

  const msgIndex = Math.min(messages.length - 1, Math.floor((progress / 0.92) * messages.length));
  const bg = dark ? "#121212" : "#f6faf7";
  const ink = dark ? "#ffffff" : "#0f172a";
  const sub = dark ? "rgba(255,255,255,0.62)" : "#64748b";
  const track = dark ? "rgba(255,255,255,0.12)" : "rgba(22,163,74,0.16)";

  const leafFace = (
    <svg viewBox="0 0 64 74" width="120" height="139" aria-hidden="true">
      <defs>
        <linearGradient id="mintLeafG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4ade80" />
          <stop offset="1" stopColor="#15803d" />
        </linearGradient>
      </defs>
      <path d="M32 4 C 12 16 6 34 12 48 C 17 59 27 63 32 64 C 37 63 47 59 52 48 C 58 34 52 16 32 4 Z" fill="url(#mintLeafG)" />
      <path d="M32 10 L 32 62" stroke="rgba(255,255,255,0.55)" strokeWidth="2" fill="none" />
      <path d="M32 24 C 26 26 21 30 18 35 M32 36 C 27 38 23 42 21 46 M32 24 C 38 26 43 30 46 35 M32 36 C 37 38 41 42 43 46"
        stroke="rgba(255,255,255,0.4)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M32 62 C 32 66 33 70 35 73" stroke="#15803d" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </svg>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{`
        @keyframes msLeafSpin { 0% { transform: rotateY(0deg); } 100% { transform: rotateY(360deg); } }
        @keyframes msLeafFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes msGlowPulse { 0%, 100% { opacity: 0.55; transform: translateX(-50%) scale(1); } 50% { opacity: 0.9; transform: translateX(-50%) scale(1.15); } }
        @keyframes msMsgIn { 0% { opacity: 0; transform: translateY(6px); } 100% { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) {
          .ms-leaf-spin { animation: none !important; }
          .ms-leaf-float { animation: none !important; }
        }
      `}</style>
      <div style={{ maxWidth: 380, width: "100%", textAlign: "center" }}>
        {/* 3D leaf */}
        <div style={{ position: "relative", height: 190, marginBottom: 8 }}>
          <div aria-hidden="true" style={{ position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)", width: 180, height: 60, background: "radial-gradient(ellipse at center, rgba(34,197,94,0.35) 0%, transparent 70%)", filter: "blur(14px)", animation: "msGlowPulse 2.6s ease-in-out infinite" }} />
          <div className="ms-leaf-float" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", animation: "msLeafFloat 3.2s ease-in-out infinite", perspective: 700 }}>
            <div className="ms-leaf-spin" style={{ position: "relative", width: 120, height: 139, transformStyle: "preserve-3d", animation: "msLeafSpin 4s linear infinite", filter: "drop-shadow(0 10px 24px rgba(21,128,61,0.35))" }}>
              <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden" }}>{leafFace}</div>
              <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>{leafFace}</div>
            </div>
          </div>
        </div>

        {/* Brand + progress (whodat's scan-brandhead treatment) */}
        <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 900, fontSize: 22, letterSpacing: "0.02em", color: ink, marginBottom: 14 }}>
          mint<span style={{ color: "#16a34a" }}>slip</span>
        </div>
        <IonProgressBar value={progress} style={{ "--progress-background": "#16a34a", "--background": track, borderRadius: 99, height: 6, overflow: "hidden", marginBottom: 22 }} />

        <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 20, color: ink, margin: "0 0 8px" }}>{title}</h2>
        <p key={msgIndex} style={{ color: sub, fontSize: 15, margin: 0, minHeight: 22, animation: "msMsgIn 0.35s ease" }}>
          {messages[msgIndex]}
        </p>
      </div>
    </div>
  );
}

const VERIFY_MESSAGES = [
  "Contacting secure payment server…",
  "Verifying your payment…",
  "Confirming your order details…",
  "Payment locked in — almost there…",
];

const GENERATE_MESSAGES = [
  "Warming up the document engine…",
  "Laying out your document…",
  "Crunching totals and taxes…",
  "Rendering crisp PDF pages…",
  "Applying finishing touches…",
  "Packaging your download…",
];

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderType = searchParams.get('type') || 'paystub';
  const sessionId = searchParams.get('session_id');
  const fileCount = parseInt(searchParams.get('count') || '1', 10);
  const isFromApp = searchParams.get('source') === 'app';
  
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isVerifying, setIsVerifying] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [error, setError] = useState(null);
  const [documentGenerated, setDocumentGenerated] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  
  // Ref to prevent double download (React StrictMode runs effects twice)
  const hasStartedRef = React.useRef(false);
  
  // Determine if it's a ZIP file based on count OR filename extension
  const isZipFile = fileCount > 1 || fileName.endsWith('.zip');

  // Clear any stale download data at the start of a new payment verification
  useEffect(() => {
    // Clear old download URLs when a new session starts
    if (sessionId) {
      localStorage.removeItem('lastDownloadUrl');
      localStorage.removeItem('lastDownloadFileName');
      sessionStorage.removeItem('lastDownloadUrl');
      sessionStorage.removeItem('lastDownloadFileName');
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
      
      // Extract customer email - prefer customer_email from Stripe, fallback to metadata
      const email = data.customer_email || data.metadata?.userEmail || '';
      if (email) {
        setCustomerEmail(email);
      }

      if (data.payment_status === 'paid' || data.status === 'complete') {
        setPaymentVerified(true);
        setIsVerifying(false);
        
        // Step 2: Generate document if we have pending data
        await generateDocument(email);
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

  // Helper function to send file email after generation (PDF or ZIP)
  const sendFileEmail = async (fileBlob, email, documentType, userName = '', isZip = false) => {
    if (!email || !fileBlob) {
      console.log('Skipping email - no email or blob provided');
      return;
    }
    
    try {
      const result = await sendDownloadEmailWithPdf({
        email,
        userName,
        documentType,
        pdfBlob: fileBlob,
        isGuest: !localStorage.getItem('userToken'),
        isZip
      });
      
      if (result.success) {
        setEmailSent(true);
        console.log('Email with attachment sent successfully');
      } else {
        console.error('Failed to send email with attachment:', result.error);
      }
    } catch (err) {
      console.error('Error sending email with attachment:', err);
    }
  };

  // Archive the generated document so it appears in the admin Saved Docs and
  // the purchase's detail modal. Uses the logged-in user endpoint when a token
  // is present, otherwise the guest endpoint keyed by the payer's email.
  const archiveDocument = async (blob, docType, email) => {
    if (!blob) return;
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const isZip = blob.type?.includes("zip");
      const fileName = `${docType}_${new Date().toISOString().split("T")[0]}${isZip ? ".zip" : ".pdf"}`;
      const template = localStorage.getItem(`pending${docType.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())}Template`) || null;
      const token = localStorage.getItem("userToken");
      if (token) {
        await fetch(`${BACKEND_URL}/api/user/saved-documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ documentType: docType, fileName, fileData: base64, template }),
        });
      } else if (email && email.includes("@")) {
        await fetch(`${BACKEND_URL}/api/guest/saved-documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guestEmail: email, documentType: docType, fileName, fileData: base64, template }),
        });
      }
    } catch (err) {
      console.error("Failed to archive document:", err);
    }
  };

  // Generate document based on type
  const generateDocument = async (email = null) => {
    setIsGenerating(true);
    const emailToUse = email || customerEmail;
    let notifId = null;
    let appReturnPath = null;

    try {
      let generated = false;
      let pdfBlob = null;

      if (orderType === 'paystub') {
        const formDataStr = localStorage.getItem('pendingPaystubData');
        const template = localStorage.getItem('pendingPaystubTemplate') || 'template-a';
        const numStubs = parseInt(localStorage.getItem('pendingPaystubCount') || '1', 10);

        if (formDataStr) {
          const formData = JSON.parse(formDataStr);
          notifId = `notif_${Date.now()}`;
          // Mirror the generator's real download names so the notification
          // matches the file that actually lands in Downloads.
          const firstPayDate = (formData.payDateList || '').split(',')[0]?.trim() || formData.payDate || new Date();
          const notifFileName = numStubs > 1
            ? getMultiplePaystubsZipFilename(template, formData.name)
            : getIndividualPaystubFilename(template, formData.name, firstPayDate);
          addGeneratingNotification({ id: notifId, type: 'paystub', fileName: notifFileName, fileType: numStubs > 1 ? 'zip' : 'pdf' });

          pdfBlob = await generateAndDownloadPaystub(formData, template, numStubs, true);
          generated = true;

          markNotificationReady(notifId);
          if (isFromApp) appReturnPath = '/app/paystub';

          if (emailToUse && pdfBlob) {
            sendFileEmail(pdfBlob, emailToUse, 'paystub', formData.name, numStubs > 1);
          }
        }
      } else if (orderType === 'w2') {
        const formDataStr = localStorage.getItem('pendingW2Data');
        
        if (formDataStr) {
          const formData = JSON.parse(formDataStr);
          const taxYear = localStorage.getItem('pendingW2TaxYear') || '2024';
          
          pdfBlob = await generateAndDownloadW2(formData, taxYear, true);
          generated = true;
          
          if (emailToUse && pdfBlob) {
            sendFileEmail(pdfBlob, emailToUse, 'w2', formData.employeeName);
          }
          
          toast.success('Your W-2 has been downloaded!');
        }
      } else if (orderType === 'w9') {
        const formDataStr = localStorage.getItem('pendingW9Data');
        
        if (formDataStr) {
          const formData = JSON.parse(formDataStr);
          
          pdfBlob = await generateAndDownloadW9(formData, true);
          generated = true;
          
          if (emailToUse && pdfBlob) {
            sendFileEmail(pdfBlob, emailToUse, 'w9', formData.name);
          }
          
          toast.success('Your W-9 has been downloaded!');
        }
      } else if (orderType === 'bank-statement') {
        const formDataStr = localStorage.getItem('pendingBankStatementData');
        
        if (formDataStr) {
          const formData = JSON.parse(formDataStr);
          const template = localStorage.getItem('pendingBankStatementTemplate') || 'chase';
          
          pdfBlob = await generateAndDownloadBankStatement(formData, template, true);
          generated = true;
          
          if (emailToUse && pdfBlob) {
            sendFileEmail(pdfBlob, emailToUse, 'bank-statement', formData.accountHolder);
          }
          
          toast.success('Your bank statement has been downloaded!');
        }
      } else if (orderType === 'ai-resume') {
        const resumeDataStr = localStorage.getItem('pendingResumeData');
        
        if (resumeDataStr) {
          const { generatedResume, formData, selectedTemplate } = JSON.parse(resumeDataStr);
          
          if (generatedResume) {
            console.log('Generating AI resume with stored data...', { selectedTemplate });
            
            // Prepare resume data for the generator
            const resumeData = {
              ...generatedResume,
              template: selectedTemplate || formData?.template || 'ats'
            };
            
            pdfBlob = await generateAndDownloadResume(resumeData, true);
            generated = true;
            if (isFromApp) appReturnPath = '/app/paystub';

            // Resume is always a ZIP (contains PDF + DOCX)
            if (emailToUse && pdfBlob) {
              sendFileEmail(pdfBlob, emailToUse, 'ai-resume', generatedResume?.personalInfo?.name, true);
            }

            toast.success('Your AI resume has been downloaded!');
          }
        }
      } else if (orderType === '1099-nec') {
        const formDataStr = localStorage.getItem('pending1099NECData');
        
        if (formDataStr) {
          const formData = JSON.parse(formDataStr);
          const taxYear = localStorage.getItem('pending1099NECTaxYear') || '2024';
          
          pdfBlob = await generateAndDownload1099NEC(formData, taxYear, true);
          generated = true;
          
          if (emailToUse && pdfBlob) {
            sendFileEmail(pdfBlob, emailToUse, '1099-nec', formData.recipientName);
          }
          
          toast.success('Your 1099-NEC has been downloaded!');
        }
      } else if (orderType === '1099-misc') {
        const formDataStr = localStorage.getItem('pending1099MISCData');
        
        if (formDataStr) {
          const formData = JSON.parse(formDataStr);
          const taxYear = localStorage.getItem('pending1099MISCTaxYear') || '2024';
          
          pdfBlob = await generateAndDownload1099MISC(formData, taxYear, true);
          generated = true;
          
          if (emailToUse && pdfBlob) {
            sendFileEmail(pdfBlob, emailToUse, '1099-misc', formData.recipientName);
          }
          
          toast.success('Your 1099-MISC has been downloaded!');
        }
      } else if (orderType === 'canadian-paystub') {
        const formDataStr = localStorage.getItem('pendingCanadianPaystubData');
        const template = localStorage.getItem('pendingCanadianPaystubTemplate') || 'template-a';
        const numStubs = parseInt(localStorage.getItem('pendingCanadianPaystubCount') || '1', 10);

        if (formDataStr) {
          const formData = JSON.parse(formDataStr);
          notifId = `notif_${Date.now()}`;
          // Mirror the generator's real download names so the notification
          // matches the file that actually lands in Downloads.
          const firstPayDate = (formData.payDateList || '').split(',')[0]?.trim() || formData.payDate || new Date();
          const notifFileName = numStubs > 1
            ? getCanadianPaystubsZipFilename(template, formData.name)
            : getCanadianPaystubFilename(template, formData.name, firstPayDate);
          addGeneratingNotification({ id: notifId, type: 'canadian-paystub', fileName: notifFileName, fileType: numStubs > 1 ? 'zip' : 'pdf' });

          pdfBlob = await generateAndDownloadCanadianPaystub(formData, template, numStubs, true);
          generated = true;

          markNotificationReady(notifId);
          if (isFromApp) appReturnPath = '/app/canadian-paystub';

          if (emailToUse && pdfBlob) {
            sendFileEmail(pdfBlob, emailToUse, 'canadian-paystub', formData.name, numStubs > 1);
          }
        }
      } else if (orderType === 'offer-letter') {
        const formDataStr = localStorage.getItem('pendingOfferLetterData');
        
        if (formDataStr) {
          const formData = JSON.parse(formDataStr);
          
          pdfBlob = await generateAndDownloadOfferLetter(formData, true);
          generated = true;
          if (isFromApp) appReturnPath = '/app/paystub';

          if (emailToUse && pdfBlob) {
            sendFileEmail(pdfBlob, emailToUse, 'offer-letter', formData.recipientName);
          }

          toast.success('Your offer letter has been downloaded!');
        }
      } else if (orderType === 'cease-and-desist') {
        const formDataStr = localStorage.getItem('pendingCeaseAndDesistData');

        if (formDataStr) {
          const formData = JSON.parse(formDataStr);

          pdfBlob = await generateAndDownloadCeaseAndDesist(formData, true);
          generated = true;

          if (emailToUse && pdfBlob) {
            sendFileEmail(pdfBlob, emailToUse, 'cease-and-desist', formData.senderName);
          }

          toast.success('Your cease and desist letter has been downloaded!');
        }
      } else if (orderType === 'legal-document') {
        const formDataStr = localStorage.getItem('pendingLegalDocumentData');

        if (formDataStr) {
          const formData = JSON.parse(formDataStr);

          pdfBlob = await generateAndDownloadLegalDocument(formData, true);
          generated = true;

          if (emailToUse && pdfBlob) {
            sendFileEmail(pdfBlob, emailToUse, 'legal-document', formData.partyAName);
          }

          toast.success('Your legal document has been downloaded!');
        }
      } else if (orderType === 'power-of-attorney') {
        const formDataStr = localStorage.getItem('pendingPowerOfAttorneyData');

        if (formDataStr) {
          const formData = JSON.parse(formDataStr);

          pdfBlob = await generateAndDownloadPowerOfAttorney(formData, true);
          generated = true;

          if (emailToUse && pdfBlob) {
            sendFileEmail(pdfBlob, emailToUse, 'power-of-attorney', formData.principalName);
          }

          toast.success('Your power of attorney has been downloaded!');
        }
      } else if (orderType === 'commercial-lease') {
        const formDataStr = localStorage.getItem('pendingCommercialLeaseData');

        if (formDataStr) {
          const formData = JSON.parse(formDataStr);

          pdfBlob = await generateAndDownloadCommercialLease(formData, true);
          generated = true;

          if (emailToUse && pdfBlob) {
            sendFileEmail(pdfBlob, emailToUse, 'commercial-lease', formData.landlordName);
          }

          toast.success('Your commercial lease has been downloaded!');
        }
      } else if (orderType === 'schedule-c') {
        const formDataStr = localStorage.getItem('pendingScheduleCData');
        
        if (formDataStr) {
          const formData = JSON.parse(formDataStr);
          const taxYear = localStorage.getItem('pendingScheduleCTaxYear') || '2024';
          
          pdfBlob = await generateAndDownloadScheduleC(formData, taxYear, true);
          generated = true;
          
          if (emailToUse && pdfBlob) {
            sendFileEmail(pdfBlob, emailToUse, 'schedule-c', formData.businessName);
          }
          
          toast.success('Your Schedule C has been downloaded!');
        }
      } else if (orderType === 'utility-bill') {
        const formDataStr = localStorage.getItem('pendingUtilityBillData');
        
        if (formDataStr) {
          const formData = JSON.parse(formDataStr);
          const template = localStorage.getItem('pendingUtilityBillTemplate') || 'electric';
          
          pdfBlob = await generateAndDownloadUtilityBill(formData, template, true);
          generated = true;
          
          if (emailToUse && pdfBlob) {
            sendFileEmail(pdfBlob, emailToUse, 'utility-bill', formData.customerName);
          }
          
          toast.success('Your utility bill has been downloaded!');
        }
      } else if (orderType === 'vehicle-bill-of-sale') {
        const formDataStr = localStorage.getItem('pendingVehicleBillOfSaleData');
        
        if (formDataStr) {
          const formData = JSON.parse(formDataStr);
          
          pdfBlob = await generateAndDownloadVehicleBillOfSale(formData, true);
          generated = true;
          
          if (emailToUse && pdfBlob) {
            sendFileEmail(pdfBlob, emailToUse, 'vehicle-bill-of-sale', formData.buyerName);
          }
          
          toast.success('Your vehicle bill of sale has been downloaded!');
        }
      }
      // Add more document types as needed...
      
      if (generated) {
        // Archive the paid document (admin Saved Docs + purchase modal).
        // 'ai-resume' is stored under the 'resume' document type used elsewhere.
        await archiveDocument(pdfBlob, orderType === 'ai-resume' ? 'resume' : orderType, emailToUse);

        // Navigate back to app for app-managed document types
        if (appReturnPath) {
          navigate(appReturnPath);
          return;
        }

        setDocumentGenerated(true);

        // Check for stored download URL from the generator (check both localStorage and sessionStorage)
        const storedUrl = localStorage.getItem('lastDownloadUrl') || sessionStorage.getItem('lastDownloadUrl');
        const storedName = localStorage.getItem('lastDownloadFileName') || sessionStorage.getItem('lastDownloadFileName');
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
      if (notifId) markNotificationError(notifId);
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
      'cease-and-desist': 'cease_and_desist_letter.pdf',
      'legal-document': 'legal_document.pdf',
      'power-of-attorney': 'durable_power_of_attorney.pdf',
      'commercial-lease': 'commercial_lease_agreement.pdf',
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
      'cease-and-desist': 'Cease and Desist Letter',
      'legal-document': 'Legal Document',
      'power-of-attorney': 'Power of Attorney',
      'commercial-lease': 'Commercial Lease Agreement',
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
      } else if (orderType === 'ai-resume') {
        const resumeDataStr = localStorage.getItem('pendingResumeData');
        if (resumeDataStr) {
          const { generatedResume, formData, selectedTemplate } = JSON.parse(resumeDataStr);
          if (generatedResume) {
            const resumeData = {
              ...generatedResume,
              template: selectedTemplate || formData?.template || 'ats'
            };
            await generateAndDownloadResume(resumeData);
            regenerated = true;
            toast.success('Download started!');
          }
        }
      } else if (orderType === '1099-nec') {
        const formDataStr = localStorage.getItem('pending1099NECData');
        if (formDataStr) {
          const formData = JSON.parse(formDataStr);
          const taxYear = localStorage.getItem('pending1099NECTaxYear') || '2024';
          await generateAndDownload1099NEC(formData, taxYear);
          regenerated = true;
          toast.success('Download started!');
        }
      } else if (orderType === '1099-misc') {
        const formDataStr = localStorage.getItem('pending1099MISCData');
        if (formDataStr) {
          const formData = JSON.parse(formDataStr);
          const taxYear = localStorage.getItem('pending1099MISCTaxYear') || '2024';
          await generateAndDownload1099MISC(formData, taxYear);
          regenerated = true;
          toast.success('Download started!');
        }
      } else if (orderType === 'canadian-paystub') {
        const formDataStr = localStorage.getItem('pendingCanadianPaystubData');
        if (formDataStr) {
          const formData = JSON.parse(formDataStr);
          const template = localStorage.getItem('pendingCanadianPaystubTemplate') || 'template-a';
          const numStubs = parseInt(localStorage.getItem('pendingCanadianPaystubCount') || fileCount.toString(), 10);
          await generateAndDownloadCanadianPaystub(formData, template, numStubs);
          regenerated = true;
          toast.success('Download started!');
        }
      } else if (orderType === 'offer-letter') {
        const formDataStr = localStorage.getItem('pendingOfferLetterData');
        if (formDataStr) {
          const formData = JSON.parse(formDataStr);
          await generateAndDownloadOfferLetter(formData);
          regenerated = true;
          toast.success('Download started!');
        }
      } else if (orderType === 'cease-and-desist') {
        const formDataStr = localStorage.getItem('pendingCeaseAndDesistData');
        if (formDataStr) {
          const formData = JSON.parse(formDataStr);
          await generateAndDownloadCeaseAndDesist(formData);
          regenerated = true;
          toast.success('Download started!');
        }
      } else if (orderType === 'legal-document') {
        const formDataStr = localStorage.getItem('pendingLegalDocumentData');
        if (formDataStr) {
          const formData = JSON.parse(formDataStr);
          await generateAndDownloadLegalDocument(formData);
          regenerated = true;
          toast.success('Download started!');
        }
      } else if (orderType === 'power-of-attorney') {
        const formDataStr = localStorage.getItem('pendingPowerOfAttorneyData');
        if (formDataStr) {
          const formData = JSON.parse(formDataStr);
          await generateAndDownloadPowerOfAttorney(formData);
          regenerated = true;
          toast.success('Download started!');
        }
      } else if (orderType === 'commercial-lease') {
        const formDataStr = localStorage.getItem('pendingCommercialLeaseData');
        if (formDataStr) {
          const formData = JSON.parse(formDataStr);
          await generateAndDownloadCommercialLease(formData);
          regenerated = true;
          toast.success('Download started!');
        }
      } else if (orderType === 'schedule-c') {
        const formDataStr = localStorage.getItem('pendingScheduleCData');
        if (formDataStr) {
          const formData = JSON.parse(formDataStr);
          const taxYear = localStorage.getItem('pendingScheduleCTaxYear') || '2024';
          await generateAndDownloadScheduleC(formData, taxYear);
          regenerated = true;
          toast.success('Download started!');
        }
      } else if (orderType === 'utility-bill') {
        const formDataStr = localStorage.getItem('pendingUtilityBillData');
        if (formDataStr) {
          const formData = JSON.parse(formDataStr);
          const template = localStorage.getItem('pendingUtilityBillTemplate') || 'electric';
          await generateAndDownloadUtilityBill(formData, template);
          regenerated = true;
          toast.success('Download started!');
        }
      } else if (orderType === 'vehicle-bill-of-sale') {
        const formDataStr = localStorage.getItem('pendingVehicleBillOfSaleData');
        if (formDataStr) {
          const formData = JSON.parse(formDataStr);
          await generateAndDownloadVehicleBillOfSale(formData);
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
    // Prevent double execution (React StrictMode runs effects twice in dev)
    if (hasStartedRef.current) {
      return;
    }
    hasStartedRef.current = true;
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
    return <ProcessingScreen title="Verifying Payment" messages={VERIFY_MESSAGES} />;
  }

  // Generating state
  if (isGenerating) {
    return <ProcessingScreen title={`Generating Your ${getDocumentTypeDisplay(orderType)}`} messages={GENERATE_MESSAGES} />;
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
