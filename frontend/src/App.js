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

// Use PayPal Sandbox Client ID
const PAYPAL_CLIENT_ID = process.env.REACT_APP_PAYPAL_CLIENT_ID || "AaLPbPlOPPIiSXdlRvDbBUX8oxahW_7R-csGaJvS0TNA2AwDYxMNi3l2hAtW_5KonXhIoC6YasnjJlqx";

function App() {
  return (
    <PayPalScriptProvider options={{ "client-id": PAYPAL_CLIENT_ID, currency: "USD" }}>
      <div className="App">
        <Toaster position="top-center" richColors />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/paystub" element={<PaystubForm />} />
            <Route path="/bank-statement" element={<BankStatementForm />} />
            <Route path="/w2" element={<W2Form />} />
            <Route path="/w9" element={<W9Form />} />
            <Route path="/1099-nec" element={<Form1099NEC />} />
            <Route path="/1099-misc" element={<Form1099MISC />} />
            <Route path="/offer-letter" element={<OfferLetterForm />} />
            <Route path="/schedule-c" element={<ScheduleCForm />} />
            <Route path="/vehicle-bill-of-sale" element={<VehicleBillOfSaleForm />} />
            <Route path="/contact" element={<Contact />} />
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