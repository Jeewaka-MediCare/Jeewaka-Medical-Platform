import api from "./api";
import { auth } from "../config/firebase";

// Helper function to wait for Firebase auth to be ready
const waitForAuth = async (maxWait = 2000) => {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      resolve(true);
      return;
    }

    const timeout = setTimeout(() => {
      resolve(false);
    }, maxWait);

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        clearTimeout(timeout);
        unsubscribe();
        resolve(true);
      }
    });
  });
};

export const paymentService = {
  // Create payment intent using new backend API with authentication
  createPaymentIntent: async (paymentData) => {
    try {
      // Ensure user is authenticated
      if (!auth.currentUser) {
        throw new Error("Authentication required for payment processing");
      }

      // The API interceptor will automatically add the Authorization header
      const response = await api.post(
        "/api/payments/create-intent",
        paymentData
      );
      return response.data;
    } catch (error) {
      console.error("Error creating payment intent:", error);
      console.error("Error response:", error.response?.data);
      throw error;
    }
  },

  // Handle successful payment confirmation with manual booking fallback
  handlePaymentSuccess: async (
    sessionId,
    paymentIntentId,
    slotIndex,
    patientId // NOTE: Backend doesn't use this, gets patient from Firebase UID in JWT token
  ) => {
    console.log(
      "Mobile PaymentService - Payment successful, attempting manual booking:",
      {
        sessionId,
        paymentIntentId,
        slotIndex,
        patientId,
      }
    );

    // Wait a bit for webhook processing (same as frontend)
    console.log(
      "Mobile PaymentService - Waiting 2 seconds for webhook processing..."
    );
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Use the same retry logic as the frontend for manual booking
    const bookingData = {
      slotIndex: parseInt(slotIndex, 10),
      paymentIntentId: paymentIntentId,
    };

    console.log("Mobile PaymentService - Prepared booking data:", bookingData);

    const maxAttempts = 5;
    const delayMs = 1000; // 1 second between attempts

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(
          `Mobile PaymentService - Booking attempt ${attempt}/${maxAttempts}`
        );
        console.log(
          `Mobile PaymentService - Making request to: /api/session/${sessionId}/book`
        );

        const response = await api.post(
          `/api/session/${sessionId}/book`,
          bookingData
        );

        console.log(
          "Mobile PaymentService - Booking successful:",
          response.data
        );
        return {
          success: true,
          message: "Appointment booked successfully!",
          data: response.data,
          paymentIntentId,
          sessionId,
          slotIndex,
        };
      } catch (error) {
        const status = error.response?.status;
        const serverMessage = error.response?.data?.error || error.message;

        console.log(
          `Mobile PaymentService - Booking attempt ${attempt} failed:`,
          {
            status,
            message: serverMessage,
            fullError: error.response?.data,
          }
        );

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
          throw new Error(
            serverMessage || "This slot has been booked by another patient."
          );
        }

        if (isTransient && attempt < maxAttempts) {
          console.log(`Mobile PaymentService - Retrying in ${delayMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        // Non-transient error or max attempts reached
        console.error(
          `Mobile PaymentService - Booking failed after ${attempt} attempts:`,
          serverMessage
        );
        throw new Error(
          serverMessage || "Failed to book appointment. Please contact support."
        );
      }
    }
  },

  // Get payment history for the authenticated user
  getPaymentHistory: async (filters = {}) => {
    try {
      // Ensure user is authenticated
      if (!auth.currentUser) {
        throw new Error("Authentication required to view payment history");
      }

      console.log(
        "Mobile PaymentService - Getting payment history with filters:",
        filters
      );

      // Build query parameters
      const params = new URLSearchParams();
      if (filters.status && filters.status !== "all") {
        params.append("status", filters.status);
      }
      if (filters.search) {
        params.append("search", filters.search);
      }
      if (filters.startDate) {
        params.append("startDate", filters.startDate);
      }
      if (filters.endDate) {
        params.append("endDate", filters.endDate);
      }
      if (filters.limit) {
        params.append("limit", filters.limit.toString());
      }
      if (filters.offset) {
        params.append("offset", filters.offset.toString());
      }

      const queryString = params.toString();
      const url = `/api/payments/history${
        queryString ? `?${queryString}` : ""
      }`;

      console.log("Mobile PaymentService - Making request to:", url);

      const response = await api.get(url);
      console.log(
        "Mobile PaymentService - Payment history response:",
        response.data
      );

      return response.data;
    } catch (error) {
      console.error(
        "Mobile PaymentService - Error getting payment history:",
        error
      );
      console.error("Error response:", error.response?.data);
      throw error;
    }
  },

  // Get specific payment details
  getPaymentDetails: async (paymentId) => {
    try {
      // Ensure user is authenticated
      if (!auth.currentUser) {
        throw new Error("Authentication required to view payment details");
      }

      console.log(
        "Mobile PaymentService - Getting payment details for:",
        paymentId
      );

      const response = await api.get(`/api/payments/${paymentId}`);
      console.log(
        "Mobile PaymentService - Payment details response:",
        response.data
      );

      return response.data;
    } catch (error) {
      console.error(
        "Mobile PaymentService - Error getting payment details:",
        error
      );
      console.error("Error response:", error.response?.data);
      throw error;
    }
  },

  // Get doctor earnings data (doctor-specific)
  getDoctorEarnings: async (filters = {}) => {
    try {
      // Wait for Firebase auth to be ready
      await waitForAuth();

      console.log(
        "Mobile PaymentService - Getting doctor earnings with filters:",
        filters
      );

      // Build query parameters
      const params = new URLSearchParams();
      if (filters.period) {
        params.append("period", filters.period);
      }
      if (filters.startDate) {
        params.append("startDate", filters.startDate);
      }
      if (filters.endDate) {
        params.append("endDate", filters.endDate);
      }
      if (filters.search) {
        params.append("search", filters.search);
      }
      if (filters.limit) {
        params.append("limit", filters.limit.toString());
      }
      if (filters.offset) {
        params.append("offset", filters.offset.toString());
      }

      const queryString = params.toString();
      const url = `/api/payments/earnings${
        queryString ? `?${queryString}` : ""
      }`;

      console.log("Mobile PaymentService - Making request to:", url);

      const response = await api.get(url);
      console.log(
        "Mobile PaymentService - Doctor earnings response:",
        response.data
      );

      return response.data;
    } catch (error) {
      console.error(
        "Mobile PaymentService - Error getting doctor earnings:",
        error
      );
      console.error("Error response:", error.response?.data);
      throw error;
    }
  },

  // Get doctor earnings statistics for charts (doctor-specific)
  getDoctorEarningsStats: async (
    timeRange = "4weeks-daily",
    year = null,
    month = null
  ) => {
    try {
      // Wait for Firebase auth to be ready
      await waitForAuth();

      console.log(
        "Mobile PaymentService - Getting doctor earnings statistics for timeRange:",
        timeRange,
        "year:",
        year,
        "month:",
        month
      );

      // Build query parameters
      const params = new URLSearchParams();
      params.append("timeRange", timeRange);

      // Add year and month parameters for monthly view
      if (timeRange === "monthly" && year && month) {
        params.append("year", year.toString());
        params.append("month", month.toString());
      }

      const queryString = params.toString();
      const url = `/api/payments/earnings/stats?${queryString}`;

      console.log(
        "Mobile PaymentService - Making earnings stats request to:",
        url
      );

      const response = await api.get(url);
      console.log(
        "Mobile PaymentService - Doctor earnings stats response:",
        response.data
      );

      return response.data;
    } catch (error) {
      console.error(
        "Mobile PaymentService - Error getting doctor earnings stats:",
        error
      );
      console.error("Error response:", error.response?.data);
      throw error;
    }
  },

  // Export waitForAuth method for testing
  waitForAuth,
};

export default paymentService;
