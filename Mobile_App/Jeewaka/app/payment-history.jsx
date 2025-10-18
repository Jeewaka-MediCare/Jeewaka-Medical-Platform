import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAuthStore from '../store/authStore';
import usePaymentHistory from '../hooks/usePaymentHistory';
import EmptyState from '../components/EmptyState';
import PaymentStatsCard from '../components/PaymentStatsCard';
import PaymentSearchBar from '../components/PaymentSearchBar';
import PaymentActiveFilter from '../components/PaymentActiveFilter';
import PaymentActionButtons from '../components/PaymentActionButtons';
import PaymentListSection from '../components/PaymentListSection';
import PaymentDetailsModal from '../components/PaymentDetailsModal';
import PaymentFilterModal from '../components/PaymentFilterModal';
import PaymentDateFilterModal from '../components/PaymentDateFilterModal';

export default function PaymentHistory() {
  const { user, userRole } = useAuthStore();
  
  const {
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
    handleExportPDF
  } = usePaymentHistory(user, userRole);

  // Show loading or authentication required
  if (!isMounted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#008080" />
        </View>
      </SafeAreaView>
    );
  }

  if (!user || userRole !== 'patient') {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Payment History',
            headerShown: true,
            headerStyle: { backgroundColor: '#1E293B' },
            headerTitleStyle: { color: 'white', fontSize: 20, fontWeight: '600' },
            headerTintColor: 'white',
          }}
        />
        <EmptyState
          icon="card-outline"
          title="Payment History Unavailable"
          message="Payment history is only available for patient accounts."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Payment History',
          headerShown: true,
          headerStyle: { backgroundColor: '#1E293B' },
          headerTitleStyle: { color: 'white', fontSize: 20, fontWeight: '600' },
          headerTintColor: 'white',
        }}
      />

      <PaymentStatsCard
        totalPayments={totalPayments}
        successfulPayments={successfulPayments}
        totalAmount={totalAmount}
      />

      <PaymentSearchBar
        searchText={searchText}
        onSearchChange={setSearchText}
        onSearchSubmit={handleSearch}
      />

      <PaymentActiveFilter
        selectedDate={selectedDate}
        startDate={startDate}
        endDate={endDate}
        dateFilterType={dateFilterType}
        onClearFilter={clearDateFilter}
      />

      <PaymentActionButtons
        onFilterPress={() => setShowFilterModal(true)}
        onCalendarPress={() => setShowDateFilterModal(true)}
        onExportPress={handleExportPDF}
        isExporting={isExporting}
      />

      <PaymentListSection
        loading={loading}
        payments={payments}
        refreshing={refreshing}
        onRefresh={onRefresh}
        searchText={searchText}
        statusFilter={statusFilter}
        onViewMore={handleViewMore}
        formatDate={formatDate}
        formatAmount={formatAmount}
      />

      <PaymentDetailsModal
        visible={showPaymentDetails}
        onClose={() => {
          setShowPaymentDetails(false);
          setSelectedPayment(null);
        }}
        payment={selectedPayment}
      />

      <PaymentFilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        statusFilter={statusFilter}
        onApplyFilter={applyFilters}
      />

      <PaymentDateFilterModal
        visible={showDateFilterModal}
        onClose={() => setShowDateFilterModal(false)}
        dateFilterType={dateFilterType}
        setDateFilterType={setDateFilterType}
        selectedDate={selectedDate}
        startDate={startDate}
        endDate={endDate}
        showSingleDatePicker={showSingleDatePicker}
        showStartDatePicker={showStartDatePicker}
        showEndDatePicker={showEndDatePicker}
        setShowSingleDatePicker={setShowSingleDatePicker}
        setShowStartDatePicker={setShowStartDatePicker}
        setShowEndDatePicker={setShowEndDatePicker}
        setSelectedDate={setSelectedDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        onClearFilter={clearDateFilter}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});