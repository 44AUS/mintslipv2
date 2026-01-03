import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
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
import AdminDiscounts from "@/pages/AdminDiscounts";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminBlog from "@/pages/AdminBlog";
import AdminBlogEditor from "@/pages/AdminBlogEditor";
import UserLogin from "@/pages/UserLogin";
import UserSignup from "@/pages/UserSignup";
import UserDashboard from "@/pages/UserDashboard";
import UserDownloads from "@/pages/UserDownloads";
import UserSettings from "@/pages/UserSettings";
import SubscriptionChoose from "@/pages/SubscriptionChoose";
import SubscriptionPlans from "@/pages/SubscriptionPlans";
import SubscriptionSuccess from "@/pages/SubscriptionSuccess";
import SubscriptionCancel from "@/pages/SubscriptionCancel";
import SubscriptionUpgradeSuccess from "@/pages/SubscriptionUpgradeSuccess";
import PaymentSuccess from "@/pages/PaymentSuccess";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import ScrollToTop from "@/components/ScrollToTop";
import PromoBanner from "@/components/PromoBanner";
import { Toaster } from "sonner";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import Reviews from "@/pages/Reviews";
import ComparisonPage from "@/pages/ComparisonPage";
import DocumentDirectory from "@/pages/DocumentDirectory";
import AIResumeBuilder from "@/pages/AIResumeBuilder";
import AIResumeLanding from "@/pages/AIResumeLanding";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

// Stripe Configuration
const STRIPE_PUBLISHABLE_KEY = "pk_test_51SOOSM0OuJwef38xh7dnPwMMH0YhWqjhbZnJfLGKx3cq8K97jLNmVTtJqhLqyLg3pKqfDSLhK9v6Z2Y7S6thm1Qk00VJqM9wKX";
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

function App() {
  return (
    <HelmetProvider>
      <Elements stripe={stripePromise}>
        <div className="App">
          <PromoBanner />
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
            <Route path="/ai-resume-builder" element={<AIResumeBuilder />} />
            <Route path="/resume-builder" element={<AIResumeLanding />} />
            <Route path="/free-resume-builder" element={<AIResumeLanding />} />
            <Route path="/ai-resume-generator" element={<AIResumeLanding />} />
            <Route path="/how-to-make-a-paystub" element={<HowToMakePaystub />} />
            <Route path="/paystub-for-apartment" element={<PaystubForApartment />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            {/* Blog Routes */}
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/discounts" element={<AdminDiscounts />} />
            <Route path="/admin/blog" element={<AdminBlog />} />
            <Route path="/admin/blog/new" element={<AdminBlogEditor />} />
            <Route path="/admin/blog/edit/:id" element={<AdminBlogEditor />} />
            {/* User Auth Routes (hidden - accessible via direct URL only) */}
            <Route path="/login" element={<UserLogin />} />
            <Route path="/signup" element={<UserSignup />} />
            <Route path="/subscription/choose" element={<SubscriptionChoose />} />
            <Route path="/pricing" element={<SubscriptionPlans />} />
            <Route path="/subscription/success" element={<SubscriptionSuccess />} />
            <Route path="/subscription/cancel" element={<SubscriptionCancel />} />
            <Route path="/subscription/upgrade/success" element={<SubscriptionUpgradeSuccess />} />
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/downloads" element={<UserDownloads />} />
            <Route path="/user/settings" element={<UserSettings />} />
            <Route path="/mintslip-vs-other-paystub-generators" element={<ComparisonPage />} />
            <Route path="/mintslip-vs-thepaystubs" element={<MintSlipVsThePayStubs />} />
            <Route path="/generators" element={<DocumentDirectory />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </div>
    </PayPalScriptProvider>
  </HelmetProvider>
  );
}

export default App;