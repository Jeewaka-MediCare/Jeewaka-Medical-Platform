import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PaymentStatsCard({ 
  totalPayments, 
  successfulPayments, 
  totalAmount 
}) {
  return (
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
  );
}

const styles = StyleSheet.create({
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
});