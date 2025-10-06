import api from "./api";

export const paymentService = {
  // Create payment intent using existing backend API
  createPaymentIntent: async (paymentData) => {
    try {
      console.log(
        "Mobile PaymentService - Creating payment intent:",
        paymentData
      );
      const response = await api.post(
        "/api/payments/create-intent",
        paymentData
      );
      return response.data;
    } catch (error) {
      console.error(
        "Mobile PaymentService - Error creating payment intent:",
        error
      );
      console.error("Error response:", error.response?.data);
      throw error;
    }
  },

  // Book appointment after payment using existing backend API
  bookAppointment: async (sessionId, bookingData) => {
    try {
      console.log("Mobile PaymentService - Booking appointment:", {
        sessionId,
        bookingData,
      });
      const response = await api.post(
        `/api/session/${sessionId}/book`,
        bookingData
      );
      return response.data;
    } catch (error) {
      console.error(
        "Mobile PaymentService - Error booking appointment:",
        error
      );
      throw error;
    }
  },

  // Handle successful payment confirmation with retry logic (similar to web)
  handlePaymentSuccess: async (
    sessionId,
    paymentIntentId,
    slotIndex,
    patientId
  ) => {
    console.log("Mobile PaymentService - Handling payment success:", {
      sessionId,
      paymentIntentId,
      slotIndex,
      patientId,
    });

    const bookingData = {
      slotIndex: parseInt(slotIndex, 10),
      patientId: patientId,
      paymentIntentId: paymentIntentId,
    };

    const maxAttempts = 5;
    const delayMs = 1000; // 1 second between attempts

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await paymentService.bookAppointment(
          sessionId,
          bookingData
        );
        console.log(
          "Mobile PaymentService - Booking confirmed successfully:",
          result
        );
        return result;
      } catch (error) {
        const status = error.response?.status;
        const serverMessage = error.response?.data?.error || error.message;

        // If the slot is temporarily unavailable or payment not yet processed, retry
        const isTransient =
          status === 400 &&
          /payment not completed|not completed|not available|temporar/i.test(
            String(serverMessage).toLowerCase()
          );

        // If it's a 409 conflict, it's a real concurrency conflict - surface immediately
        if (status === 409) {
          console.error(
            "Mobile PaymentService - Booking conflict (409):",
            serverMessage
          );
          throw error;
        }

        if (attempt < maxAttempts && isTransient) {
          console.warn(
            `Mobile PaymentService - Booking attempt ${attempt} failed with transient error, retrying after ${delayMs}ms:`,
            serverMessage
          );
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }

        // Give up and bubble the error
        console.error(
          "Mobile PaymentService - Error confirming booking after retries:",
          serverMessage
        );
        throw error;
      }
    }
  },
};

export default paymentService;
