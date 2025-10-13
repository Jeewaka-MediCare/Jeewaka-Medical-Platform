import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../store/authStore';
import paymentService from '../services/paymentService';
import PaymentDetailsModal from '../components/PaymentDetailsModal';

export default function PaymentHistory() {
  const { user, userRole } = useAuthStore();
  const router = useRouter();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [totalPayments, setTotalPayments] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [successfulPayments, setSuccessfulPayments] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);

  // Load payment history on component mount
  useEffect(() => {
    if (user && userRole === 'patient') {
      loadPaymentHistory();
    }
  }, [user, userRole]);

  // Load payment history with filters
  const loadPaymentHistory = async (filters = {}) => {
    try {
      setLoading(true);
      
      const queryFilters = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchText || undefined,
        limit: 50,
        offset: 0,
        ...filters
      };

      console.log('Loading payment history with filters:', queryFilters);
      
      const response = await paymentService.getPaymentHistory(queryFilters);
      
      if (response.success) {
        console.log('Payment history loaded successfully:', response.payments);
        setPayments(response.payments || []);
        setTotalPayments(response.payments?.length || 0);
        
        // Calculate statistics
        const successful = response.payments?.filter(p => p.status === 'succeeded') || [];
        setSuccessfulPayments(successful.length);
        
        const total = successful.reduce((sum, payment) => {
          const amount = typeof payment.amount === 'number' ? payment.amount : 0;
          return sum + (amount / 100); // Convert from cents to LKR
        }, 0);
        setTotalAmount(total);
        
        console.log('Payment history loaded:', {
          total: response.payments?.length,
          successful: successful.length,
          totalAmount: total
        });
      } else {
        throw new Error(response.message || 'Failed to load payment history');
      }
    } catch (error) {
      console.error('Error loading payment history:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to load payment history. Please try again.'
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
    loadPaymentHistory({ status: newStatusFilter !== 'all' ? newStatusFilter : undefined });
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Format amount
  const formatAmount = (amount) => {
    if (typeof amount !== 'number') return 'LKR 0.00';
    const lkrAmount = amount / 100; // Convert from cents
    return `LKR ${lkrAmount.toFixed(2)}`;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'succeeded':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'failed':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'succeeded':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'failed':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  // Handle view more button click
  const handleViewMore = (payment) => {
    console.log('handleViewMore called with payment:', payment);
    setSelectedPayment(payment);
    setShowPaymentDetails(true);
  };

  // Render simplified payment item
  const renderPaymentItem = (payment, index) => (
    <View
      key={payment.id || index}
      style={styles.paymentItem}
    >
      <View style={styles.paymentHeader}>
        <View style={styles.paymentInfo}>
          <Text style={styles.doctorName}>
            {payment.doctorName || payment.doctor?.name || 'Unknown Doctor'}
          </Text>
          <Text style={styles.specialization}>
            {payment.doctorSpecialization || payment.doctor?.specialization || 'General'}
          </Text>
          <Text style={styles.paymentDate}>
            Paid on {formatDate(payment.date || payment.created)}
          </Text>
        </View>
        <View style={styles.paymentRight}>
          <Text style={styles.amount}>{formatAmount(payment.amount)}</Text>
          <TouchableOpacity
            style={styles.viewMoreButton}
            onPress={() => handleViewMore(payment)}
            activeOpacity={0.7}
          >
            <Text style={styles.viewMoreText}>View More</Text>
            <Ionicons name="chevron-forward" size={16} color="#008080" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Show loading or authentication required
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
        <View style={styles.centerContainer}>
          <Ionicons name="card-outline" size={80} color="#94A3B8" />
          <Text style={styles.emptyTitle}>Payment History Unavailable</Text>
          <Text style={styles.emptyMessage}>
            Payment history is only available for patient accounts.
          </Text>
        </View>
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

      {/* Header Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalPayments}</Text>
            <Text style={styles.statLabel}>Total Payments</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{successfulPayments}</Text>
            <Text style={styles.statLabel}>Successful</Text>
          </View>
          <View style={[styles.statCard, styles.amountCard]}>
            <Text style={styles.amountNumber}>LKR {totalAmount.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Amount</Text>
          </View>
        </View>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by doctor name, payment ID, amount, or status..."
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            placeholderTextColor="#94A3B8"
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter-outline" size={20} color="#1E293B" />
        </TouchableOpacity>
      </View>

      {/* Export Button */}
      <View style={styles.exportContainer}>
        <TouchableOpacity style={styles.exportButton}>
          <Ionicons name="download-outline" size={16} color="#008080" />
          <Text style={styles.exportText}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* Payment List */}
      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>Recent Payments</Text>
        <Text style={styles.sectionSubtitle}>{payments.length} payments found</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#008080" />
            <Text style={styles.loadingText}>Loading payment history...</Text>
          </View>
        ) : payments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="card-outline" size={64} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Payments Found</Text>
            <Text style={styles.emptyMessage}>
              {searchText || statusFilter !== 'all'
                ? 'No payments match your search criteria.'
                : 'You haven\'t made any payments yet.'}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.paymentList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          >
            {payments.map(renderPaymentItem)}
          </ScrollView>
        )}
      </View>

      {/* Payment Details Modal */}
      <PaymentDetailsModal
        visible={showPaymentDetails}
        onClose={() => {
          setShowPaymentDetails(false);
          setSelectedPayment(null);
        }}
        payment={selectedPayment}
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Payments</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.filterOptions}>
              <Text style={styles.filterLabel}>Status</Text>
              {['all', 'succeeded', 'pending', 'failed'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterOption,
                    statusFilter === status && styles.filterOptionActive
                  ]}
                  onPress={() => applyFilters(status)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    statusFilter === status && styles.filterOptionTextActive
                  ]}>
                    {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
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
  statsContainer: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  amountCard: {
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
    marginLeft: 8,
    paddingLeft: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  amountNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#008080',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1E293B',
  },
  filterButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  exportContainer: {
    alignItems: 'flex-end',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#008080',
    gap: 4,
  },
  exportText: {
    color: '#008080',
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  paymentList: {
    flex: 1,
  },
  paymentItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  paymentInfo: {
    flex: 1,
    marginRight: 12,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  specialization: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  paymentDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  paymentRight: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  viewMoreText: {
    fontSize: 12,
    color: '#008080',
    fontWeight: '500',
    marginRight: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  filterOptions: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterOptionActive: {
    backgroundColor: '#008080',
    borderColor: '#008080',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  filterOptionTextActive: {
    color: 'white',
    fontWeight: '500',
  },
});