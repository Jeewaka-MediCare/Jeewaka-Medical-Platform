import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import paymentService from '../services/paymentService';
import useAuthStore from '../store/authStore';

const { width } = Dimensions.get('window');

export default function DoctorEarnings() {
  const { user } = useAuthStore();
  const router = useRouter();
  
  // State management
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [expandedCards, setExpandedCards] = useState(new Set());
  
  // Date filter states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  
  // Pagination
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async (isRefresh = false, searchQuery = '', dateFilters = {}) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const filters = {
        period: 'all', // Get all data for the date range
        ...dateFilters,
      };

      // Add date filters if set
      if (startDate && !dateFilters.startDate) {
        filters.startDate = startDate.toISOString();
      }
      if (endDate && !dateFilters.endDate) {
        filters.endDate = endDate.toISOString();
      }

      console.log('Loading earnings with filters:', filters);

      const response = await paymentService.getDoctorEarnings(filters);
      
      if (response.success && response.earnings && response.earnings.payments) {
        let newPayments = response.earnings.payments.map(payment => ({
          ...payment,
          // Ensure we have consistent field names
          paymentId: payment.id,
          paidDate: payment.date,
          amount: payment.amount / 100, // Convert from cents
          patientName: payment.patientName || "Unknown Patient",
        }));

        // Apply search filter on frontend if search query exists
        const searchTerm = (searchQuery || searchText).toLowerCase().trim();
        if (searchTerm) {
          newPayments = newPayments.filter(payment => {
            return (
              payment.patientName?.toLowerCase().includes(searchTerm) ||
              payment.paymentId?.toLowerCase().includes(searchTerm) ||
              payment.appointmentDate?.toString().toLowerCase().includes(searchTerm) ||
              payment.paidDate?.toString().toLowerCase().includes(searchTerm)
            );
          });
        }

        // Sort by paid date (newest first)
        newPayments.sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate));

        setEarnings(newPayments);
        
        // For simplicity, disable pagination since we're getting all data
        setHasMore(false);
        setOffset(0);
      }
    } catch (error) {
      console.error('Error loading earnings:', error);
      Alert.alert('Error', 'Failed to load earnings data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setExpandedCards(new Set());
    loadEarnings(true);
  };

  const handleSearch = () => {
    setExpandedCards(new Set());
    loadEarnings(true, searchText);
  };

  const handleDateFilter = () => {
    if (startDate && endDate && startDate > endDate) {
      Alert.alert('Invalid Date Range', 'Start date must be before end date.');
      return;
    }

    const dateFilters = {};
    if (startDate) dateFilters.startDate = startDate.toISOString();
    if (endDate) dateFilters.endDate = endDate.toISOString();

    setExpandedCards(new Set());
    loadEarnings(true, searchText, dateFilters);
  };

  const clearDateFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setExpandedCards(new Set());
    loadEarnings(true, searchText);
  };

  const toggleCardExpansion = (paymentId) => {
    const newExpandedCards = new Set(expandedCards);
    if (newExpandedCards.has(paymentId)) {
      newExpandedCards.delete(paymentId);
    } else {
      newExpandedCards.add(paymentId);
    }
    setExpandedCards(newExpandedCards);
  };

  const formatCurrency = (amount) => {
    return `LKR ${amount.toFixed(2)}`;
  };

  const formatDateTime = (dateString) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy HH:mm');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const renderPaymentCard = (payment) => {
    const isExpanded = expandedCards.has(payment.paymentId);
    
    return (
      <View key={payment.paymentId} style={styles.paymentCard}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => toggleCardExpansion(payment.paymentId)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.patientName}>{payment.patientName}</Text>
            <Text style={styles.amount}>{formatCurrency(payment.amount)}</Text>
          </View>
          <View style={styles.cardHeaderRight}>
            <Text style={styles.paidDate}>{formatDate(payment.paidDate)}</Text>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color="#666"
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.cardDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="card-outline" size={16} color="#666" />
              <Text style={styles.detailLabel}>Payment ID:</Text>
              <Text style={styles.detailValue}>{payment.paymentId}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.detailLabel}>Appointment:</Text>
              <Text style={styles.detailValue}>
                {formatDate(payment.appointmentDate)} at {payment.appointmentTime}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.detailLabel}>Paid:</Text>
              <Text style={styles.detailValue}>{formatDateTime(payment.paidDate)}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#4CAF50" />
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={[styles.detailValue, styles.statusCompleted]}>Completed</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading && earnings.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading earnings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>View Earnings</Text>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by patient name, payment ID..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchText('');
                handleSearch();
              }}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Date Filters */}
      <View style={styles.dateFiltersContainer}>
        <Text style={styles.dateFiltersTitle}>Filter by Date:</Text>
        
        <View style={styles.datePickersRow}>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={16} color="#007AFF" />
            <Text style={styles.datePickerText}>
              {startDate ? formatDate(startDate.toISOString()) : 'Start Date'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={16} color="#007AFF" />
            <Text style={styles.datePickerText}>
              {endDate ? formatDate(endDate.toISOString()) : 'End Date'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dateActionsRow}>
          <TouchableOpacity style={styles.filterButton} onPress={handleDateFilter}>
            <Text style={styles.filterButtonText}>Apply Filter</Text>
          </TouchableOpacity>
          
          {(startDate || endDate) && (
            <TouchableOpacity style={styles.clearFilterButton} onPress={clearDateFilters}>
              <Text style={styles.clearFilterButtonText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Earnings List */}
      <ScrollView
        style={styles.earningsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {earnings.length > 0 ? (
          <>
            {earnings.map(renderPaymentCard)}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="cash-multiple"
              size={64}
              color="#ccc"
            />
            <Text style={styles.emptyTitle}>No Earnings Found</Text>
            <Text style={styles.emptySubtitle}>
              You haven't received any payments yet or no payments match your search criteria.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate) {
              setStartDate(selectedDate);
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) {
              setEndDate(selectedDate);
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    marginLeft: 10,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  dateFiltersContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateFiltersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  datePickersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  datePickerButton: {
    flex: 0.48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  datePickerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  dateActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 0.48,
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  clearFilterButton: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    flex: 0.48,
  },
  clearFilterButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  earningsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
  },
  paidDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardDetails: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    minWidth: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  statusCompleted: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  loadMoreButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    marginVertical: 20,
    alignItems: 'center',
  },
  loadMoreText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});