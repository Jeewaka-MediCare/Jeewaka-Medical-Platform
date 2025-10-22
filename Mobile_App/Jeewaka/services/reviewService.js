import api from "./api";

export const reviewService = {
  // Submit a new review or update existing one
  submitReview: async (reviewData) => {
    try {
      const response = await api.post("/api/rating", reviewData);
      return response.data;
    } catch (error) {
      console.error("ReviewService - Error submitting review:", error);
      throw error;
    }
  },

  // Get all reviews for a doctor
  getDoctorReviews: async (doctorId) => {
    try {
      const response = await api.get(`/api/rating/doctor/${doctorId}`);
      return response.data;
    } catch (error) {
      console.error("ReviewService - Error fetching doctor reviews:", error);
      throw error;
    }
  },

  // Get average rating for a doctor
  getDoctorAverageRating: async (doctorId) => {
    try {
      const response = await api.get(`/api/rating/doctor/${doctorId}/average`);
      return response.data;
    } catch (error) {
      console.error(
        "ReviewService - Error fetching doctor average rating:",
        error
      );
      throw error;
    }
  },

  // Get review for a specific appointment
  getAppointmentReview: async (appointmentId, patientId) => {
    try {
      const response = await api.get(
        `/api/rating/appointment/${appointmentId}/patient/${patientId}`
      );
      return response.data;
    } catch (error) {
      console.error(
        "ReviewService - Error fetching appointment review:",
        error
      );
      return null;
    }
  },

  // Check if a patient has already reviewed a doctor (legacy method)
  checkExistingReview: async (doctorId, patientId) => {
    try {
      const reviews = await reviewService.getDoctorReviews(doctorId);
      const existingReview = reviews.find(
        (review) =>
          review.patient &&
          (review.patient === patientId || review.patient._id === patientId)
      );
      return existingReview || null;
    } catch (error) {
      console.error("ReviewService - Error checking existing review:", error);
      return null;
    }
  },

  // Bulk fetch ratings for multiple doctors (for search results)
  getBulkDoctorRatings: async (doctorIds) => {
    try {
      const ratingsPromises = doctorIds.map(async (doctorId) => {
        try {
          const ratingData = await reviewService.getDoctorAverageRating(
            doctorId
          );
          return {
            doctorId,
            ...ratingData,
          };
        } catch (error) {
          console.error(`Error fetching rating for doctor ${doctorId}:`, error);
          return {
            doctorId,
            avgRating: 0,
            totalReviews: 0,
          };
        }
      });

      return await Promise.all(ratingsPromises);
    } catch (error) {
      console.error("ReviewService - Error fetching bulk ratings:", error);
      throw error;
    }
  },
};

export default reviewService;
