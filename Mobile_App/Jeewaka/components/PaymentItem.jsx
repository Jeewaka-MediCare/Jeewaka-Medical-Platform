import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentItem({ 
  payment, 
  onViewMore, 
  formatDate, 
  formatAmount 
}) {
  return (
    <View style={styles.paymentItem}>
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
            onPress={() => onViewMore(payment)}
            activeOpacity={0.7}
          >
            <Text style={styles.viewMoreText}>View More</Text>
            <Ionicons name="chevron-forward" size={16} color="#008080" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});