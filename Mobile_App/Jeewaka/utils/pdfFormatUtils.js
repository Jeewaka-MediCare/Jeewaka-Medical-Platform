// PDF formatting utilities
export const PDFFormatUtils = {
  /**
   * Format date for display in PDFs
   * @param {string|Date} dateValue - Date to format
   * @returns {string} Formatted date string
   */
  formatDate: (dateValue) => {
    if (!dateValue) return "N/A";
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "N/A";
    }
  },

  /**
   * Format date and time for display in PDFs
   * @param {string|Date} dateValue - Date to format
   * @returns {string} Formatted date and time string
   */
  formatDateTime: (dateValue) => {
    if (!dateValue) return "N/A";
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "N/A";
    }
  },

  /**
   * Format time only for display in PDFs
   * @param {string|Date} dateValue - Date to format
   * @returns {string} Formatted time string
   */
  formatTime: (dateValue) => {
    if (!dateValue) return "N/A";
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return "N/A";
    }
  },

  /**
   * Format currency for display in PDFs
   * @param {number} amount - Amount in cents
   * @returns {string} Formatted currency string
   */
  formatCurrency: (amount) => {
    if (typeof amount !== "number") return "LKR 0.00";
    return `LKR ${(amount / 100).toFixed(2)}`;
  },

  /**
   * Format currency for direct amounts (not in cents)
   * @param {number} amount - Amount in full currency units
   * @returns {string} Formatted currency string
   */
  formatDirectCurrency: (amount) => {
    if (typeof amount !== "number") return "LKR 0.00";
    return `LKR ${amount.toFixed(2)}`;
  },

  /**
   * Get current timestamp for file naming
   * @returns {string} Current date in YYYY-MM-DD format
   */
  getCurrentTimestamp: () => {
    return new Date().toISOString().split("T")[0];
  },

  /**
   * Get current date and time for report headers
   * @returns {string} Formatted current date and time
   */
  getCurrentDateTime: () => {
    return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  },
};

/**
 * PDF Status utilities for styling payment/appointment statuses
 */
export const PDFStatusUtils = {
  /**
   * Get background color for status badges
   * @param {string} status - Status value
   * @returns {string} Background color hex code
   */
  getStatusBackgroundColor: (status) => {
    switch (status?.toLowerCase()) {
      case "succeeded":
        return "#d1fae5"; // Green-100
      case "pending":
        return "#fef3c7"; // Yellow-100
      case "failed":
        return "#fee2e2"; // Red-100
      default:
        return "#f3f4f6"; // Gray-100
    }
  },

  /**
   * Get text color for status badges
   * @param {string} status - Status value
   * @returns {string} Text color hex code
   */
  getStatusTextColor: (status) => {
    switch (status?.toLowerCase()) {
      case "succeeded":
        return "#065f46"; // Green-800
      case "pending":
        return "#92400e"; // Yellow-800
      case "failed":
        return "#991b1b"; // Red-800
      default:
        return "#374151"; // Gray-700
    }
  },
};
