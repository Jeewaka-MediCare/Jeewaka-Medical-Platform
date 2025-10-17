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
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, parseISO } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import paymentService from '../services/paymentService';
import useAuthStore from '../store/authStore';
import pdfExportService from '../services/pdfExportService';

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
    if (startDate) {
      // Create UTC date string using the local date components to avoid timezone shifts
      const year = startDate.getFullYear();
      const month = startDate.getMonth();
      const day = startDate.getDate();
      const startUTC = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      dateFilters.startDate = startUTC.toISOString();
    }
    if (endDate) {
      // Create UTC date string using the local date components to avoid timezone shifts
      const year = endDate.getFullYear();
      const month = endDate.getMonth();
      const day = endDate.getDate();
      const endUTC = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
      dateFilters.endDate = endUTC.toISOString();
    }

    setExpandedCards(new Set());
    loadEarnings(true, searchText, dateFilters);
  };

  const clearDateFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setExpandedCards(new Set());
    loadEarnings(true, searchText);
  };

  const handleExport = async () => {
    try {
      if (!earnings || earnings.length === 0) {
        Alert.alert('No Data', 'No earnings data available to export.');
        return;
      }

      // Prepare export data
      const exportData = earnings.map(payment => ({
        ...payment,
        // Keep amounts as they are (already in LKR, not cents)
        amount: payment.amount, // Don't multiply by 100
        paidDate: payment.paidDate,
        appointmentDate: payment.appointmentDate,
        patientName: payment.patientName || 'Unknown Patient'
      }));

      // Prepare stats for export
      const totalAmount = earnings.reduce((sum, payment) => sum + payment.amount, 0);
      const exportStats = {
        totalPayments: earnings.length,
        totalAmount: totalAmount, // Don't multiply by 100
        period: `${startDate ? formatDatePickerDisplay(startDate) : 'All time'} - ${endDate ? formatDatePickerDisplay(endDate) : 'Present'}`
      };

      // Prepare filters info
      const exportFilters = {
        searchTerm: searchText || '',
        statusFilter: 'all', // Default to 'all' since we don't have status filtering in earnings
        dateRange: startDate || endDate ? `${formatDatePickerDisplay(startDate) || 'Start'} to ${formatDatePickerDisplay(endDate) || 'End'}` : 'All dates'
      };

      // Call export service
      await pdfExportService.exportDoctorEarningsPDF(
        exportData,
        exportStats,
        user,
        exportFilters
      );

    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', error.message || 'Failed to export earnings data. Please try again.');
    }
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
      const date = new Date(dateString);
      // Format in UTC to match backend filtering
      return `${date.getUTCMonth() + 1}/${date.getUTCDate()}/${date.getUTCFullYear()} ${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}`;
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      // Display date in UTC to match backend filtering
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getUTCMonth()]} ${date.getUTCDate().toString().padStart(2, '0')}, ${date.getUTCFullYear()}`;
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Separate function for date picker display to avoid timezone issues
  const formatDatePickerDisplay = (dateObject) => {
    try {
      if (!dateObject) return '';
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[dateObject.getMonth()]} ${dateObject.getDate().toString().padStart(2, '0')}, ${dateObject.getFullYear()}`;
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
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{
            title: 'Earnings',
            headerShown: true,
            headerBackTitle: 'Back',
            headerStyle: {
              backgroundColor: '#1E293B',
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 0,
            },
            headerTitleStyle: {
              color: 'white',
              fontSize: 20,
              fontWeight: '600',
            },
            headerTintColor: 'white',
          }} 
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading earnings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Earnings',
          headerShown: true,
          headerBackTitle: 'Back',
          headerStyle: {
            backgroundColor: '#1E293B',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          headerTitleStyle: {
            color: 'white',
            fontSize: 20,
            fontWeight: '600',
          },
          headerTintColor: 'white',
        }} 
      />

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Patient name / payment ID..."
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
        <View style={styles.dateFiltersHeader}>
          <Text style={styles.dateFiltersTitle}>Filter by Date:</Text>
          <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
            <Ionicons name="download-outline" size={16} color="#008080" />
            <Text style={styles.exportButtonText}>Export</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.datePickersRow}>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={16} color="#007AFF" />
            <Text style={styles.datePickerText}>
              {startDate ? formatDatePickerDisplay(startDate) : 'Start Date'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={16} color="#007AFF" />
            <Text style={styles.datePickerText}>
              {endDate ? formatDatePickerDisplay(endDate) : 'End Date'}
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
    </SafeAreaView>
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f8faff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
    backgroundColor: '#008080',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
    shadowColor: '#008080',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  searchButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  dateFiltersContainer: {
    backgroundColor: '#f8faff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  dateFiltersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateFiltersTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: 0.3,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#008080',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  exportButtonText: {
    color: '#008080',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
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
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  datePickerText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
  dateActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    backgroundColor: '#008080',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    flex: 0.48,
    shadowColor: '#008080',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  filterButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
  },
  clearFilterButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#008080',
    flex: 0.48,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  clearFilterButtonText: {
    color: '#008080',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
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
    backgroundColor: '#008080',
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