import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import PaystubForm from "@/pages/PaystubForm";
import BankStatementForm from "@/pages/BankStatementForm";
import { Toaster } from "sonner";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

// Use a valid PayPal Sandbox Client ID
const PAYPAL_CLIENT_ID = process.env.REACT_APP_PAYPAL_CLIENT_ID || "AZDxjDScFpQtjWTOUtWKbyN87sd1C0NYIrqqQCaFax8A97_DLEDOcMqaG5T";

function App() {
  return (
    <PayPalScriptProvider options={{ "client-id": PAYPAL_CLIENT_ID, currency: "USD" }}>
      <div className="App">
        <Toaster position="top-center" richColors />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/paystub" element={<PaystubForm />} />
            <Route path="/bankstatement" element={<BankStatementForm />} />
          </Routes>
        </BrowserRouter>
      </div>
    </PayPalScriptProvider>
  );
}

export default App;