import { useRef, useState } from "react";
import PaymentModal from "./PaymentModal";
import Paywall from "./Paywall";

// Drop-in replacement for <PaymentModal> that adds the exit-intent paywall:
// if the buyer closes the checkout without paying, a last-chance discounted
// offer for the same document is shown (once). Unlocking reopens the checkout
// at the offer price; dismissing closes everything. Data that never completes
// payment is untouched.
export default function CheckoutWithPaywall({
  docLabel, documentType, template, basePrice, discount = null,
  quantity = 1, onSuccess, onClose, previewImage = null,
}) {
  const [showPaywall, setShowPaywall] = useState(false);
  const [offerPrice, setOfferPrice] = useState(null); // discounted price once unlocked via the paywall
  const paidRef = useRef(false);
  const showPaywallRef = useRef(false); // synchronous mirror of showPaywall (guards double-taps)

  // A discounted offer price reopens checkout in server-enforced offer mode;
  // an unlock at full price (offer unavailable) is just a normal checkout.
  const effectiveDiscount = offerPrice != null
    ? (offerPrice < basePrice ? { discountedPrice: offerPrice, offer: true } : null)
    : discount;

  // Free orders (100%-off coupon) never need a discount pitch.
  const freeNow = (effectiveDiscount?.discountedPrice ?? basePrice) <= 0;

  const handleSuccess = async (args) => { paidRef.current = true; await onSuccess?.(args); };

  const handleModalClose = () => {
    // A double-tap on the X fires onClose twice before the modal unmounts —
    // ignore anything after we've decided to open the paywall.
    if (showPaywallRef.current) return;
    // Paid, free, or abandoning the already-discounted reopened checkout → close.
    if (paidRef.current || freeNow || offerPrice != null) { onClose?.(); return; }
    // First abandon → show the last-chance paywall.
    showPaywallRef.current = true;
    setShowPaywall(true);
  };

  const unlock = (discountedPrice) => { showPaywallRef.current = false; setOfferPrice(discountedPrice); setShowPaywall(false); };
  const dismissPaywall = () => { showPaywallRef.current = false; setShowPaywall(false); onClose?.(); };

  return (
    <>
      {!showPaywall && (
        <PaymentModal
          docLabel={docLabel}
          documentType={documentType}
          template={template}
          basePrice={basePrice}
          discount={effectiveDiscount}
          quantity={quantity}
          onSuccess={handleSuccess}
          onClose={handleModalClose}
        />
      )}
      {showPaywall && (
        <Paywall
          docLabel={docLabel}
          basePrice={basePrice}
          previewImage={previewImage}
          onUnlock={unlock}
          onDismiss={dismissPaywall}
        />
      )}
    </>
  );
}
