import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { Check, Loader2, TrendingUp, Sparkles } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

export default function SubscriptionUpgradeSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [upgradeComplete, setUpgradeComplete] = useState(false);
  const [error, setError] = useState(null);
  const [newPlan, setNewPlan] = useState(null);

  useEffect(() => {
    captureUpgrade();
  }, []);

  const captureUpgrade = async () => {
    // Get the order ID from URL params or localStorage
    const token = searchParams.get("token"); // PayPal passes this
    const orderId = localStorage.getItem("pending_upgrade_order_id");
    const newTier = localStorage.getItem("pending_upgrade_tier");

    if (!orderId) {
      setError("No pending upgrade found. Please try again from the pricing page.");
      setIsProcessing(false);
      return;
    }

    try {
      const userToken = localStorage.getItem("userToken");
      const response = await fetch(`${BACKEND_URL}/api/subscriptions/upgrade/capture?order_id=${orderId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${userToken}`,
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to complete upgrade");
      }

      // Update local storage with new user data
      if (data.user) {
        localStorage.setItem("userInfo", JSON.stringify(data.user));
        setNewPlan(data.user.subscription?.tier);
      }

      // Clear pending upgrade data
      localStorage.removeItem("pending_upgrade_order_id");
      localStorage.removeItem("pending_upgrade_tier");

      setUpgradeComplete(true);
      toast.success("Upgrade successful!");
    } catch (error) {
      console.error("Error capturing upgrade:", error);
      setError(error.message || "Failed to complete upgrade. Please contact support.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getPlanName = (tier) => {
    const names = {
      starter: "Starter",
      professional: "Professional",
      business: "Business"
    };
    return names[tier] || tier;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex flex-col">
      <Header title="MintSlip" />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          {isProcessing ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">
                Processing Your Upgrade
              </h1>
              <p className="text-slate-600">
                Please wait while we activate your new plan...
              </p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-red-200">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">❌</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">
                Upgrade Failed
              </h1>
              <p className="text-slate-600 mb-6">
                {error}
              </p>
              <Button
                onClick={() => navigate("/pricing")}
                className="bg-green-600 hover:bg-green-700"
              >
                Back to Pricing
              </Button>
            </div>
          ) : upgradeComplete ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-green-200">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">
                Upgrade Complete! 🎉
              </h1>
              <p className="text-slate-600 mb-6">
                You're now on the <span className="font-semibold text-green-600">{getPlanName(newPlan)}</span> plan.
              </p>
              
              <div className="bg-green-50 rounded-xl p-4 mb-6 text-left">
                <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  What's new for you
                </h3>
                <ul className="text-sm text-green-700 space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Your download count has been reset
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    All new features are now available
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Same billing date maintained
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => navigate("/user/dashboard")}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Go to Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/paystub-generator")}
                  className="w-full"
                >
                  Generate a Document
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
}
