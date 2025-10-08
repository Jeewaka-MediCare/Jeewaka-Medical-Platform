import { loadStripe } from '@stripe/stripe-js';
import api from './api.js';

// Initialize Stripe with publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_stripe_publishable_key_here');

export const paymentService = {
  // Load Stripe instance
  getStripe: () => {
    return stripePromise;
  },

  // Create payment intent
  createPaymentIntent: async (paymentData) => {
    try {
      console.log('💳 PaymentService - Sending payment data:', paymentData);
      const response = await api.post('/api/payments/create-intent', paymentData);
      console.log('💳 PaymentService - Payment intent created:', response.data);
      return response.data;
    } catch (error) {
      console.error('💳 PaymentService - Error creating payment intent:', error);
      console.error('💳 PaymentService - Error status:', error.response?.status);
      console.error('💳 PaymentService - Error data:', error.response?.data);
      console.error('💳 PaymentService - Error message:', error.message);
      
      // Re-throw with more context
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      const errorDetails = error.response?.data?.debug || null;
      
      const enhancedError = new Error(errorMessage);
      enhancedError.status = error.response?.status;
      enhancedError.details = errorDetails;
      enhancedError.originalError = error;
      
      throw enhancedError;
    }
  },

  // Book appointment after payment
  bookAppointment: async (sessionId, bookingData) => {
    try {
      const response = await api.post(`/api/session/${sessionId}/book`, bookingData);
      return response.data;
    } catch (error) {
      console.error('Error booking appointment:', error);
      throw error;
    }
  },

  // Process payment and booking
  processPaymentAndBooking: async (paymentData, bookingData) => {
    try {
      // Step 1: Create payment intent
      const { clientSecret, paymentIntentId } = await paymentService.createPaymentIntent(paymentData);

      // Step 2: Store payment data in sessionStorage for the payment page
      const paymentSessionData = {
        clientSecret,
        paymentIntentId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        sessionId: paymentData.metadata?.sessionId,
        slotIndex: paymentData.metadata?.slotIndex,
        patientId: paymentData.metadata?.patientId,
        doctorName: paymentData.metadata?.doctorName || 'Doctor',
        appointmentDate: paymentData.metadata?.appointmentDate || 'TBD'
      };

      sessionStorage.setItem('paymentSession', JSON.stringify(paymentSessionData));

      // Step 3: Redirect to custom payment page
      window.location.href = '/payment-checkout';

      return { success: true };
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  },

  // Handle successful payment return
  handlePaymentSuccess: async (sessionId, paymentIntentId, slotIndex, patientId) => {
    // Booking can race with Stripe webhook processing. Retry a few times for transient states
    const bookingData = {
      slotIndex: parseInt(slotIndex, 10),
      patientId: patientId,
      paymentIntentId: paymentIntentId
    };

    const maxAttempts = 5;
    const delayMs = 1000; // 1 second between attempts

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await paymentService.bookAppointment(sessionId, bookingData);
        return result;
      } catch (error) {
        const status = error.response?.status;
        const serverMessage = error.response?.data?.error || error.message;

        // If the slot is temporarily unavailable or payment not yet processed, retry
        const isTransient = status === 400 && /payment not completed|not completed|not available|temporar/i.test(String(serverMessage).toLowerCase());

        // If it's a 409 conflict, it's a real concurrency conflict - surface immediately
        if (status === 409) {
          console.error('Booking conflict (409) from server:', serverMessage);
          throw error;
        }

        if (attempt < maxAttempts && isTransient) {
          console.warn(`Booking attempt ${attempt} failed with transient error, retrying after ${delayMs}ms:`, serverMessage);
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }

        // Give up and bubble the error
        console.error('Error confirming booking after retries:', serverMessage);
        throw error;
      }
    }
  }
};

export default paymentService;
