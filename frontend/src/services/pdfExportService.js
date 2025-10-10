// PDF Export Service for Payments
import jsPDF from 'jspdf';

// Dynamic import for autoTable to ensure it loads properly
let autoTableLoaded = false;

const loadAutoTable = async () => {
  if (!autoTableLoaded) {
    console.log('📄 Loading jsPDF autoTable plugin...');
    try {
      const autoTableModule = await import('jspdf-autotable');
      console.log('📦 autoTable import successful:', autoTableModule);
      
      // Store the autoTable function for manual application
      window.jsPDFAutoTable = autoTableModule.default || autoTableModule.autoTable;
      console.log('� autoTable function stored:', typeof window.jsPDFAutoTable);
      
      autoTableLoaded = true;
      console.log('✅ jsPDF autoTable plugin loaded successfully');
      return window.jsPDFAutoTable;
    } catch (error) {
      console.error('❌ Failed to load jsPDF autoTable plugin:', error);
      throw error;
    }
  } else {
    console.log('📄 jsPDF autoTable plugin already loaded');
    return window.jsPDFAutoTable;
  }
};

class PDFExportService {
  constructor() {
    // Jeewaka Medical Platform branding
    this.brandColor = '#0d9488'; // Teal-600 - Primary brand color
    this.lightBrandColor = '#e6fffa'; // Teal-50 - Light brand background
    this.accentColor = '#06b6d4'; // Cyan-500 - Accent color
    this.darkTextColor = '#0f172a'; // Slate-900 - Main text
    this.mutedTextColor = '#64748b'; // Slate-500 - Muted text
    this.borderColor = '#e6e9ee'; // Custom border color from theme
    this.successColor = '#10b981'; // Emerald-500 - Success states
    this.warningColor = '#f59e0b'; // Amber-500 - Warning states
  }

  /**
   * Export payments to PDF
   * @param {Array} payments - Array of payment objects
   * @param {Object} stats - Payment statistics
   * @param {Object} user - User information
   * @param {Object} filters - Applied filters (search, status)
   */
  async exportPaymentsPDF(payments, stats, user, filters = {}) {
    try {
      console.log('🚀 Starting PDF export...');
      
      // Load autoTable plugin and get the function
      const autoTableFunction = await loadAutoTable();
      
      const doc = new jsPDF();
      console.log('📄 jsPDF instance created');
      
      // Manually attach autoTable to this instance
      if (autoTableFunction && typeof autoTableFunction === 'function') {
        doc.autoTable = autoTableFunction.bind(null, doc);
        console.log('� autoTable manually attached to doc instance');
        console.log('🔍 Checking autoTable availability:', typeof doc.autoTable);
      } else {
        throw new Error('autoTable function not available');
      }
      
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Helper functions
      const formatDate = (dateValue) => {
        if (!dateValue) return 'N/A';
        try {
          const date = new Date(dateValue);
          if (isNaN(date.getTime())) return 'N/A';
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        } catch (error) {
          return 'N/A';
        }
      };

      const formatCurrency = (amount) => {
        return `LKR ${(amount / 100).toFixed(2)}`;
      };

      // Header
      this._addHeader(doc, pageWidth);

      // Title and user info
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text('Payment History Report', 20, 50);

      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated for: ${user?.name || user?.email || 'Patient'}`, 20, 60);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, 20, 68);

      // Add filters info if any
      let yPosition = 78;
      if (filters.searchTerm || filters.statusFilter !== 'all') {
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text('Applied Filters:', 20, yPosition);
        yPosition += 8;
        
        if (filters.searchTerm) {
          doc.text(`• Search: "${filters.searchTerm}"`, 25, yPosition);
          yPosition += 6;
        }
        if (filters.statusFilter !== 'all') {
          doc.text(`• Status: ${filters.statusFilter.charAt(0).toUpperCase() + filters.statusFilter.slice(1)}`, 25, yPosition);
          yPosition += 6;
        }
        yPosition += 5;
      }

      // Statistics Summary
      yPosition = this._addStatistics(doc, stats, yPosition);

      // Payments Table
      if (payments && payments.length > 0) {
        yPosition += 10;
        this._addPaymentsTable(doc, payments, yPosition, formatDate, formatCurrency);
      } else {
        doc.setFontSize(12);
        doc.setTextColor(150, 150, 150);
        doc.text('No payments found matching the criteria.', 20, yPosition + 20);
      }

      // Footer
      this._addFooter(doc, pageHeight);

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `jeewaka-payments-${timestamp}.pdf`;

      // Save the PDF
      doc.save(filename);

      return {
        success: true,
        filename,
        message: 'PDF exported successfully'
      };

    } catch (error) {
      console.error('PDF Export Error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to export PDF'
      };
    }
  }

  _addHeader(doc, pageWidth) {
    // Header background with Jeewaka brand colors
    doc.setFillColor(13, 148, 136); // Teal-600 (#0d9488)
    doc.rect(0, 0, pageWidth, 25, 'F');

    // Jeewaka Medical Platform name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Jeewaka Medical Platform', 20, 16);

    // Accent line under header
    doc.setDrawColor(6, 182, 212); // Cyan-500 (#06b6d4)
    doc.setLineWidth(2);
    doc.line(0, 25, pageWidth, 25);

    // Reset styles
    doc.setFont(undefined, 'normal');
  }

  _addStatistics(doc, stats, yPosition) {
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // Slate-900 - main text color
    doc.setFont(undefined, 'bold');
    doc.text('Payment Summary', 20, yPosition);
    doc.setFont(undefined, 'normal');
    
    yPosition += 15;

    // Statistics in a table format with Jeewaka theme
    const statsData = [
      ['Total Payments', stats.total.toString()],
      ['Successful Payments', stats.successful.toString()],
      ['Pending Payments', stats.pending.toString()],
      ['Failed Payments', stats.failed.toString()],
      ['Total Amount', `LKR ${stats.totalAmount.toFixed(2)}`]
    ];

    doc.autoTable({
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: statsData,
      theme: 'grid',
      headStyles: {
        fillColor: [13, 148, 136], // Teal-600
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fillColor: [246, 252, 252], // Teal-50
        fontSize: 9,
        textColor: [15, 23, 42] // Slate-900
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255] // White
      },
      columnStyles: {
        0: { cellWidth: 60, fontStyle: 'bold' },
        1: { cellWidth: 40, halign: 'right' }
      },
      margin: { left: 20, right: 20 }
    });

    return doc.lastAutoTable.finalY;
  }

  _addPaymentsTable(doc, payments, yPosition, formatDate, formatCurrency) {
    // Prepare table data
    const tableData = payments.map(payment => [
      payment.id ? payment.id.slice(-8) + '...' : 'N/A',
      payment.doctorName || payment.doctor?.name || 'Unknown',
      formatCurrency(payment.amount),
      payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1) || 'Unknown',
      formatDate(payment.date || payment.created),
      payment.appointment?.date ? formatDate(payment.appointment.date) : 'N/A'
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [['Payment ID', 'Doctor', 'Amount', 'Status', 'Payment Date', 'Appointment Date']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [13, 148, 136], // Teal-600
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [15, 23, 42], // Slate-900
        fillColor: [255, 255, 255] // White
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Slate-50
      },
      columnStyles: {
        0: { cellWidth: 25, fontSize: 7 },
        1: { cellWidth: 35 },
        2: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 30 },
        5: { cellWidth: 30 }
      },
      margin: { left: 20, right: 20 },
      styles: {
        overflow: 'linebreak',
        cellPadding: 3
      },
      // Add status color coding with Jeewaka theme colors
      didParseCell: function(data) {
        if (data.column.index === 3 && data.cell.section === 'body') {
          const status = data.cell.text[0].toLowerCase();
          switch (status) {
            case 'succeeded':
              data.cell.styles.textColor = [16, 185, 129]; // Emerald-500
              data.cell.styles.fontStyle = 'bold';
              break;
            case 'pending':
              data.cell.styles.textColor = [245, 158, 11]; // Amber-500
              data.cell.styles.fontStyle = 'bold';
              break;
            case 'failed':
              data.cell.styles.textColor = [239, 68, 68]; // Red-500
              data.cell.styles.fontStyle = 'bold';
              break;
            default:
              data.cell.styles.textColor = [100, 116, 139]; // Slate-500
              break;
          }
        }
      }
    });
  }

  _addFooter(doc, pageHeight) {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Footer line with brand accent color
    doc.setDrawColor(6, 182, 212); // Cyan-500
    doc.setLineWidth(1);
    doc.line(20, pageHeight - 30, doc.internal.pageSize.width - 20, pageHeight - 30);

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // Slate-500 - muted text
    doc.text('Jeewaka Medical Platform - Confidential Patient Information', 20, pageHeight - 20);
    doc.text(`Report generated on ${currentDate}`, 20, pageHeight - 12);
    
    // Page number with brand color
    const pageCount = doc.internal.getNumberOfPages();
    doc.setTextColor(13, 148, 136); // Teal-600
    doc.text(`Page 1 of ${pageCount}`, doc.internal.pageSize.width - 40, pageHeight - 12);
  }

  /**
   * Export a single payment details to PDF
   * @param {Object} payment - Payment object
   * @param {Object} user - User information
   */
  async exportPaymentDetailsPDF(payment, user) {
    try {
      console.log('💳 Starting payment details PDF export...');
      
      // Load autoTable plugin and get the function
      const autoTableFunction = await loadAutoTable();
      
      const doc = new jsPDF();
      console.log('📄 Payment details jsPDF instance created');
      
      // Manually attach autoTable to this instance
      if (autoTableFunction && typeof autoTableFunction === 'function') {
        doc.autoTable = autoTableFunction.bind(null, doc);
        console.log('🔌 autoTable manually attached to payment details doc instance');
        console.log('� Checking autoTable availability:', typeof doc.autoTable);
      } else {
        throw new Error('autoTable function not available for payment details');
      }
      
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      // Header
      this._addHeader(doc, pageWidth);

      // Title with Jeewaka theme
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42); // Slate-900
      doc.setFont(undefined, 'bold');
      doc.text('Payment Receipt', 20, 50);
      doc.setFont(undefined, 'normal');

      // Payment details with enhanced styling
      let yPos = 70;
      const details = [
        ['Payment ID', payment.id || 'N/A'],
        ['Amount', `LKR ${(payment.amount / 100).toFixed(2)}`],
        ['Status', payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1) || 'Unknown'],
        ['Doctor', payment.doctor?.name || payment.doctorName || 'Unknown Doctor'],
        ['Specialization', payment.doctor?.specialization || payment.doctorSpecialization || 'N/A'],
        ['Payment Date', payment.date ? new Date(payment.date).toLocaleDateString() : 'N/A'],
        ['Appointment Date', payment.appointment?.date ? new Date(payment.appointment.date).toLocaleDateString() : 'N/A'],
        ['Appointment Time', payment.appointment?.time || 'N/A']
      ];

      doc.autoTable({
        startY: yPos,
        body: details,
        theme: 'plain',
        bodyStyles: {
          fontSize: 11,
          textColor: [15, 23, 42], // Slate-900
          fillColor: [255, 255, 255], // White background
          lineColor: [230, 233, 238], // Custom border color
          lineWidth: 0.5
        },
        columnStyles: {
          0: { 
            cellWidth: 50, 
            fontStyle: 'bold',
            fillColor: [246, 252, 252], // Teal-50
            textColor: [13, 148, 136] // Teal-600
          },
          1: { 
            cellWidth: 100,
            textColor: [15, 23, 42] // Slate-900
          }
        },
        styles: {
          cellPadding: 5
        }
      });

      // Footer
      this._addFooter(doc, pageHeight);

      // Save
      const filename = `jeewaka-payment-${payment.id?.slice(-8) || 'receipt'}.pdf`;
      doc.save(filename);

      return {
        success: true,
        filename,
        message: 'Payment receipt exported successfully'
      };

    } catch (error) {
      console.error('PDF Export Error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to export payment receipt'
      };
    }
  }
}

export default new PDFExportService();