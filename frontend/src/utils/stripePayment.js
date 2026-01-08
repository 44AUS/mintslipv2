/**
 * Stripe Payment Utility Functions
 * Shared utilities for handling Stripe one-time payments across all document generator forms
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

/**
 * Create a Stripe checkout session for one-time document purchase
 * @param {Object} options - Payment options
 * @param {number} options.amount - Amount in dollars
 * @param {string} options.documentType - Type of document being purchased
 * @param {string} options.template - Template being used (optional)
 * @param {Object} options.appliedDiscount - Discount object if any
 * @param {string} options.successPath - Path to redirect to on success
 * @param {string} options.cancelPath - Path to redirect to on cancel
 * @returns {Promise<{url: string, sessionId: string}>}
 */
export async function createStripeCheckout({
  amount,
  documentType,
  template = null,
  appliedDiscount = null,
  successPath = "/payment-success",
  cancelPath = "/",
  quantity = 1
}) {
  const origin = window.location.origin;
  const finalAmount = appliedDiscount ? appliedDiscount.discountedPrice : amount;
  
  // Get auth token if user is logged in
  const token = localStorage.getItem("userToken");
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${BACKEND_URL}/api/stripe/create-one-time-checkout`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      amount: finalAmount,
      documentType,
      template,
      discountCode: appliedDiscount?.code || null,
      discountAmount: appliedDiscount ? amount - finalAmount : 0,
      successUrl: `${origin}${successPath}?type=${documentType}&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}${cancelPath}`,
      quantity,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to create checkout session");
  }

  if (!data.url) {
    throw new Error("No checkout URL received");
  }

  return {
    url: data.url,
    sessionId: data.sessionId
  };
}

/**
 * Track a purchase in the backend
 * @param {Object} options - Purchase tracking options
 * @param {string} options.documentType - Type of document purchased
 * @param {number} options.amount - Amount paid
 * @param {string} options.paymentIntentId - Stripe payment intent ID
 * @param {string} options.email - Customer email
 * @param {string} options.template - Template used (optional)
 * @param {Object} options.discount - Discount applied (optional)
 */
export async function trackPurchase({
  documentType,
  amount,
  paymentIntentId,
  email = "",
  template = null,
  discount = null
}) {
  try {
    await fetch(`${BACKEND_URL}/api/purchases/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentType,
        amount,
        stripePaymentIntentId: paymentIntentId,
        email,
        discountCode: discount?.code || null,
        discountAmount: discount?.discountAmount || 0,
        template
      })
    });
  } catch (error) {
    console.error("Failed to track purchase:", error);
  }
}

/**
 * Get payment status from a Stripe checkout session
 * @param {string} sessionId - Stripe checkout session ID
 * @returns {Promise<Object>}
 */
export async function getCheckoutStatus(sessionId) {
  const response = await fetch(`${BACKEND_URL}/api/stripe/checkout-status/${sessionId}`);
  
  if (!response.ok) {
    throw new Error("Failed to get checkout status");
  }
  
  return response.json();
}
