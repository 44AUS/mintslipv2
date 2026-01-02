import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import {
  Check,
  Loader2,
  Zap,
  Sparkles,
  Crown,
  ArrowRight
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const PAYPAL_CLIENT_ID = process.env.REACT_APP_PAYPAL_CLIENT_ID;

const PLAN_ICONS = {
  starter: Zap,
  professional: Sparkles,
  business: Crown
};

const PLAN_COLORS = {
  starter: "green",
  professional: "purple",
  business: "amber"
};

export default function SubscriptionPlans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadPlans();
    checkUser();
  }, []);

  const checkUser = () => {
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
  };

  const loadPlans = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/subscriptions/plans`);
      const data = await response.json();
      if (data.success) {
        setPlans(data.plans);
      }
    } catch (error) {
      console.error("Error loading plans:", error);
      toast.error("Failed to load subscription plans");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (tier) => {
    if (!user) {
      toast.error("Please log in to subscribe");
      navigate("/login?redirect=/pricing");
      return;
    }

    setSelectedPlan(tier);
    setIsProcessing(true);

    try {
      const token = localStorage.getItem("userToken");
      const response = await fetch(`${BACKEND_URL}/api/subscriptions/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ tier })
      });

      const data = await response.json();

      if (data.success && data.approval_url) {
        // Store subscription ID for later activation
        localStorage.setItem("pending_subscription_id", data.subscription_id);
        localStorage.setItem("pending_subscription_tier", tier);
        // Redirect to PayPal for approval
        window.location.href = data.approval_url;
      } else {
        throw new Error(data.detail || "Failed to create subscription");
      }
    } catch (error) {
      console.error("Error creating subscription:", error);
      toast.error(error.message || "Failed to create subscription");
    } finally {
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header title="MintSlip" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
      <Header title="MintSlip" />

      <main className="flex-1 py-16">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-800 mb-4">
              Choose Your Plan
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Get unlimited access to professional document generation with our flexible subscription plans.
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => {
              const Icon = PLAN_ICONS[plan.tier] || Zap;
              const color = PLAN_COLORS[plan.tier] || "green";
              const isPopular = plan.tier === "professional";
              const isCurrentPlan = user?.subscription?.tier === plan.tier;

              return (
                <div
                  key={plan.tier}
                  className={`relative bg-white rounded-2xl border-2 p-8 transition-all duration-300 hover:shadow-xl ${
                    isPopular
                      ? "border-purple-500 shadow-lg scale-105"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-purple-500 text-white text-sm font-semibold px-4 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Plan Icon */}
                  <div className={`w-14 h-14 rounded-xl bg-${color}-100 flex items-center justify-center mb-6`}>
                    <Icon className={`w-7 h-7 text-${color}-600`} />
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">
                    {plan.name}
                  </h3>

                  {/* Price */}
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-slate-800">${plan.price}</span>
                    <span className="text-slate-500">/month</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-3">
                      <Check className={`w-5 h-5 text-${color}-500`} />
                      <span className="text-slate-600">
                        {plan.downloads === -1 ? "Unlimited" : plan.downloads} downloads/month
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className={`w-5 h-5 text-${color}-500`} />
                      <span className="text-slate-600">All document types</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className={`w-5 h-5 text-${color}-500`} />
                      <span className="text-slate-600">Priority support</span>
                    </li>
                    {plan.tier === "business" && (
                      <li className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-amber-500" />
                        <span className="text-slate-600">API access</span>
                      </li>
                    )}
                  </ul>

                  {/* CTA Button */}
                  {isCurrentPlan ? (
                    <Button
                      className="w-full"
                      variant="outline"
                      disabled
                    >
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      className={`w-full gap-2 ${
                        isPopular
                          ? "bg-purple-600 hover:bg-purple-700"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                      onClick={() => handleSubscribe(plan.tier)}
                      disabled={isProcessing && selectedPlan === plan.tier}
                    >
                      {isProcessing && selectedPlan === plan.tier ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Subscribe Now
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {/* FAQ Section */}
          <div className="mt-16 text-center">
            <p className="text-slate-600">
              Questions about subscriptions?{" "}
              <a href="/contact" className="text-green-600 hover:underline">
                Contact us
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
