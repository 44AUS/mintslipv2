import { useState } from "react";
import { useStripe, useElements, PaymentRequestButtonElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Lock } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

/**
 * StripePaymentButton - A component for one-time Stripe payments
 * Supports both regular card payments via redirect and Apple Pay/Google Pay
 * 
 * @param {number} amount - Amount in dollars (e.g., 9.99)
 * @param {string} documentType - Type of document being purchased
 * @param {string} template - Template being used
 * @param {object} appliedDiscount - Discount object if any
 * @param {function} onSuccess - Callback on successful payment
 * @param {function} onError - Callback on payment error
 * @param {boolean} disabled - Whether button is disabled
 */
export default function StripePaymentButton({
  amount,
  documentType,
  template,
  appliedDiscount,
  onSuccess,
  onError,
  disabled = false,
  buttonText = "Pay with Card"
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [canMakePayment, setCanMakePayment] = useState(false);

  // Calculate final amount
  const finalAmount = appliedDiscount ? appliedDiscount.discountedPrice : amount;

  // Initialize Payment Request for Apple Pay / Google Pay
  useState(() => {
    if (stripe) {
      const pr = stripe.paymentRequest({
        country: "US",
        currency: "usd",
        total: {
          label: `MintSlip - ${documentType}`,
          amount: Math.round(finalAmount * 100), // Convert to cents
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      pr.canMakePayment().then((result) => {
        if (result) {
          setPaymentRequest(pr);
          setCanMakePayment(true);
        }
      });

      pr.on("paymentmethod", async (ev) => {
        setIsProcessing(true);
        try {
          // Create payment intent on backend
          const response = await fetch(`${BACKEND_URL}/api/stripe/create-payment-intent`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: finalAmount,
              documentType,
              template,
              discountCode: appliedDiscount?.code || null,
              discountAmount: appliedDiscount ? amount - finalAmount : 0,
            }),
          });

          const { clientSecret, paymentIntentId } = await response.json();

          // Confirm the payment
          const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
            clientSecret,
            { payment_method: ev.paymentMethod.id },
            { handleActions: false }
          );

          if (confirmError) {
            ev.complete("fail");
            throw new Error(confirmError.message);
          }

          ev.complete("success");

          if (paymentIntent.status === "succeeded") {
            onSuccess?.({
              paymentIntentId,
              payerEmail: ev.payerEmail,
              payerName: ev.payerName,
            });
          }
        } catch (error) {
          console.error("Payment error:", error);
          onError?.(error);
          toast.error(error.message || "Payment failed");
        } finally {
          setIsProcessing(false);
        }
      });
    }
  }, [stripe, finalAmount, documentType]);

  // Handle regular card payment (redirect to Stripe Checkout)
  const handleCardPayment = async () => {
    if (!stripe) {
      toast.error("Stripe is not loaded yet. Please try again.");
      return;
    }

    setIsProcessing(true);

    try {
      // Get current URL for redirects
      const origin = window.location.origin;
      const currentPath = window.location.pathname;
      
      // Create checkout session for one-time payment
      const response = await fetch(`${BACKEND_URL}/api/stripe/create-one-time-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          documentType,
          template,
          discountCode: appliedDiscount?.code || null,
          discountAmount: appliedDiscount ? amount - finalAmount : 0,
          successUrl: `${origin}/payment-success?type=${documentType}&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${origin}${currentPath}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to create checkout session");
      }

      if (data.url) {
        // Store info for after payment
        sessionStorage.setItem("pendingPayment", JSON.stringify({
          documentType,
          template,
          sessionId: data.sessionId,
        }));
        
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Payment error:", error);
      onError?.(error);
      toast.error(error.message || "Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Apple Pay / Google Pay Button */}
      {canMakePayment && paymentRequest && (
        <div className="w-full">
          <PaymentRequestButtonElement
            options={{ paymentRequest }}
            className="w-full"
          />
          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">or</span>
            </div>
          </div>
        </div>
      )}

      {/* Regular Card Payment Button */}
      <Button
        onClick={handleCardPayment}
        disabled={disabled || isProcessing || !stripe}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold rounded-xl gap-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            {buttonText} - ${finalAmount.toFixed(2)}
          </>
        )}
      </Button>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
        <Lock className="w-3 h-3" />
        <span>Secured by Stripe</span>
      </div>
    </div>
  );
}
