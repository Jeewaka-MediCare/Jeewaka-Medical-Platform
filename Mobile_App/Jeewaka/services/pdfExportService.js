// PDF Export Service for React Native (Expo Compatible)
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { Alert } from "react-native";

class PDFExportService {
  constructor() {
    // Jeewaka Medical Platform branding colors (same as frontend)
    this.brandColor = "#0d9488"; // Teal-600 - Primary brand color
    this.lightBrandColor = "#e6fffa"; // Teal-50 - Light brand background
    this.accentColor = "#06b6d4"; // Cyan-500 - Accent color
    this.darkTextColor = "#0f172a"; // Slate-900 - Main text
    this.mutedTextColor = "#64748b"; // Slate-500 - Muted text
    this.borderColor = "#e6e9ee"; // Custom border color from theme
    this.successColor = "#10b981"; // Emerald-500 - Success states
    this.warningColor = "#f59e0b"; // Amber-500 - Warning states
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
      console.log("🚀 Starting PDF export for React Native (Expo)...");

      if (!payments || payments.length === 0) {
        throw new Error("No payment data available to export");
      }

      // Generate HTML content for PDF
      const htmlContent = this._generatePaymentHistoryHTML(
        payments,
        stats,
        user,
        filters
      );

      // Generate filename
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `jeewaka-payments-${timestamp}.pdf`;

      // Create PDF using Expo Print
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      console.log("✅ PDF generated successfully:", uri);

      // Check if sharing is available
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Export Payment History",
          UTI: "com.adobe.pdf",
        });

        return {
          success: true,
          filePath: uri,
          filename: filename,
          message: "PDF exported successfully",
        };
      } else {
        Alert.alert(
          "Export Complete",
          `PDF generated successfully.\nFile saved to: ${uri}`,
          [{ text: "OK" }]
        );

        return {
          success: true,
          filePath: uri,
          filename: filename,
          message: "PDF generated successfully",
        };
      }
    } catch (error) {
      console.error("❌ PDF Export Error:", error);
      return {
        success: false,
        error: error.message,
        message: "Failed to export PDF",
      };
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
      console.log(
        "🚀 Starting Doctor Earnings PDF export for React Native (Expo)..."
      );

      if (!earnings || earnings.length === 0) {
        throw new Error("No earnings data available to export");
      }

      // Generate HTML content for earnings report
      const htmlContent = this._generateDoctorEarningsHTML(
        earnings,
        stats,
        user,
        filters
      );

      // Generate filename
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `jeewaka-doctor-earnings-${timestamp}.pdf`;

      // Create PDF using Expo Print
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      console.log("✅ Doctor Earnings PDF generated successfully:", uri);

      // Check if sharing is available
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Export Doctor Earnings",
          UTI: "com.adobe.pdf",
        });

        return {
          success: true,
          filePath: uri,
          filename: filename,
          message: "Doctor earnings exported successfully",
        };
      } else {
        Alert.alert(
          "Export Complete",
          `Doctor earnings PDF generated successfully.\nFile saved to: ${uri}`,
          [{ text: "OK" }]
        );

        return {
          success: true,
          filePath: uri,
          filename: filename,
          message: "Doctor earnings PDF generated successfully",
        };
      }
    } catch (error) {
      console.error("❌ Doctor Earnings PDF Export Error:", error);
      return {
        success: false,
        error: error.message,
        message: "Failed to export doctor earnings PDF",
      };
    }
  }

  /**
   * Export single payment receipt to PDF
   * @param {Object} payment - Payment object
   * @param {Object} user - User information
   */
  async exportPaymentDetailsPDF(payment, user) {
    try {
      console.log("🚀 Starting single payment PDF export...");

      if (!payment) {
        throw new Error("No payment data available to export");
      }

      // Generate HTML content for single payment receipt
      const htmlContent = this._generatePaymentReceiptHTML(payment, user);

      // Generate filename
      const filename = `jeewaka-payment-${
        payment.id?.slice(-8) || "receipt"
      }.pdf`;

      // Create PDF using Expo Print
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      console.log("✅ Receipt PDF generated successfully:", uri);

      // Check if sharing is available
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Export Payment Receipt",
          UTI: "com.adobe.pdf",
        });

        return {
          success: true,
          filePath: uri,
          filename: filename,
          message: "Payment receipt exported successfully",
        };
      } else {
        Alert.alert(
          "Export Complete",
          `Receipt generated successfully.\nFile saved to: ${uri}`,
          [{ text: "OK" }]
        );

        return {
          success: true,
          filePath: uri,
          filename: filename,
          message: "Receipt generated successfully",
        };
      }
    } catch (error) {
      console.error("❌ Receipt PDF Export Error:", error);
      return {
        success: false,
        error: error.message,
        message: "Failed to export payment receipt",
      };
    }
  }

  /**
   * Generate HTML content for payment history report
   */
  _generatePaymentHistoryHTML(payments, stats, user, filters) {
    const formatDate = (dateValue) => {
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
    };

    const formatCurrency = (amount) => {
      return `LKR ${(amount / 100).toFixed(2)}`;
    };

    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const paymentsTableRows = payments
      .map(
        (payment) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid ${
          this.borderColor
        };">${
          payment.doctorName || payment.doctor?.name || "Unknown Doctor"
        }</td>
        <td style="padding: 8px; border-bottom: 1px solid ${
          this.borderColor
        };">${
          payment.doctorSpecialization ||
          payment.doctor?.specialization ||
          "General"
        }</td>
        <td style="padding: 8px; border-bottom: 1px solid ${
          this.borderColor
        };">${formatCurrency(payment.amount)}</td>
        <td style="padding: 8px; border-bottom: 1px solid ${this.borderColor};">
          <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; background: ${this._getStatusBackgroundColor(
            payment.status
          )}; color: ${this._getStatusTextColor(payment.status)};">
            ${
              (payment.status || "Unknown").charAt(0).toUpperCase() +
              (payment.status || "Unknown").slice(1)
            }
          </span>
        </td>
        <td style="padding: 8px; border-bottom: 1px solid ${
          this.borderColor
        };">${formatDate(payment.date || payment.created)}</td>
        <td style="padding: 8px; border-bottom: 1px solid ${
          this.borderColor
        }; font-size: 12px;">${payment.id || payment.paymentId || "N/A"}</td>
      </tr>
    `
      )
      .join("");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Payment History Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: ${this.darkTextColor};
          }
          .header {
            background: ${this.brandColor};
            color: white;
            padding: 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 20px;
          }
          .info-section {
            margin-bottom: 30px;
          }
          .info-section h2 {
            color: ${this.darkTextColor};
            border-bottom: 2px solid ${this.accentColor};
            padding-bottom: 5px;
          }
          .stats-grid {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .stat-card {
            text-align: center;
            padding: 15px;
            background: ${this.lightBrandColor};
            border-radius: 8px;
            min-width: 120px;
          }
          .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: ${this.brandColor};
          }
          .stat-label {
            font-size: 12px;
            color: ${this.mutedTextColor};
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th {
            background: ${this.brandColor};
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
          }
          td {
            padding: 8px;
            border-bottom: 1px solid ${this.borderColor};
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: ${this.mutedTextColor};
            font-size: 12px;
            border-top: 1px solid ${this.borderColor};
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Jeewaka Medical Platform</h1>
          <p style="margin: 5px 0 0 0;">Payment History Report</p>
        </div>
        
        <div class="content">
          <div class="info-section">
            <p><strong>Generated for:</strong> ${
              user?.name || user?.email || "Patient"
            }</p>
            <p><strong>Generated on:</strong> ${currentDate}</p>
            ${
              filters.searchTerm || filters.statusFilter !== "all"
                ? `
              <p><strong>Applied Filters:</strong></p>
              <ul>
                ${
                  filters.searchTerm
                    ? `<li>Search: "${filters.searchTerm}"</li>`
                    : ""
                }
                ${
                  filters.statusFilter !== "all"
                    ? `<li>Status: ${
                        filters.statusFilter.charAt(0).toUpperCase() +
                        filters.statusFilter.slice(1)
                      }</li>`
                    : ""
                }
              </ul>
            `
                : ""
            }
          </div>

          <div class="info-section">
            <h2>Payment Summary</h2>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-number">${stats.total || 0}</div>
                <div class="stat-label">Total Payments</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${stats.successful || 0}</div>
                <div class="stat-label">Successful</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${stats.pending || 0}</div>
                <div class="stat-label">Pending</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${stats.failed || 0}</div>
                <div class="stat-label">Failed</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">LKR ${(stats.totalAmount || 0).toFixed(
                  2
                )}</div>
                <div class="stat-label">Total Amount</div>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h2>Payment Details</h2>
            <table>
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Specialization</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Payment ID</th>
                </tr>
              </thead>
              <tbody>
                ${paymentsTableRows}
              </tbody>
            </table>
          </div>
        </div>

        <div class="footer">
          <p>This document was generated by Jeewaka Medical Platform</p>
          <p>© ${new Date().getFullYear()} Jeewaka Medical Platform. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML content for single payment receipt
   */
  _generatePaymentReceiptHTML(payment, user) {
    const formatDate = (dateValue) => {
      if (!dateValue) return "N/A";
      try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return "N/A";
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      } catch (error) {
        return "N/A";
      }
    };

    const formatDateTime = (dateValue) => {
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
    };

    const formatTime = (dateValue) => {
      if (!dateValue) return "N/A";
      try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return "N/A";
        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch (error) {
        return "N/A";
      }
    };

    const formatCurrency = (amount) => {
      return `LKR ${(amount / 100).toFixed(2)}`;
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Payment Receipt</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: ${this.darkTextColor};
          }
          .receipt-container {
            max-width: 600px;
            margin: 0 auto;
            border: 2px solid ${this.brandColor};
            border-radius: 8px;
            overflow: hidden;
          }
          .header {
            background: ${this.brandColor};
            color: white;
            padding: 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0 0 5px 0;
            font-size: 20px;
            font-weight: bold;
          }
          .header p {
            margin: 0;
            font-size: 14px;
            opacity: 0.9;
          }
          .content {
            padding: 30px;
          }
          .receipt-title {
            text-align: center;
            font-size: 24px;
            margin-bottom: 30px;
            color: ${this.brandColor};
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid ${this.borderColor};
          }
          .detail-label {
            font-weight: bold;
            color: ${this.mutedTextColor};
          }
          .detail-value {
            color: ${this.darkTextColor};
          }
          .section-header {
            font-size: 16px;
            font-weight: bold;
            color: ${this.brandColor};
            margin: 16px 0 12px 0;
            padding-bottom: 6px;
            border-bottom: 2px solid ${this.brandColor};
          }
          .amount-section {
            background: ${this.lightBrandColor};
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
          }
          .amount-value {
            font-size: 28px;
            font-weight: bold;
            color: ${this.brandColor};
          }
          .status-badge {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: ${this.mutedTextColor};
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <h1>Jeewaka Medical Platform</h1>
            <p>Payment Receipt</p>
          </div>
          
          <div class="content">
            <!-- Payment Status Section -->
            <div class="section-header">Payment Information</div>
            
            <div class="detail-row">
              <span class="detail-label">Patient:</span>
              <span class="detail-value">${
                user?.name || user?.email || "N/A"
              }</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Payment ID:</span>
              <span class="detail-value">${
                payment.id || payment.paymentId || "N/A"
              }</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Payment Date:</span>
              <span class="detail-value">${formatDate(
                payment.date || payment.created
              )}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Payment Time:</span>
              <span class="detail-value">${formatTime(
                payment.date || payment.created
              )}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Currency:</span>
              <span class="detail-value">${(
                payment.currency || "LKR"
              ).toUpperCase()}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value">
                <span class="status-badge" style="background: ${this._getStatusBackgroundColor(
                  payment.status
                )}; color: ${this._getStatusTextColor(payment.status)};">
                  ${
                    payment.status === "succeeded"
                      ? "Payment Successful"
                      : payment.status === "pending"
                      ? "Payment Pending"
                      : payment.status === "failed"
                      ? "Payment Failed"
                      : "Unknown Status"
                  }
                </span>
              </span>
            </div>

            <!-- Doctor Information Section -->
            <div class="section-header">Doctor Information</div>
            
            <div class="detail-row">
              <span class="detail-label">Doctor:</span>
              <span class="detail-value">${
                payment.doctorName || payment.doctor?.name || "Unknown Doctor"
              }</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Specialization:</span>
              <span class="detail-value">${
                payment.doctorSpecialization ||
                payment.doctor?.specialization ||
                "General"
              }</span>
            </div>

            ${
              payment.appointmentDate || payment.appointmentTime
                ? `
            <!-- Appointment Information Section -->
            <div class="section-header">Appointment Information</div>
            
            ${
              payment.appointmentDate
                ? `
            <div class="detail-row">
              <span class="detail-label">Appointment Date:</span>
              <span class="detail-value">${formatDate(
                payment.appointmentDate
              )}</span>
            </div>
            `
                : ""
            }
            
            ${
              payment.appointmentTime
                ? `
            <div class="detail-row">
              <span class="detail-label">Appointment Time:</span>
              <span class="detail-value">${payment.appointmentTime}</span>
            </div>
            `
                : ""
            }
            
            ${
              payment.appointmentStatus
                ? `
            <div class="detail-row">
              <span class="detail-label">Appointment Status:</span>
              <span class="detail-value" style="color: ${
                payment.appointmentStatus === "confirmed"
                  ? "#10B981"
                  : "#6B7280"
              }; font-weight: 500;">
                ${
                  payment.appointmentStatus?.charAt(0).toUpperCase() +
                    payment.appointmentStatus?.slice(1) || "N/A"
                }
              </span>
            </div>
            `
                : ""
            }
            `
                : ""
            }

            ${
              payment.sessionType
                ? `
            <!-- Session Information -->
            <div class="section-header">Session Information</div>
            
            <div class="detail-row">
              <span class="detail-label">Session Type:</span>
              <span class="detail-value">${payment.sessionType}</span>
            </div>
            
            ${
              payment.sessionDuration
                ? `
            <div class="detail-row">
              <span class="detail-label">Duration:</span>
              <span class="detail-value">${payment.sessionDuration} minutes</span>
            </div>
            `
                : ""
            }
            `
                : ""
            }
            
            <div class="amount-section">
              <div>Total Amount Paid</div>
              <div class="amount-value">${formatCurrency(payment.amount)}</div>
            </div>
            
            <div class="footer">
              <p>Thank you for using Jeewaka Medical Platform</p>
              <p>This is a computer-generated receipt.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML content for doctor earnings report
   */
  _generateDoctorEarningsHTML(earnings, stats, user, filters) {
    const formatDate = (dateValue) => {
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
    };

    const formatTime = (dateValue) => {
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
    };

    const formatCurrency = (amount) => {
      return `LKR ${amount.toFixed(2)}`;
    };

    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const earningsTableRows = earnings
      .map(
        (earning) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid ${
          this.borderColor
        };">${earning.patientName || "Unknown Patient"}</td>
        <td style="padding: 8px; border-bottom: 1px solid ${
          this.borderColor
        };">${earning.paymentId || "N/A"}</td>
        <td style="padding: 8px; border-bottom: 1px solid ${
          this.borderColor
        };">${formatCurrency(earning.amount)}</td>
        <td style="padding: 8px; border-bottom: 1px solid ${
          this.borderColor
        };">${formatDate(earning.appointmentDate)}</td>
        <td style="padding: 8px; border-bottom: 1px solid ${
          this.borderColor
        };">${earning.appointmentTime || "N/A"}</td>
        <td style="padding: 8px; border-bottom: 1px solid ${
          this.borderColor
        };">${formatDate(earning.paidDate)} ${formatTime(earning.paidDate)}</td>
      </tr>
      `
      )
      .join("");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Doctor Earnings Report - Jeewaka Medical Platform</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            color: ${this.darkTextColor};
            line-height: 1.4;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 0;
          }
          .header {
            background: linear-gradient(135deg, ${this.brandColor}, ${
      this.accentColor
    });
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .header p {
            margin: 5px 0 0 0;
            opacity: 0.9;
          }
          .content {
            padding: 20px;
          }
          .info-section {
            margin-bottom: 30px;
          }
          .info-section h2 {
            color: ${this.darkTextColor};
            border-bottom: 2px solid ${this.accentColor};
            padding-bottom: 5px;
            margin-bottom: 15px;
          }
          .stats-grid {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            gap: 15px;
          }
          .stat-card {
            text-align: center;
            padding: 20px 15px;
            background: ${this.lightBrandColor};
            border-radius: 8px;
            flex: 1;
            border: 1px solid ${this.borderColor};
          }
          .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: ${this.brandColor};
            margin-bottom: 5px;
          }
          .stat-label {
            font-size: 12px;
            color: ${this.mutedTextColor};
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .doctor-info {
            background: ${this.lightBrandColor};
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .doctor-info h3 {
            margin: 0 0 10px 0;
            color: ${this.brandColor};
          }
          .filter-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid ${this.accentColor};
          }
          .filter-info h3 {
            margin: 0 0 10px 0;
            color: ${this.darkTextColor};
            font-size: 16px;
          }
          .filter-item {
            margin: 5px 0;
            color: ${this.mutedTextColor};
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            border: 1px solid ${this.borderColor};
          }
          th {
            background: ${this.brandColor};
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
            font-size: 14px;
          }
          td {
            padding: 8px;
            border-bottom: 1px solid ${this.borderColor};
            font-size: 13px;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: ${this.mutedTextColor};
            font-size: 12px;
            border-top: 1px solid ${this.borderColor};
            margin-top: 30px;
          }
          .footer p {
            margin: 5px 0;
          }
          .total-highlight {
            background: linear-gradient(135deg, ${this.brandColor}, ${
      this.accentColor
    });
            color: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
          }
          .total-highlight .amount {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .total-highlight .label {
            font-size: 14px;
            opacity: 0.9;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Doctor Earnings Report</h1>
            <p>Jeewaka Medical Platform</p>
            <p>Generated on ${currentDate}</p>
          </div>

          <div class="content">
            <!-- Doctor Information -->
            <div class="doctor-info">
              <h3>Dr. ${user?.displayName || user?.name || "Doctor"}</h3>
              <p><strong>Email:</strong> ${user?.email || "N/A"}</p>
              <p><strong>Report Period:</strong> ${
                stats?.period || "All Time"
              }</p>
            </div>

            <!-- Applied Filters -->
            ${
              filters?.searchTerm || filters?.dateRange
                ? `
            <div class="filter-info">
              <h3>Applied Filters</h3>
              ${
                filters?.searchTerm
                  ? `<div class="filter-item">• Search: "${filters.searchTerm}"</div>`
                  : ""
              }
              ${
                filters?.dateRange
                  ? `<div class="filter-item">• Date Range: ${filters.dateRange}</div>`
                  : ""
              }
            </div>
            `
                : ""
            }

            <!-- Summary Statistics -->
            <div class="info-section">
              <h2>Earnings Summary</h2>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-number">${
                    stats?.totalPayments || earnings.length
                  }</div>
                  <div class="stat-label">Total Payments</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${earnings.length}</div>
                  <div class="stat-label">Completed appointments</div>
                </div>
              </div>
              
              <div class="total-highlight">
                <div class="amount">${formatCurrency(
                  stats?.totalAmount || 0
                )}</div>
                <div class="label">Total Earnings for Selected Period</div>
              </div>
            </div>

            <!-- Earnings Details -->
            <div class="info-section">
              <h2>Earnings Details</h2>
              <table>
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>Payment ID</th>
                    <th>Amount Earned</th>
                    <th>Appointment Date</th>
                    <th>Appointment Time</th>
                    <th>Payment Received</th>
                  </tr>
                </thead>
                <tbody>
                  ${earningsTableRows}
                </tbody>
              </table>
            </div>
          </div>

          <div class="footer">
            <p>This earnings report was generated by Jeewaka Medical Platform</p>
            <p>© ${new Date().getFullYear()} Jeewaka Medical Platform. All rights reserved.</p>
            <p>For support, contact: support@jeewaka.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  _getStatusBackgroundColor(status) {
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
  }

  _getStatusTextColor(status) {
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
  }
}

export default new PDFExportService();
