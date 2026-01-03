import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { Check, Loader2, PartyPopper, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isActivating, setIsActivating] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [pollCount, setPollCount] = useState(0);
  const MAX_POLLS = 10;

  useEffect(() => {
    checkPaymentStatus();
  }, []);

  const checkPaymentStatus = async () => {
    const sessionId = searchParams.get("session_id");
    
    if (!sessionId) {
      setError("No checkout session found. Please try again.");
      setIsActivating(false);
      return;
    }

    // Start polling for payment status
    pollPaymentStatus(sessionId);
  };

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    if (attempts >= MAX_POLLS) {
      setError("Payment verification timed out. Please check your account or contact support.");
      setIsActivating(false);
      return;
    }

    setPollCount(attempts + 1);

    try {
      const token = localStorage.getItem("userToken");
      
      // Check payment status from backend
      const response = await fetch(`${BACKEND_URL}/api/stripe/checkout-status/${sessionId}`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });

      const data = await response.json();

      if (data.payment_status === "paid" || data.status === "complete") {
        // Payment successful! Update local user info
        await refreshUserData();
        
        // Clean up localStorage
        localStorage.removeItem("pending_subscription_tier");
        localStorage.removeItem("pending_checkout_session_id");
        
        setIsSuccess(true);
        setIsActivating(false);
        toast.success("Subscription activated successfully!");
        return;
      } else if (data.status === "expired") {
        setError("Payment session expired. Please try again.");
        setIsActivating(false);
        return;
      }

      // If payment is still pending, continue polling
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), 2000);
    } catch (error) {
      console.error("Error checking payment status:", error);
      
      // Retry on network errors
      if (attempts < MAX_POLLS - 1) {
        setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), 2000);
      } else {
        setError("Failed to verify payment. Please check your account or contact support.");
        setIsActivating(false);
      }
    }
  };

  const refreshUserData = async () => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) return;

      const response = await fetch(`${BACKEND_URL}/api/user/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          localStorage.setItem("userInfo", JSON.stringify(data.user));
        }
      }
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col">
      <Header title="MintSlip" />

      <main className="flex-1 flex items-center justify-center py-16">
        <div className="max-w-md mx-auto px-4 text-center">
          {isActivating ? (
            <div className="space-y-4">
              <Loader2 className="w-16 h-16 animate-spin text-green-600 mx-auto" />
              <h1 className="text-2xl font-bold text-slate-800">
                Activating Your Subscription...
              </h1>
              <p className="text-slate-600">
                Please wait while we verify your payment.
              </p>
              {pollCount > 3 && (
                <p className="text-sm text-slate-500">
                  Verifying payment... ({pollCount}/{MAX_POLLS})
                </p>
              )}
            </div>
          ) : isSuccess ? (
            <div className="space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <PartyPopper className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-800">
                Welcome to MintSlip!
              </h1>
              <p className="text-lg text-slate-600">
                Your subscription is now active. Start creating professional documents today!
              </p>
              <div className="bg-white rounded-xl p-6 border border-green-200 shadow-sm">
                <div className="flex items-center gap-3 text-green-700">
                  <Check className="w-5 h-5" />
                  <span>Payment successful</span>
                </div>
                <div className="flex items-center gap-3 text-green-700 mt-2">
                  <Check className="w-5 h-5" />
                  <span>Subscription activated</span>
                </div>
                <div className="flex items-center gap-3 text-green-700 mt-2">
                  <Check className="w-5 h-5" />
                  <span>Downloads ready to use</span>
                </div>
                <div className="flex items-center gap-3 text-green-700 mt-2">
                  <Check className="w-5 h-5" />
                  <span>All features unlocked</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => navigate("/user/dashboard")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Go to Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/paystub-generator")}
                >
                  Create a Document
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-10 h-10 text-amber-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800">
                Something Went Wrong
              </h1>
              <p className="text-slate-600">{error}</p>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-sm text-slate-600">
                  If you were charged but don't see your subscription active, please contact support with your payment details.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => navigate("/pricing")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/contact")}
                >
                  Contact Support
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
