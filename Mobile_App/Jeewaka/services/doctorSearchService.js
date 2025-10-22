import api from "./api";
import reviewService from "./reviewService";

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

      // Fetch rating data for all doctors at once for better performance
      const doctorIds = doctors.map((doctor) => doctor._id);
      const bulkRatings = await reviewService.getBulkDoctorRatings(doctorIds);

      // Create a map for quick lookup
      const ratingsMap = bulkRatings.reduce((map, rating) => {
        map[rating.doctorId] = rating;
        return map;
      }, {});

      // Merge doctors with their rating data
      const doctorsWithRatings = doctors.map((doctor) => {
        const ratingData = ratingsMap[doctor._id] || {
          avgRating: 0,
          totalReviews: 0,
        };
        return {
          ...doctor,
          avgRating: ratingData.avgRating || 0,
          totalReviews: ratingData.totalReviews || 0,
          ratingSummary: {
            avgRating: ratingData.avgRating || 0,
            totalReviews: ratingData.totalReviews || 0,
          },
          sessions: [],
        };
      });

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
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of doctors per page
   * @returns {Promise} - Paginated doctors
   */
  static async getAllDoctors(page = 1, limit = 15) {
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

      // Apply client-side pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedDoctors = transformedDoctors.slice(startIndex, endIndex);

      return {
        success: true,
        doctors: paginatedDoctors,
        totalDoctors: transformedDoctors.length,
        currentPage: page,
        totalPages: Math.ceil(transformedDoctors.length / limit),
        hasMore: endIndex < transformedDoctors.length,
        allDoctors: transformedDoctors, // Keep for local filtering/sorting
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
