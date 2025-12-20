import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import PaystubForm from "@/pages/PaystubForm";
import BankStatementForm from "@/pages/BankStatementForm";
import W2Form from "@/pages/W2Form";
import W9Form from "@/pages/W9Form";
import Form1099NEC from "@/pages/Form1099NEC";
import Form1099MISC from "@/pages/Form1099MISC";
import OfferLetterForm from "@/pages/OfferLetterForm";
import ScheduleCForm from "@/pages/ScheduleCForm";
import VehicleBillOfSaleForm from "@/pages/VehicleBillOfSaleForm";
import UtilityBillForm from "@/pages/UtilityBillForm";
import Contact from "@/pages/Contact";
import FAQ from "@/pages/FAQ";
import About from "@/pages/About";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import NotFound from "@/pages/NotFound";
import ScrollToTop from "@/components/ScrollToTop";
import { Toaster } from "sonner";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import Reviews from "@/pages/Reviews";

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
      console.log('PayPal: Using Sandbox mode');
      return PAYPAL_SANDBOX_CLIENT_ID;
    }
  }
  
  // Production - use Live Client ID
  console.log('PayPal: Using Live mode');
  return PAYPAL_LIVE_CLIENT_ID;
};

const PAYPAL_CLIENT_ID = process.env.REACT_APP_PAYPAL_CLIENT_ID || getPayPalClientId();

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
            <Route path="/instant-paystub-generator" element={<PaystubForm />} />
            <Route path="/self-employed-paystub-generator" element={<PaystubForm />} />
            <Route path="/contractor-paystub-generator" element={<PaystubForm />} />
            <Route path="/accounting-mockup-generator" element={<BankStatementForm />} />
            <Route path="/w2-generator" element={<W2Form />} />
            <Route path="/w9-generator" element={<W9Form />} />
            <Route path="/1099-nec-generator" element={<Form1099NEC />} />
            <Route path="/1099-misc-generator" element={<Form1099MISC />} />
            <Route path="/offer-letter-generator" element={<OfferLetterForm />} />
            <Route path="/schedule-c-generator" element={<ScheduleCForm />} />
            <Route path="/vehicle-bill-of-sale-generator" element={<VehicleBillOfSaleForm />} />
            <Route path="/service-expense-generator" element={<UtilityBillForm />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </div>
    </PayPalScriptProvider>
  );
}

export default App;