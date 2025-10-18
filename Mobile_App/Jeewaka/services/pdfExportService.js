// PDF Export Service for React Native (Expo Compatible)
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";

// Import modular components
import {
  PDF_BRAND_THEME,
  PDF_EXPORT_OPTIONS,
} from "../constants/pdfBrandTheme";
import { PaymentHistoryTemplate } from "../templates/PaymentHistoryTemplate";
import { DoctorEarningsTemplate } from "../templates/DoctorEarningsTemplate";
import { PaymentReceiptTemplate } from "../templates/PaymentReceiptTemplate";

class PDFExportService {
  constructor() {
    // Use centralized brand theme
    this.brandTheme = PDF_BRAND_THEME;
    this.exportOptions = PDF_EXPORT_OPTIONS;
  }

  /**
   * Export payments to PDF (React Native Expo version)
   * @param {Array} payments - Array of payment objects
   * @param {Object} stats - Payment statistics
   * @param {Object} user - User information
   * @param {Object} filters - Applied filters (search, status)
   */
  async exportPaymentsPDF(payments, stats, user, filters = {}) {
    try {
      if (!payments || payments.length === 0) {
        throw new Error("No payment data available to export");
      }

      // Generate HTML content using template
      const htmlContent = PaymentHistoryTemplate.generate(
        payments,
        stats,
        user,
        filters
      );

      // Generate filename using centralized naming
      const filename = this.exportOptions.fileNames.paymentHistory(new Date());

      // Create and share PDF
      return await this._createAndSharePDF(
        htmlContent,
        filename,
        this.exportOptions.shareOptions.paymentHistory
      );
    } catch (error) {
      console.error("❌ PDF Export Error:", error);
      return this._createErrorResponse(error, "Failed to export PDF");
    }
  }

  /**
   * Export doctor earnings to PDF (Doctor perspective)
   * @param {Array} earnings - Array of earning objects
   * @param {Object} stats - Earnings statistics
   * @param {Object} user - Doctor information
   * @param {Object} filters - Applied filters (search, dateRange)
   */
  async exportDoctorEarningsPDF(earnings, stats, user, filters = {}) {
    try {
      if (!earnings || earnings.length === 0) {
        throw new Error("No earnings data available to export");
      }

      // Generate HTML content using template
      const htmlContent = DoctorEarningsTemplate.generate(
        earnings,
        stats,
        user,
        filters
      );

      // Generate filename using centralized naming
      const filename = this.exportOptions.fileNames.doctorEarnings(new Date());

      // Create and share PDF
      return await this._createAndSharePDF(
        htmlContent,
        filename,
        this.exportOptions.shareOptions.doctorEarnings
      );
    } catch (error) {
      console.error("❌ Doctor Earnings PDF Export Error:", error);
      return this._createErrorResponse(
        error,
        "Failed to export doctor earnings PDF"
      );
    }
  }

  /**
   * Export single payment receipt to PDF
   * @param {Object} payment - Payment object
   * @param {Object} user - User information
   * @param {Object} doctor - Doctor information (optional)
   * @param {Object} session - Session information (optional)
   */
  async exportPaymentDetailsPDF(payment, user, doctor = null, session = null) {
    try {
      if (!payment) {
        throw new Error("No payment data available to export");
      }

      // Generate HTML content using template
      const htmlContent = PaymentReceiptTemplate.generate(
        payment,
        user,
        doctor,
        session
      );

      // Generate filename using centralized naming
      const filename = this.exportOptions.fileNames.paymentReceipt(payment);

      // Create and share PDF
      return await this._createAndSharePDF(
        htmlContent,
        filename,
        this.exportOptions.shareOptions.paymentReceipt
      );
    } catch (error) {
      console.error("❌ Payment Receipt PDF Export Error:", error);
      return this._createErrorResponse(
        error,
        "Failed to export payment receipt"
      );
    }
  }

  /**
   * Create and share PDF using Expo Print and Sharing
   * @param {string} htmlContent - HTML content for PDF
   * @param {string} filename - PDF filename
   * @param {Object} shareOptions - Sharing options
   * @returns {Object} Result object
   */
  async _createAndSharePDF(htmlContent, filename, shareOptions) {
    try {
      // Create PDF using Expo Print
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      // Check if sharing is available
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: shareOptions.dialogTitle,
          UTI: "com.adobe.pdf",
        });

        return {
          success: true,
          filePath: uri,
          filename: filename,
          message: shareOptions.successMessage,
        };
      } else {
        Alert.alert(
          "Export Complete",
          `${shareOptions.alertMessage}\nFile saved to: ${uri}`,
          [{ text: "OK" }]
        );

        return {
          success: true,
          filePath: uri,
          filename: filename,
          message: shareOptions.alertMessage,
        };
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create standardized error response
   * @param {Error} error - Error object
   * @param {string} message - Error message
   * @returns {Object} Error response object
   */
  _createErrorResponse(error, message) {
    return {
      success: false,
      error: error.message,
      message: message,
    };
  }
}

// Export the service instance
export default new PDFExportService();
