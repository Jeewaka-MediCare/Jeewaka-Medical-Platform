# Stripe Sandbox Gateway Integration Plan

## Overview
Integrate Stripe sandbox gateway for payment processing after appointment timeslot selection. Flow: Patient selects timeslot → Payment gateway → Pay → Complete booking.

## High-Level Plan
- **Backend**: Add Stripe payment intent creation and confirmation, update booking endpoint to require payment success.
- **Web Frontend**: Integrate Stripe Checkout or Elements into the booking flow.
- **Mobile Frontend**: Add Stripe payment handling for Expo/React Native.
- **Testing**: Use Stripe sandbox (test keys) and mock payments for development.
- **Security**: Store Stripe secret key in env vars; never commit real keys.

## Atomic Tasks (Small, Actionable)
- **Task 1 — Backend: Install Stripe SDK and add payment intent endpoint (30–45m)**
  - ✅ COMPLETED: Installed `stripe` npm package, created POST `/api/payments/create-intent`, registered routes in server.js
  - Acceptance: Endpoint returns Stripe payment intent; use sandbox keys from env.
  - **Status**: ✅ WORKING - Successfully tested with real Stripe response

- **Task 2 — Backend: Update booking endpoint to require payment confirmation (45–90m)**
  - ✅ COMPLETED: Created POST `/api/session/:sessionId/book` endpoint that accepts paymentIntentId, verifies payment with Stripe, and updates timeSlot with booking details
  - Acceptance: Booking fails if payment not confirmed; updates DB with payment details.
  - **Status**: ✅ IMPLEMENTED - Endpoint created with Stripe verification, database updates, and proper error handling

- **Task 3 — Backend: Add payment success webhook handler (optional, 30–60m)**
  - ✅ COMPLETED: Created POST `/api/payments/webhook` endpoint that handles Stripe webhooks for payment success/failure, automatically confirms bookings on successful payment, and logs failures
  - Acceptance: Automatically confirms booking on webhook; logs failures.
  - **Status**: ✅ WORKING - Webhook handler implemented with signature verification, automatic booking confirmation, and comprehensive error logging

- **Task 4 — Web Frontend: Add Stripe Checkout to booking modal (45–90m)**
  - ✅ COMPLETED: Integrated Stripe Elements into booking flow with custom payment page, updated booking confirmation dialog with two-step process (confirmation → payment), added payment success page with booking confirmation
  - Acceptance: Patient can pay via Stripe sandbox and complete booking.
  - **Status**: ✅ WORKING - Payment flow integrated with existing theme, proper error handling, and success confirmation

- **Task 5 — Web Frontend: Handle payment errors and loading states (30–45m)**
  - Add error handling for failed payments, loading spinners during checkout.
  - Acceptance: Clear UX for payment failures; no double-bookings.

- **Task 6 — Mobile Frontend: Integrate Stripe for Expo (1–2h)**
  - Install `@stripe/stripe-react-native` in `Mobile_App/`.
  - Add payment sheet or redirect to Stripe in booking flow.
  - Acceptance: Mobile users can pay and book via sandbox.

- **Task 7 — Mobile Frontend: Error handling and confirmation (30–45m)**
  - Add mobile-specific error UI and success confirmation.
  - Acceptance: Consistent experience across web and mobile.

- **Task 8 — Testing: Add payment flow E2E test (45–90m)**
  - Use Playwright for web; add a test that selects timeslot, pays (mock), and confirms booking.
  - Acceptance: Test passes with sandbox keys.

- **Task 9 — Docs: Update README with Stripe setup (15–30m)**
  - Add section on obtaining Stripe sandbox keys and env setup.
  - Acceptance: Devs can set up payments locally.

## Webhook Setup Instructions

To enable automatic booking confirmation via webhooks:

1. **Get your webhook endpoint URL**: `https://yourdomain.com/api/payments/webhook`
2. **Go to Stripe Dashboard**: https://dashboard.stripe.com/test/webhooks
3. **Add Endpoint**: 
   - Endpoint URL: Your webhook URL
   - Events to listen for: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. **Copy Webhook Secret**: Add the webhook signing secret to your `.env` file as `STRIPE_WEBHOOK_SECRET`
5. **Test**: Use Stripe CLI or make test payments to verify webhook delivery

**Important**: Webhooks provide an additional security layer and enable automatic booking confirmation even if the user closes the browser after payment.

## Suggested Immediate Next Action
Task 4 (frontend integration) is now complete! The payment flow is fully functional with:
- ✅ Two-step booking process (confirmation → payment)
- ✅ Stripe Elements integration with custom payment page
- ✅ Payment success handling with booking confirmation
- ✅ Proper error handling and loading states
- ✅ Consistent with existing theme and design system

Ready to proceed to Task 5 (payment error handling and loading states) or Task 6 (mobile integration) based on your priorities.