import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import PaystubForm from "@/pages/PaystubForm";
import BankStatementForm from "@/pages/BankStatementForm";
import { Toaster } from "sonner";

function App() {
  return (
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
  );
}

export default App;