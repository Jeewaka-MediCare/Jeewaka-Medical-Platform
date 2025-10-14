import api from "./api";

/**
 * Doctor Search Service
 * Provides all search-related API calls for doctors
 */
export class DoctorSearchService {
  /**
   * Standard search with filters
   * @param {Object} filters - Search filters
   * @returns {Promise} - Search results
   */
  static async searchDoctors(filters = {}) {
    try {
      const queryParams = [];

      if (filters.name)
        queryParams.push(`name=${encodeURIComponent(filters.name)}`);
      if (filters.specialization)
        queryParams.push(
          `specialization=${encodeURIComponent(filters.specialization)}`
        );
      if (filters.subSpecialization)
        queryParams.push(
          `subSpecialization=${encodeURIComponent(filters.subSpecialization)}`
        );
      if (filters.minExperience)
        queryParams.push(`minExperience=${filters.minExperience}`);
      if (filters.maxExperience)
        queryParams.push(`maxExperience=${filters.maxExperience}`);
      if (filters.language)
        queryParams.push(`language=${encodeURIComponent(filters.language)}`);
      if (filters.minFee) queryParams.push(`minFee=${filters.minFee}`);
      if (filters.maxFee) queryParams.push(`maxFee=${filters.maxFee}`);
      if (filters.gender)
        queryParams.push(`gender=${encodeURIComponent(filters.gender)}`);
      if (filters.sortBy) queryParams.push(`sortBy=${filters.sortBy}`);
      if (filters.sortOrder) queryParams.push(`sortOrder=${filters.sortOrder}`);
      if (filters.page) queryParams.push(`page=${filters.page}`);
      if (filters.limit) queryParams.push(`limit=${filters.limit}`);

      const url =
        queryParams.length > 0
          ? `/api/doctor/search?${queryParams.join("&")}`
          : "/api/doctor/search";
      const response = await api.get(url);
      const doctors = response.data?.data?.doctors || [];

      // Fetch rating data for each doctor in search results
      const doctorsWithRatings = await Promise.all(
        doctors.map(async (doctor) => {
          try {
            const ratingResponse = await api.get(
              `/api/ratings/doctor/${doctor._id}/average`
            );
            return {
              ...doctor,
              avgRating: ratingResponse.data.avgRating || 0,
              totalReviews: ratingResponse.data.totalReviews || 0,
              ratingSummary: {
                avgRating: ratingResponse.data.avgRating || 0,
                totalReviews: ratingResponse.data.totalReviews || 0,
              },
              sessions: [],
            };
          } catch (error) {
            console.error(
              `Error fetching rating for doctor ${doctor._id}:`,
              error
            );
            return {
              ...doctor,
              avgRating: 0,
              totalReviews: 0,
              ratingSummary: { avgRating: 0, totalReviews: 0 },
              sessions: [],
            };
          }
        })
      );

      return {
        success: true,
        doctors: doctorsWithRatings,
        pagination: response.data?.data?.pagination || null,
        filters: response.data?.data?.filters || null,
      };
    } catch (error) {
      console.error("Standard search error:", error);
      throw new Error(
        `Search failed: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * AI-powered search using natural language
   * @param {string} query - Natural language query (symptoms, specializations, etc.)
   * @returns {Promise} - AI search results
   */
  static async aiSearchDoctors(query) {
    try {
      if (!query || query.trim().length === 0) {
        throw new Error("Search query cannot be empty");
      }

      const response = await api.get("/api/doctor/ai-search", {
        params: { query: query.trim() },
      });

      return {
        success: true,
        query: query,
        doctorCards: response.data?.doctorCards || [],
        isAISearch: true,
      };
    } catch (error) {
      console.error("AI search error:", error);
      throw new Error(
        `AI search failed: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Get AI search suggestions based on partial input
   * @param {string} partialQuery - Partial search query
   * @returns {Promise} - Search suggestions
   */
  static async getSearchSuggestions(partialQuery) {
    try {
      if (!partialQuery || partialQuery.length < 2) {
        return { success: true, suggestions: [] };
      }

      const response = await api.get("/api/doctor/ai-suggestions", {
        params: { partialQuery: partialQuery.trim() },
      });

      return {
        success: true,
        suggestions: response.data?.data?.suggestions || [],
      };
    } catch (error) {
      console.error("Search suggestions error:", error);
      // Don't throw error for suggestions, just return empty array
      return { success: false, suggestions: [] };
    }
  }

  /**
   * Get filter options for dropdowns
   * @returns {Promise} - Available filter options
   */
  static async getFilterOptions() {
    try {
      const response = await api.get("/api/doctor/filter-options");

      return {
        success: true,
        specializations: response.data?.data?.specializations || [],
        subSpecializations: response.data?.data?.subSpecializations || [],
        languages: response.data?.data?.languages || [],
        experienceRange: response.data?.data?.experienceRange || {
          min: 0,
          max: 30,
        },
        feeRange: response.data?.data?.feeRange || { min: 0, max: 50000 },
      };
    } catch (error) {
      console.error("Filter options error:", error);
      throw new Error(
        `Failed to load filter options: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  /**
   * Get all doctors (fallback for when no search is performed)
   * @returns {Promise} - All doctors
   */
  static async getAllDoctors() {
    try {
      // Use the doctorCard endpoint to get properly structured doctor data
      const response = await api.get("/api/doctorCard");
      const doctorCards = response.data || [];

      // Transform doctor cards to the expected format
      const transformedDoctors = doctorCards.map((card) => ({
        ...card.doctor,
        avgRating: card.ratingSummary?.avgRating || 0,
        totalReviews: card.ratingSummary?.totalReviews || 0,
        ratingSummary: card.ratingSummary || { avgRating: 0, totalReviews: 0 },
        sessions: card.sessions || [],
      }));

      return {
        success: true,
        doctors: transformedDoctors,
      };
    } catch (error) {
      console.error("Get all doctors error:", error);
      throw new Error(
        `Failed to load doctors: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  /**
   * Get doctor by ID with detailed information
   * @param {string} doctorId - Doctor's ID
   * @returns {Promise} - Doctor details
   */
  static async getDoctorById(doctorId) {
    try {
      const response = await api.get(`/api/doctor/${doctorId}`);
      return {
        success: true,
        doctor: response.data?.doctor || response.data,
      };
    } catch (error) {
      console.error("Get doctor by ID error:", error);
      throw new Error(
        `Failed to load doctor details: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }
}

export default DoctorSearchService;
