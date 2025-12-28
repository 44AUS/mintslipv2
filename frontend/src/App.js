import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import PaystubForm from "@/pages/PaystubForm";
import PaystubSamples from "@/pages/PaystubSamples";
import CanadianPaystubForm from "@/pages/CanadianPaystubForm";
import StatePaystubGenerator from "@/pages/StatePaystubGenerator";
import MintSlipVsThePayStubs from "@/pages/MintSlipVsThePayStubs";
import BankStatementForm from "@/pages/BankStatementForm";
import W2Form from "@/pages/W2Form";
import W9Form from "@/pages/W9Form";
import Form1099NEC from "@/pages/Form1099NEC";
import Form1099MISC from "@/pages/Form1099MISC";
import OfferLetterForm from "@/pages/OfferLetterForm";
import ScheduleCForm from "@/pages/ScheduleCForm";
import VehicleBillOfSaleForm from "@/pages/VehicleBillOfSaleForm";
import UtilityBillForm from "@/pages/UtilityBillForm";
import HowToMakePaystub from "@/pages/HowToMakePaystub";
import PaystubForApartment from "@/pages/PaystubForApartment";
import Contact from "@/pages/Contact";
import FAQ from "@/pages/FAQ";
import About from "@/pages/About";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import NotFound from "@/pages/NotFound";
import AdminAnalytics from "@/pages/AdminAnalytics";
import PaymentSuccess from "@/pages/PaymentSuccess";
import ScrollToTop from "@/components/ScrollToTop";
import { Toaster } from "sonner";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import Reviews from "@/pages/Reviews";
import ComparisonPage from "@/pages/ComparisonPage";
import DocumentDirectory from "@/pages/DocumentDirectory";

// PayPal Client IDs
const PAYPAL_SANDBOX_CLIENT_ID = "AaLPbPlOPPIiSXdlRvDbBUX8oxahW_7R-csGaJvS0TNA2AwDYxMNi3l2hAtW_5KonXhIoC6YasnjJlqx";
const PAYPAL_LIVE_CLIENT_ID = "AawVFBRkotEckyQ7SZnpA9jeRCVKnrcW0b0mUgWAk_h7eoWSUWIHmwBFWibAKZj-YSFI3vGSH0f3ACuf";

// Function to determine environment and get correct PayPal Client ID
const getPayPalClientId = () => {
  // Check if running on localhost or preview environments (sandbox)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isDevelopment = hostname === 'localhost' || 
                          hostname === '127.0.0.1' ||
                          hostname.includes('preview.emergentagent.com');
    
    if (isDevelopment) {
      console.log('PayPal: Using Sandbox mode for', hostname);
      return PAYPAL_SANDBOX_CLIENT_ID;
    }
  }
  
  // Production - use Live Client ID (ignore env variable in production)
  console.log('PayPal: Using Live mode');
  return PAYPAL_LIVE_CLIENT_ID;
};

// Always use the dynamic function - don't rely on env variable for PayPal
const PAYPAL_CLIENT_ID = getPayPalClientId();

function App() {
  return (
    <PayPalScriptProvider options={{ "client-id": PAYPAL_CLIENT_ID, currency: "USD", intent: "capture" }}>
      <div className="App">
        <Toaster position="top-center" richColors />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/paystub-generator" element={<PaystubForm />} />
            <Route path="/paystub-samples" element={<PaystubSamples />} />
            <Route path="/instant-paystub-generator" element={<PaystubForm />} />
            {/* State-specific paystub generator pages with SEO content */}
            <Route path="/paystub-generator/:state" element={<StatePaystubGenerator />} />
            <Route path="/paystub-for-apartment" element={<PaystubForm />} />
            <Route path="/paystub-for-mortgage" element={<PaystubForm />} />
            <Route path="/paystub-template-download" element={<PaystubForm />} />
            <Route path="/create-a-paystub" element={<PaystubForm />} />
            <Route path="/self-employed-paystub-generator" element={<PaystubForm />} />
            <Route path="/contractor-paystub-generator" element={<PaystubForm />} />
            <Route path="/canadian-paystub-generator" element={<CanadianPaystubForm />} />
            <Route path="/accounting-mockup-generator" element={<BankStatementForm />} />
            <Route path="/w2-generator" element={<W2Form />} />
            <Route path="/w9-generator" element={<W9Form />} />
            <Route path="/1099-nec-generator" element={<Form1099NEC />} />
            <Route path="/1099-misc-generator" element={<Form1099MISC />} />
            <Route path="/offer-letter-generator" element={<OfferLetterForm />} />
            <Route path="/schedule-c-generator" element={<ScheduleCForm />} />
            <Route path="/vehicle-bill-of-sale-generator" element={<VehicleBillOfSaleForm />} />
            <Route path="/service-expense-generator" element={<UtilityBillForm />} />
            <Route path="/how-to-make-a-paystub" element={<HowToMakePaystub />} />
            <Route path="/paystub-for-apartment" element={<PaystubForApartment />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/mintslip-vs-other-paystub-generators" element={<ComparisonPage />} />
            <Route path="/generators" element={<DocumentDirectory />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </div>
    </PayPalScriptProvider>
  );
}

export default App;