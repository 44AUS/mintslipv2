import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function SubscriptionCancel() {
  const navigate = useNavigate();

  // Clean up pending subscription data
  localStorage.removeItem("pending_subscription_id");
  localStorage.removeItem("pending_subscription_tier");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
      <Header title="MintSlip" />

      <main className="flex-1 flex items-center justify-center py-16">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="space-y-6">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 text-slate-500" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">
              Subscription Cancelled
            </h1>
            <p className="text-lg text-slate-600">
              Your subscription was not completed. No charges have been made to your account.
            </p>
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <p className="text-slate-600 text-sm">
                Changed your mind? You can always come back and subscribe later. 
                Our plans offer great value for professional document generation.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => navigate("/pricing")}
                className="bg-green-600 hover:bg-green-700"
              >
                View Plans Again
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/")}
              >
                Go to Home
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
