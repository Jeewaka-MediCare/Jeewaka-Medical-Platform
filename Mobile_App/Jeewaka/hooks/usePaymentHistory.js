import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { isSameDay } from "date-fns";
import paymentService from "../services/paymentService";
import pdfExportService from "../services/pdfExportService";

export default function usePaymentHistory(user, userRole) {
  const [isMounted, setIsMounted] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [totalPayments, setTotalPayments] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [successfulPayments, setSuccessfulPayments] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Date filter states
  const [showDateFilterModal, setShowDateFilterModal] = useState(false);
  const [dateFilterType, setDateFilterType] = useState("single"); // 'single' or 'range'
  const [selectedDate, setSelectedDate] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showSingleDatePicker, setShowSingleDatePicker] = useState(false);

  // Component mount effect
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Load payment history on component mount
  useEffect(() => {
    if (isMounted && user && userRole === "patient") {
      loadPaymentHistory();
    }
  }, [isMounted, user, userRole]);

  // Reload payment history when date filters change
  useEffect(() => {
    if (isMounted && user && userRole === "patient") {
      loadPaymentHistory();
    }
  }, [isMounted, selectedDate, startDate, endDate, dateFilterType]);

  // Reload payment history when search text changes (real-time search)
  useEffect(() => {
    if (isMounted && user && userRole === "patient") {
      // Add a small delay to avoid too many API calls while typing
      const searchTimer = setTimeout(() => {
        loadPaymentHistory();
      }, 300);

      return () => clearTimeout(searchTimer);
    }
  }, [searchText]);

  // Load payment history with filters
  const loadPaymentHistory = async (filters = {}) => {
    try {
      setLoading(true);

      const queryFilters = {
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchText || undefined,
        limit: 50,
        offset: 0,
        ...filters,
      };

      console.log("Loading payment history with filters:", queryFilters);

      const response = await paymentService.getPaymentHistory(queryFilters);

      if (response.success) {
        console.log("Payment history loaded successfully:", response.payments);

        // Apply date filtering on client side
        let filteredPayments = response.payments || [];

        if (selectedDate && dateFilterType === "single") {
          console.log("Applying single date filter:", {
            selectedDate: selectedDate.toISOString(),
            totalPayments: filteredPayments.length,
          });

          filteredPayments = filteredPayments.filter((payment) => {
            const paymentDate = new Date(payment.date || payment.created);
            const isMatching = isSameDay(paymentDate, selectedDate);

            if (isMatching) {
              console.log("Payment matches single date:", {
                paymentId: payment.id,
                paymentDate: paymentDate.toISOString(),
              });
            }

            return isMatching;
          });

          console.log("Single date filter applied:", {
            filteredCount: filteredPayments.length,
            selectedDate: selectedDate.toDateString(),
          });
        } else if (startDate && endDate && dateFilterType === "range") {
          console.log("Applying date range filter:", {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            totalPayments: filteredPayments.length,
          });

          filteredPayments = filteredPayments.filter((payment) => {
            const paymentDate = new Date(payment.date || payment.created);

            // Create normalized dates for comparison
            const paymentDateOnly = new Date(
              paymentDate.getFullYear(),
              paymentDate.getMonth(),
              paymentDate.getDate()
            );
            const startDateOnly = new Date(
              startDate.getFullYear(),
              startDate.getMonth(),
              startDate.getDate()
            );
            const endDateOnly = new Date(
              endDate.getFullYear(),
              endDate.getMonth(),
              endDate.getDate()
            );

            // Check if payment date is within the inclusive range (includes both start and end dates)
            const isInRange =
              paymentDateOnly >= startDateOnly &&
              paymentDateOnly <= endDateOnly;

            if (isInRange) {
              console.log("Payment included in range:", {
                paymentId: payment.id,
                paymentDate: paymentDate.toDateString(),
                paymentDateOnly: paymentDateOnly.toDateString(),
                startDate: startDateOnly.toDateString(),
                endDate: endDateOnly.toDateString(),
              });
            }

            return isInRange;
          });

          console.log("Date range filter applied:", {
            filteredCount: filteredPayments.length,
            startDate: startDate.toDateString(),
            endDate: endDate.toDateString(),
            isInclusive: "Both start and end dates are included",
          });
        }

        setPayments(filteredPayments);
        setTotalPayments(filteredPayments.length);

        // Calculate statistics from filtered payments
        const successful =
          filteredPayments.filter((p) => p.status === "succeeded") || [];
        setSuccessfulPayments(successful.length);

        const total = successful.reduce((sum, payment) => {
          const amount =
            typeof payment.amount === "number" ? payment.amount : 0;
          return sum + amount / 100; // Convert from cents to LKR
        }, 0);
        setTotalAmount(total);

        console.log("Payment history loaded:", {
          total: response.payments?.length,
          successful: successful.length,
          totalAmount: total,
        });
      } else {
        throw new Error(response.message || "Failed to load payment history");
      }
    } catch (error) {
      console.error("Error loading payment history:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to load payment history. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadPaymentHistory();
  };

  // Handle search
  const handleSearch = () => {
    loadPaymentHistory();
  };

  // Handle filter change
  const applyFilters = (newStatusFilter) => {
    setStatusFilter(newStatusFilter);
    setShowFilterModal(false);
    loadPaymentHistory({
      status: newStatusFilter !== "all" ? newStatusFilter : undefined,
    });
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Format amount
  const formatAmount = (amount) => {
    if (typeof amount !== "number") return "LKR 0.00";
    const lkrAmount = amount / 100; // Convert from cents
    return `LKR ${lkrAmount.toFixed(2)}`;
  };

  // Handle view more button click
  const handleViewMore = (payment) => {
    console.log("handleViewMore called with payment:", payment);
    setSelectedPayment(payment);
    setShowPaymentDetails(true);
  };

  // Clear date filter
  const clearDateFilter = () => {
    setSelectedDate(null);
    setStartDate(null);
    setEndDate(null);
    setDateFilterType("single");
    setShowDateFilterModal(false);
  };

  // Export payments to PDF
  const handleExportPDF = async () => {
    try {
      setIsExporting(true);

      if (!payments || payments.length === 0) {
        Alert.alert("No Data", "No payment history available to export.");
        return;
      }
      // Calculate stats
      const stats = {
        total: payments.length,
        successful: payments.filter((p) => p.status === "succeeded").length,
        pending: payments.filter((p) => p.status === "pending").length,
        failed: payments.filter((p) => p.status === "failed").length,
        totalAmount: payments
          .filter((p) => p.status === "succeeded")
          .reduce(
            (sum, p) =>
              sum + (typeof p.amount === "number" ? p.amount / 100 : 0),
            0
          ),
      };
      await pdfExportService.exportPaymentsPDF(payments, stats, user, {
        searchTerm: searchText,
        statusFilter,
      });
    } catch (error) {
      Alert.alert(
        "Export Failed",
        "Failed to export payment history. Please try again."
      );
    } finally {
      setIsExporting(false);
    }
  };

  return {
    // State
    isMounted,
    payments,
    loading,
    refreshing,
    searchText,
    statusFilter,
    showFilterModal,
    totalPayments,
    totalAmount,
    successfulPayments,
    selectedPayment,
    showPaymentDetails,
    isExporting,
    showDateFilterModal,
    dateFilterType,
    selectedDate,
    startDate,
    endDate,
    showStartDatePicker,
    showEndDatePicker,
    showSingleDatePicker,

    // Setters
    setSearchText,
    setStatusFilter,
    setShowFilterModal,
    setSelectedPayment,
    setShowPaymentDetails,
    setShowDateFilterModal,
    setDateFilterType,
    setSelectedDate,
    setStartDate,
    setEndDate,
    setShowStartDatePicker,
    setShowEndDatePicker,
    setShowSingleDatePicker,

    // Actions
    onRefresh,
    handleSearch,
    applyFilters,
    formatDate,
    formatAmount,
    handleViewMore,
    clearDateFilter,
    handleExportPDF,
    loadPaymentHistory,
  };
}
