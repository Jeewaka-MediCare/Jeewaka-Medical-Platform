# Mobile App Stripe Payment Integration

## Overview

The mobile app now includes complete Stripe payment integration for booking medical appointments. The payment flow follows the same pattern as the web application but uses React Native Stripe SDK.

## Implementation Details

### Components Added

1. **Payment Service** (`services/paymentService.js`)

   - Handles payment intent creation
   - Manages booking confirmation
   - Includes retry logic for booking confirmation

2. **Payment Checkout Screen** (`app/payment-checkout.jsx`)

   - Stripe card input form
   - Payment processing
   - Error handling and retry logic

3. **Payment Success Screen** (`app/payment-success.jsx`)
   - Booking confirmation
   - Success feedback
   - Navigation to appointments

### Integration Points

#### 1. Book Session Flow

- Modified `app/book-session/[sessionId].jsx`
- Clicking "Proceed to Payment" now navigates to payment checkout
- Consultation fee is properly passed to payment

#### 2. Payment Processing

- Uses existing backend APIs (`/api/payments/create-intent`, `/api/session/{id}/book`)
- No duplication of backend logic
- Maintains consistency with web implementation

#### 3. Fee Display

- Doctor consultation fees are shown on doctor profile
- Session-specific fees are displayed in booking summary
- Fees are formatted as "LKR {amount}"

## Configuration Required

### Environment Variables (.env)

```
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
EXPO_PUBLIC_BACKEND_URL=http://your-backend-url:5000
```

### Backend Configuration

Ensure backend has the following environment variables:

```
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## Testing the Implementation

### Prerequisites

1. Backend server running with Stripe configured
2. Mobile app with valid Stripe publishable key
3. Test user account (patient)

### Test Flow

1. **Doctor Selection**

   - Open app and browse doctors
   - Verify consultation fee is displayed on doctor cards
   - Select a doctor

2. **Session Selection**

   - View doctor details and sessions
   - Select an available session
   - Navigate to booking screen

3. **Time Slot Selection**

   - Select an available time slot
   - Verify fee is shown in booking summary
   - Click "Proceed to Payment"

4. **Payment Processing**

   - Enter test card details (4242 4242 4242 4242)
   - Click "Pay LKR {amount}"
   - Verify payment is processed

5. **Booking Confirmation**
   - Should automatically navigate to success screen
   - Verify booking details are shown
   - Check appointment appears in "My Appointments"

### Test Cards (Stripe Test Mode)

- **Success**: 4242 4242 4242 4242
- **Declined**: 4000 0000 0000 0002
- **Insufficient Funds**: 4000 0000 0000 9995

## Troubleshooting

### Common Issues

1. **"Stripe not configured" Error**

   - Check `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` in .env
   - Ensure key starts with `pk_test_` for test mode

2. **Payment Intent Creation Failed**

   - Verify backend is running and accessible
   - Check backend Stripe configuration
   - Ensure consultation fee is available in session data

3. **Booking Confirmation Failed**

   - Check backend logs for webhook processing
   - Verify session ID and slot index are correct
   - Ensure patient ID is properly resolved

4. **Navigation Issues**
   - Verify payment routes are added to `_layout.tsx`
   - Check route parameters are properly passed

### Debug Steps

1. **Check Console Logs**

   ```bash
   # Mobile app logs
   npx expo start
   # Look for payment-related logs
   ```

2. **Backend Verification**

   ```bash
   # Check if payment intent was created
   curl -X POST http://localhost:5000/api/payments/create-intent \
     -H "Content-Type: application/json" \
     -d '{"amount": 50, "currency": "usd", "metadata": {"sessionId": "test"}}'
   ```

3. **Database Verification**
   - Check if session slot was updated with payment details
   - Verify payment intent ID is stored in the slot

## Security Considerations

1. **Never expose secret keys** in mobile app code
2. **Use environment variables** for all configuration
3. **Validate payment** server-side before confirming booking
4. **Implement proper error handling** for sensitive operations

## Future Enhancements

1. **Apple Pay/Google Pay** integration
2. **Multiple payment methods** support
3. **Payment history** in user profile
4. **Refund handling** for cancelled appointments
5. **Currency selection** for international users

## Support

For issues with the payment integration:

1. Check backend logs for detailed error information
2. Verify Stripe dashboard for payment status
3. Test with different payment scenarios
4. Review network requests in developer tools
