import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import pdfExportService from '../services/pdfExportService';
import useAuthStore from '../store/authStore';

const { width } = Dimensions.get('window');

const PaymentDetailsModal = ({ 
  visible, 
  onClose, 
  payment,
  onViewDetails = null // Optional callback for additional actions
}) => {
  const { user } = useAuthStore();
  const [isExporting, setIsExporting] = useState(false);
  
  // Payment details modal logic
  
  const handleExportSinglePayment = async () => {
    if (!payment) {
      Alert.alert('Error', 'No payment data available to export');
      return;
    }

    try {
      setIsExporting(true);
      
      // Use the payment data directly, ensuring it has proper structure
      const paymentData = {
        ...payment,
        // Ensure essential fields are present
        id: payment.id || payment._id || `payment_${Date.now()}`,
        amount: payment.amount || 0,
        date: payment.date || payment.created || new Date().toISOString(),
        doctorName: payment.doctorName || payment.doctor?.name || 'Unknown Doctor',
        doctorSpecialization: payment.doctorSpecialization || payment.doctor?.specialization || 'General',
        status: payment.status || 'completed',
        currency: payment.currency || 'LKR',
        // Include appointment information if available
        appointmentDate: payment.appointmentDate || payment.appointment?.date,
        appointmentTime: payment.appointmentTime || payment.appointment?.time,
        appointmentStatus: payment.appointmentStatus || payment.appointment?.status,
        // Include session information if available
        sessionType: payment.sessionType || payment.session?.type,
        sessionDuration: payment.sessionDuration || payment.session?.duration,
        // Include any additional description
        description: payment.description || payment.notes || payment.memo
      };

      // Export enhanced payment data
      
      await pdfExportService.exportPaymentDetailsPDF(
        paymentData, // Single payment object (not array)
        user
      );
      
      Alert.alert('Success', 'Payment receipt exported successfully!');
    } catch (error) {
      console.error('Error exporting payment receipt:', error);
      Alert.alert('Error', 'Failed to export payment receipt. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  if (!payment) {
    return null;
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format date and time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Format time only
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
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

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Payment Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Payment Status Section */}
            <View style={styles.section}>
              <View style={styles.statusHeader}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) }]}>
                  <Ionicons 
                    name={getStatusIcon(payment.status)} 
                    size={16} 
                    color="white" 
                    style={styles.statusIcon}
                  />
                  <Text style={styles.statusText}>
                    {payment.status === 'succeeded' ? 'Payment Successful' : 
                     payment.status === 'pending' ? 'Payment Pending' :
                     payment.status === 'failed' ? 'Payment Failed' : 'Unknown Status'}
                  </Text>
                </View>
                <Text style={styles.amountLarge}>{formatAmount(payment.amount)}</Text>
              </View>
            </View>

            {/* Payment Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Information</Text>
              
              <View style={styles.detailItem}>
                <View style={styles.detailLabel}>
                  <Ionicons name="card-outline" size={16} color="#6B7280" />
                  <Text style={styles.labelText}>Payment ID</Text>
                </View>
                <Text style={styles.valueText}>{payment.id || 'N/A'}</Text>
              </View>

              <View style={styles.detailItem}>
                <View style={styles.detailLabel}>
                  <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                  <Text style={styles.labelText}>Payment Date</Text>
                </View>
                <Text style={styles.valueText}>{formatDate(payment.date || payment.created)}</Text>
              </View>

              <View style={styles.detailItem}>
                <View style={styles.detailLabel}>
                  <Ionicons name="time-outline" size={16} color="#6B7280" />
                  <Text style={styles.labelText}>Payment Time</Text>
                </View>
                <Text style={styles.valueText}>{formatTime(payment.date || payment.created)}</Text>
              </View>

              <View style={styles.detailItem}>
                <View style={styles.detailLabel}>
                  <Ionicons name="cash-outline" size={16} color="#6B7280" />
                  <Text style={styles.labelText}>Currency</Text>
                </View>
                <Text style={styles.valueText}>{(payment.currency || 'LKR').toUpperCase()}</Text>
              </View>
            </View>

            {/* Doctor Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Doctor Information</Text>
              
              <View style={styles.detailItem}>
                <View style={styles.detailLabel}>
                  <Ionicons name="person-outline" size={16} color="#6B7280" />
                  <Text style={styles.labelText}>Doctor Name</Text>
                </View>
                <Text style={styles.valueText}>
                  {payment.doctorName || payment.doctor?.name || 'Unknown Doctor'}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <View style={styles.detailLabel}>
                  <Ionicons name="medical-outline" size={16} color="#6B7280" />
                  <Text style={styles.labelText}>Specialization</Text>
                </View>
                <Text style={styles.valueText}>
                  {payment.doctorSpecialization || payment.doctor?.specialization || 'General'}
                </Text>
              </View>
            </View>

            {/* Appointment Information */}
            {(payment.appointmentDate || payment.appointmentTime) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Appointment Information</Text>
                
                {payment.appointmentDate && (
                  <View style={styles.detailItem}>
                    <View style={styles.detailLabel}>
                      <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                      <Text style={styles.labelText}>Appointment Date</Text>
                    </View>
                    <Text style={styles.valueText}>{formatDate(payment.appointmentDate)}</Text>
                  </View>
                )}

                {payment.appointmentTime && (
                  <View style={styles.detailItem}>
                    <View style={styles.detailLabel}>
                      <Ionicons name="time-outline" size={16} color="#6B7280" />
                      <Text style={styles.labelText}>Appointment Time</Text>
                    </View>
                    <Text style={styles.valueText}>{payment.appointmentTime}</Text>
                  </View>
                )}

                {payment.appointmentStatus && (
                  <View style={styles.detailItem}>
                    <View style={styles.detailLabel}>
                      <Ionicons name="checkmark-circle-outline" size={16} color="#6B7280" />
                      <Text style={styles.labelText}>Appointment Status</Text>
                    </View>
                    <Text style={[styles.valueText, { 
                      color: payment.appointmentStatus === 'confirmed' ? '#10B981' : '#6B7280',
                      fontWeight: '500'
                    }]}>
                      {payment.appointmentStatus?.charAt(0).toUpperCase() + 
                       payment.appointmentStatus?.slice(1) || 'N/A'}
                    </Text>
                  </View>
                )}
              </View>
            )}
            </ScrollView>
          </View>

          {/* Footer Actions */}
          <View style={styles.modalFooter}>
            {/* Export Button */}
            <TouchableOpacity 
              style={[styles.viewDetailsButton, styles.exportButton]}
              onPress={handleExportSinglePayment}
              disabled={isExporting}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color="#008080" />
              ) : (
                <Ionicons name="download-outline" size={16} color="#008080" />
              )}
              <Text style={styles.viewDetailsText}>
                {isExporting ? 'Exporting...' : 'Export Receipt'}
              </Text>
            </TouchableOpacity>
            
            {/* View Details Button */}
            {onViewDetails && (
              <TouchableOpacity 
                style={styles.viewDetailsButton}
                onPress={() => onViewDetails(payment)}
              >
                <Ionicons name="eye-outline" size={16} color="#008080" />
                <Text style={styles.viewDetailsText}>View Full Details</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    maxHeight: '80%',
    minHeight: 400,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  scrollContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  statusHeader: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  amountLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  detailItem: {
    marginBottom: 12,
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  labelText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    fontWeight: '500',
  },
  valueText: {
    fontSize: 14,
    color: '#1E293B',
    marginLeft: 24,
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    gap: 12,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#008080',
  },
  exportButton: {
    backgroundColor: '#E0F2FE',
  },
  viewDetailsText: {
    color: '#008080',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});

export default PaymentDetailsModal;