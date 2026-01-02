import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import {
  Check,
  Sparkles,
  Zap,
  Crown,
  FileText,
  Download,
  Shield,
  Clock,
  ArrowRight,
  Loader2,
  TrendingUp
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

export default function SubscriptionPlans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState(null);
  
  // Upgrade dialog state
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [upgradeDetails, setUpgradeDetails] = useState(null);
  const [isCalculatingUpgrade, setIsCalculatingUpgrade] = useState(false);

  // Plan configurations with icons and colors
  const PLAN_CONFIG = {
    starter: {
      icon: Zap,
      color: "green",
      popular: false,
      features: [
        "10 document downloads per month",
        "All document types included",
        "All templates available",
        "Email support",
        "Download history"
      ]
    },
    professional: {
      icon: Sparkles,
      color: "blue",
      popular: true,
      features: [
        "30 document downloads per month",
        "All document types included",
        "All templates available",
        "Priority email support",
        "Download history",
        "Early access to new features"
      ]
    },
    business: {
      icon: Crown,
      color: "purple",
      popular: false,
      features: [
        "Unlimited downloads",
        "All document types included",
        "All templates available",
        "Priority support",
        "Download history",
        "Early access to new features",
        "Bulk generation tools"
      ]
    }
  };

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

  const handleSelectTier = (tier) => {
    setSelectedTier(tier);
  };

  const handleSubscribe = async () => {
    if (!selectedTier) {
      toast.error("Please select a subscription plan");
      return;
    }

    if (!user) {
      toast.error("Please log in to subscribe");
      navigate("/login?redirect=/pricing");
      return;
    }

    setIsProcessing(true);

    try {
      const token = localStorage.getItem("userToken");
      const response = await fetch(`${BACKEND_URL}/api/subscriptions/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ tier: selectedTier })
      });

      const data = await response.json();

      if (data.success && data.approval_url) {
        // Store subscription ID for later activation
        localStorage.setItem("pending_subscription_id", data.subscription_id);
        localStorage.setItem("pending_subscription_tier", selectedTier);
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
    }
  };

  // Check if this is an upgrade (user has subscription and selecting higher tier)
  const isUpgrade = (tier) => {
    if (!user?.subscription?.tier) return false;
    const tierOrder = { starter: 1, professional: 2, business: 3 };
    return tierOrder[tier] > tierOrder[user.subscription.tier];
  };

  // Calculate upgrade cost
  const handleUpgradeClick = async (tier) => {
    if (!user) {
      toast.error("Please log in to upgrade");
      navigate("/login");
      return;
    }

    setIsCalculatingUpgrade(true);
    setSelectedTier(tier);

    try {
      const token = localStorage.getItem("userToken");
      const response = await fetch(`${BACKEND_URL}/api/subscriptions/calculate-upgrade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ newTier: tier })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to calculate upgrade");
      }

      setUpgradeDetails(data);
      setUpgradeDialogOpen(true);
    } catch (error) {
      console.error("Error calculating upgrade:", error);
      toast.error(error.message || "Failed to calculate upgrade cost");
    } finally {
      setIsCalculatingUpgrade(false);
    }
  };

  // Process the upgrade payment
  const handleConfirmUpgrade = async () => {
    if (!upgradeDetails) return;

    setIsProcessing(true);

    try {
      const token = localStorage.getItem("userToken");
      const response = await fetch(`${BACKEND_URL}/api/subscriptions/upgrade/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ newTier: upgradeDetails.newTier })
      });

      const data = await response.json();

      if (data.success && data.approvalUrl) {
        // Store upgrade info for later
        localStorage.setItem("pending_upgrade_order_id", data.orderId);
        localStorage.setItem("pending_upgrade_tier", upgradeDetails.newTier);
        // Redirect to PayPal for approval
        window.location.href = data.approvalUrl;
      } else {
        throw new Error(data.detail || "Failed to create upgrade order");
      }
    } catch (error) {
      console.error("Error creating upgrade order:", error);
      toast.error(error.message || "Failed to process upgrade");
    } finally {
      setIsProcessing(false);
    }
  };

  const getColorClasses = (color, isSelected) => {
    const colors = {
      green: {
        bg: isSelected ? "bg-green-600" : "bg-white",
        border: isSelected ? "border-green-600" : "border-slate-200",
        text: isSelected ? "text-white" : "text-slate-800",
        badge: "bg-green-100 text-green-700",
        icon: isSelected ? "text-white" : "text-green-600",
        button: "bg-green-600 hover:bg-green-700"
      },
      blue: {
        bg: isSelected ? "bg-blue-600" : "bg-white",
        border: isSelected ? "border-blue-600" : "border-blue-200",
        text: isSelected ? "text-white" : "text-slate-800",
        badge: "bg-blue-100 text-blue-700",
        icon: isSelected ? "text-white" : "text-blue-600",
        button: "bg-blue-600 hover:bg-blue-700"
      },
      purple: {
        bg: isSelected ? "bg-purple-600" : "bg-white",
        border: isSelected ? "border-purple-600" : "border-slate-200",
        text: isSelected ? "text-white" : "text-slate-800",
        badge: "bg-purple-100 text-purple-700",
        icon: isSelected ? "text-white" : "text-purple-600",
        button: "bg-purple-600 hover:bg-purple-700"
      }
    };
    return colors[color];
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex flex-col">
      <Header title="MintSlip" />

      <main className="flex-1 max-w-6xl mx-auto px-4 py-12 w-full">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-800 mb-4">
            Choose Your Subscription Plan
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Get unlimited access to professional document generation. 
            Cancel anytime, no questions asked.
          </p>
        </div>

        {/* Benefits Bar */}
        <div className="flex flex-wrap justify-center gap-6 mb-12">
          {[
            { icon: Download, text: "Instant Downloads" },
            { icon: Shield, text: "Secure & Private" },
            { icon: Clock, text: "Cancel Anytime" },
            { icon: FileText, text: "All Templates Included" }
          ].map((benefit, idx) => (
            <div key={idx} className="flex items-center gap-2 text-slate-600">
              <benefit.icon className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">{benefit.text}</span>
            </div>
          ))}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => {
            const config = PLAN_CONFIG[plan.tier] || PLAN_CONFIG.starter;
            const isSelected = selectedTier === plan.tier;
            const colors = getColorClasses(config.color, isSelected);
            const Icon = config.icon;
            const isCurrentPlan = user?.subscription?.tier === plan.tier;

            return (
              <div
                key={plan.tier}
                onClick={() => !isCurrentPlan && handleSelectTier(plan.tier)}
                className={`
                  relative rounded-2xl border-2 p-6 transition-all duration-300
                  ${isCurrentPlan ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
                  ${colors.border} ${colors.bg}
                  ${isSelected ? "shadow-xl scale-[1.02]" : "shadow-sm hover:shadow-md hover:scale-[1.01]"}
                  ${config.popular ? "md:-mt-4 md:mb-4" : ""}
                `}
              >
                {/* Popular Badge */}
                {config.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`px-4 py-1 rounded-full text-sm font-semibold ${colors.badge}`}>
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-600">
                      Current Plan
                    </span>
                  </div>
                )}

                {/* Selection Indicator */}
                {isSelected && !isCurrentPlan && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <Check className={`w-4 h-4 ${config.color === "green" ? "text-green-600" : config.color === "blue" ? "text-blue-600" : "text-purple-600"}`} />
                    </div>
                  </div>
                )}

                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${isSelected ? "bg-white/20" : colors.badge}`}>
                  <Icon className={`w-7 h-7 ${colors.icon}`} />
                </div>

                {/* Tier Name */}
                <h3 className={`text-xl font-bold mb-2 ${colors.text}`}>
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-4">
                  <span className={`text-4xl font-bold ${colors.text}`}>
                    ${plan.price}
                  </span>
                  <span className={`text-sm ${isSelected ? "text-white/80" : "text-slate-500"}`}>
                    /month
                  </span>
                </div>

                {/* Downloads */}
                <div className={`text-sm font-medium mb-6 ${isSelected ? "text-white/90" : "text-slate-600"}`}>
                  {plan.downloads === -1 ? (
                    <span className="flex items-center gap-1">
                      <span className="text-lg">∞</span> Unlimited downloads
                    </span>
                  ) : (
                    `${plan.downloads} downloads per month`
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3">
                  {config.features.map((feature, idx) => (
                    <li key={idx} className={`flex items-start gap-2 text-sm ${isSelected ? "text-white/90" : "text-slate-600"}`}>
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isSelected ? "text-white" : "text-green-600"}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Upgrade Button - shown inline for users with subscription */}
                {user?.subscription?.tier && isUpgrade(plan.tier) && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpgradeClick(plan.tier);
                    }}
                    disabled={isCalculatingUpgrade && selectedTier === plan.tier}
                    className={`w-full mt-6 ${colors.button} text-white`}
                  >
                    {isCalculatingUpgrade && selectedTier === plan.tier ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Upgrade Now
                      </>
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Subscribe Button */}
        <div className="text-center">
          <Button
            onClick={handleSubscribe}
            disabled={!selectedTier || isProcessing || (user?.subscription?.tier === selectedTier)}
            className={`
              px-12 py-6 text-lg font-semibold rounded-xl shadow-lg
              ${selectedTier === "starter" ? "bg-green-600 hover:bg-green-700" : ""}
              ${selectedTier === "professional" ? "bg-blue-600 hover:bg-blue-700" : ""}
              ${selectedTier === "business" ? "bg-purple-600 hover:bg-purple-700" : ""}
              ${!selectedTier ? "bg-slate-400" : ""}
              text-white gap-2
            `}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {selectedTier ? `Subscribe to ${plans.find(p => p.tier === selectedTier)?.name}` : "Select a Plan"}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>

          <p className="mt-4 text-sm text-slate-500">
            Secure payment via PayPal. Cancel anytime.
          </p>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-slate-800 text-center mb-8">
            Frequently Asked Questions
          </h3>
          
          <div className="space-y-4">
            {[
              {
                q: "Can I cancel anytime?",
                a: "Yes! You can cancel your subscription at any time from your account settings. Your access will continue until the end of your billing period."
              },
              {
                q: "What happens to unused downloads?",
                a: "Unused downloads do not roll over to the next month. Your download count resets at the start of each billing cycle."
              },
              {
                q: "Can I upgrade or downgrade my plan?",
                a: "You can upgrade your plan at any time and pay the prorated difference immediately. The new downloads and features are available right away."
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept PayPal and all major credit cards through PayPal's secure payment system."
              }
            ].map((faq, idx) => (
              <div key={idx} className="bg-white rounded-xl p-5 border border-slate-200">
                <h4 className="font-semibold text-slate-800 mb-2">{faq.q}</h4>
                <p className="text-slate-600 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Upgrade Confirmation Dialog */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Upgrade Your Plan
            </DialogTitle>
            <DialogDescription>
              You're upgrading from {upgradeDetails?.currentTier && plans.find(p => p.tier === upgradeDetails.currentTier)?.name} to {upgradeDetails?.newTier && plans.find(p => p.tier === upgradeDetails.newTier)?.name}
            </DialogDescription>
          </DialogHeader>

          {upgradeDetails && (
            <div className="space-y-4 py-4">
              {/* Pricing breakdown */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Current plan</span>
                  <span className="font-medium">${upgradeDetails.currentPrice}/month</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">New plan</span>
                  <span className="font-medium">${upgradeDetails.newPrice}/month</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Days remaining in cycle</span>
                  <span className="font-medium">{upgradeDetails.daysRemaining} days</span>
                </div>
                <div className="border-t border-slate-200 pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-800">Prorated charge today</span>
                    <span className="font-bold text-green-600 text-lg">${upgradeDetails.proratedAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* What you get */}
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  What you'll get immediately
                </h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    {upgradeDetails.newDownloads === -1 ? "Unlimited" : upgradeDetails.newDownloads} downloads reset
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    All {plans.find(p => p.tier === upgradeDetails.newTier)?.name} features
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Same billing date maintained
                  </li>
                </ul>
              </div>

              <p className="text-xs text-slate-500 text-center">
                Your next full charge of ${upgradeDetails.newPrice} will be on your regular billing date.
              </p>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setUpgradeDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmUpgrade}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Pay ${upgradeDetails?.proratedAmount.toFixed(2)} & Upgrade
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
