import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  LogOut
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

// Subscription tiers
const SUBSCRIPTION_TIERS = [
  {
    id: "basic",
    name: "Basic",
    price: 19.99,
    downloads: 5,
    icon: Zap,
    color: "green",
    popular: false,
    features: [
      "5 document downloads per month",
      "All document types included",
      "All templates available",
      "Email support",
      "Download history"
    ]
  },
  {
    id: "pro",
    name: "Pro",
    price: 29.99,
    downloads: 10,
    icon: Sparkles,
    color: "blue",
    popular: true,
    features: [
      "10 document downloads per month",
      "All document types included",
      "All templates available",
      "Priority email support",
      "Download history",
      "Early access to new features"
    ]
  },
  {
    id: "unlimited",
    name: "Unlimited",
    price: 49.99,
    downloads: -1,
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
];

export default function SubscriptionChoose() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("userToken");
    const userInfo = localStorage.getItem("userInfo");
    
    if (!token || !userInfo) {
      navigate("/signup");
      return;
    }

    const parsedUser = JSON.parse(userInfo);
    setUser(parsedUser);

    // If user already has subscription, redirect to dashboard
    if (parsedUser.subscription) {
      navigate("/user/dashboard");
      return;
    }

    setIsLoading(false);
  }, [navigate]);

  const handleSelectTier = (tierId) => {
    setSelectedTier(tierId);
  };

  const handleSubscribe = async () => {
    if (!selectedTier) {
      toast.error("Please select a subscription plan");
      return;
    }

    setIsProcessing(true);
    
    // For now, show a message that PayPal subscriptions need to be configured
    // In production, this would redirect to PayPal subscription flow
    toast.info("PayPal subscription integration coming soon! For now, contact support to activate your subscription.");
    setIsProcessing(false);
    
    // TODO: Implement PayPal subscription flow
    // This would involve:
    // 1. Creating PayPal subscription plans in PayPal dashboard
    // 2. Using PayPal JS SDK to show subscription buttons
    // 3. Handling subscription.created webhook
  };

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userInfo");
    navigate("/login");
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">MintSlip</h1>
              <p className="text-sm text-slate-500">Choose your plan</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">Welcome, {user?.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-slate-600 hover:text-slate-800"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
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
          {SUBSCRIPTION_TIERS.map((tier) => {
            const isSelected = selectedTier === tier.id;
            const colors = getColorClasses(tier.color, isSelected);
            const Icon = tier.icon;

            return (
              <div
                key={tier.id}
                onClick={() => handleSelectTier(tier.id)}
                className={`
                  relative rounded-2xl border-2 p-6 cursor-pointer transition-all duration-300
                  ${colors.border} ${colors.bg}
                  ${isSelected ? "shadow-xl scale-[1.02]" : "shadow-sm hover:shadow-md hover:scale-[1.01]"}
                  ${tier.popular ? "md:-mt-4 md:mb-4" : ""}
                `}
              >
                {/* Popular Badge */}
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`px-4 py-1 rounded-full text-sm font-semibold ${colors.badge}`}>
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <Check className={`w-4 h-4 ${tier.color === "green" ? "text-green-600" : tier.color === "blue" ? "text-blue-600" : "text-purple-600"}`} />
                    </div>
                  </div>
                )}

                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${isSelected ? "bg-white/20" : colors.badge}`}>
                  <Icon className={`w-7 h-7 ${colors.icon}`} />
                </div>

                {/* Tier Name */}
                <h3 className={`text-xl font-bold mb-2 ${colors.text}`}>
                  {tier.name}
                </h3>

                {/* Price */}
                <div className="mb-4">
                  <span className={`text-4xl font-bold ${colors.text}`}>
                    ${tier.price}
                  </span>
                  <span className={`text-sm ${isSelected ? "text-white/80" : "text-slate-500"}`}>
                    /month
                  </span>
                </div>

                {/* Downloads */}
                <div className={`text-sm font-medium mb-6 ${isSelected ? "text-white/90" : "text-slate-600"}`}>
                  {tier.downloads === -1 ? (
                    <span className="flex items-center gap-1">
                      <span className="text-lg">∞</span> Unlimited downloads
                    </span>
                  ) : (
                    `${tier.downloads} downloads per month`
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className={`flex items-start gap-2 text-sm ${isSelected ? "text-white/90" : "text-slate-600"}`}>
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isSelected ? "text-white" : "text-green-600"}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Subscribe Button */}
        <div className="text-center">
          <Button
            onClick={handleSubscribe}
            disabled={!selectedTier || isProcessing}
            className={`
              px-12 py-6 text-lg font-semibold rounded-xl shadow-lg
              ${selectedTier === "basic" ? "bg-green-600 hover:bg-green-700" : ""}
              ${selectedTier === "pro" ? "bg-blue-600 hover:bg-blue-700" : ""}
              ${selectedTier === "unlimited" ? "bg-purple-600 hover:bg-purple-700" : ""}
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
                {selectedTier ? `Subscribe to ${SUBSCRIPTION_TIERS.find(t => t.id === selectedTier)?.name}` : "Select a Plan"}
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
                a: "Absolutely! You can change your plan at any time. Changes will take effect at the start of your next billing cycle."
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

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-slate-500">
          <p>© 2024 MintSlip. All rights reserved.</p>
          <p className="mt-2">
            Questions? Contact us at support@mintslip.com
          </p>
        </div>
      </footer>
    </div>
  );
}
