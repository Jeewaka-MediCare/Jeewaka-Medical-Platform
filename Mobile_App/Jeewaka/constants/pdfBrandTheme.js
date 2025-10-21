// Brand and theme constants for PDF exports
export const PDF_BRAND_THEME = {
  // Jeewaka Medical Platform branding colors (same as frontend)
  brandColor: "#0d9488", // Teal-600 - Primary brand color
  lightBrandColor: "#e6fffa", // Teal-50 - Light brand background
  accentColor: "#06b6d4", // Cyan-500 - Accent color
  darkTextColor: "#0f172a", // Slate-900 - Main text
  mutedTextColor: "#64748b", // Slate-500 - Muted text
  borderColor: "#e6e9ee", // Custom border color from theme
  successColor: "#10b981", // Emerald-500 - Success states
  warningColor: "#f59e0b", // Amber-500 - Warning states
};

// PDF Export Options
export const PDF_EXPORT_OPTIONS = {
  fileNames: {
    paymentHistory: (date) => {
      const timestamp = date.toISOString().split("T")[0];
      return `jeewaka-payments-${timestamp}.pdf`;
    },
    doctorEarnings: (date) => {
      const timestamp = date.toISOString().split("T")[0];
      return `jeewaka-doctor-earnings-${timestamp}.pdf`;
    },
    paymentReceipt: (payment) => {
      const paymentId = payment.id || payment.paymentId || "receipt";
      return `jeewaka-payment-${paymentId.toString().slice(-8)}.pdf`;
    },
  },
  shareOptions: {
    paymentHistory: {
      dialogTitle: "Export Payment History",
      successMessage: "Payment history exported successfully",
      alertMessage: "Payment history PDF generated successfully",
    },
    doctorEarnings: {
      dialogTitle: "Export Doctor Earnings",
      successMessage: "Doctor earnings exported successfully",
      alertMessage: "Doctor earnings PDF generated successfully",
    },
    paymentReceipt: {
      dialogTitle: "Export Payment Receipt",
      successMessage: "Payment receipt exported successfully",
      alertMessage: "Payment receipt generated successfully",
    },
  },
};
