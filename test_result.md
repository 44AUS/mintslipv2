# MintSlip Stripe Integration Testing

## Test Scope
- Stripe subscription checkout flow
- Stripe one-time payment checkout flow
- Backend API endpoints for Stripe
- Frontend payment UI components

## Critical API Endpoints to Test
1. `GET /api/stripe/config` - Get publishable key
2. `POST /api/stripe/create-checkout-session` - Create subscription checkout (requires auth)
3. `POST /api/stripe/create-one-time-checkout` - Create one-time payment checkout
4. `GET /api/stripe/checkout-status/{session_id}` - Get checkout session status

## Pages to Test
1. `/pricing` - Subscription plans page with Stripe checkout
2. `/subscription/choose` - Subscription selection (requires login)
3. `/paystub-generator` - Document generator with Stripe payment button

## Incorporate User Feedback
None currently

## Test Files Location
/app/backend/tests/

## Notes
- PayPal has been replaced with Stripe throughout the application
- Subscription tiers: Starter ($19.99), Professional ($29.99), Business ($49.99)
- One-time payments for document generation ($9.99 per paystub, $14.99 for tax forms)
