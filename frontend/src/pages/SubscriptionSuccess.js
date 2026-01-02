import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { Check, Loader2, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isActivating, setIsActivating] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    activateSubscription();
  }, []);

  const activateSubscription = async () => {
    const subscriptionId = searchParams.get("subscription_id") || localStorage.getItem("pending_subscription_id");
    
    if (!subscriptionId) {
      setError("No subscription found. Please try again.");
      setIsActivating(false);
      return;
    }

    try {
      const token = localStorage.getItem("userToken");
      const response = await fetch(`${BACKEND_URL}/api/subscriptions/activate?subscription_id=${subscriptionId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        // Update local user info
        localStorage.setItem("userInfo", JSON.stringify(data.user));
        localStorage.removeItem("pending_subscription_id");
        localStorage.removeItem("pending_subscription_tier");
        setIsSuccess(true);
        toast.success("Subscription activated successfully!");
      } else {
        throw new Error(data.detail || "Failed to activate subscription");
      }
    } catch (error) {
      console.error("Error activating subscription:", error);
      setError(error.message);
    } finally {
      setIsActivating(false);
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
                Please wait while we set up your account.
              </p>
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
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-4xl">⚠️</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-800">
                Something Went Wrong
              </h1>
              <p className="text-slate-600">{error}</p>
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
