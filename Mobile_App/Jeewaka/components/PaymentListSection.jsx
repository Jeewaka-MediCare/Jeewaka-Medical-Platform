import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
import PaymentItem from './PaymentItem';

export default function PaymentListSection({
  loading,
  payments,
  refreshing,
  onRefresh,
  searchText,
  statusFilter,
  onViewMore,
  formatDate,
  formatAmount
}) {
  return (
    <View style={styles.listContainer}>
      <Text style={styles.sectionTitle}>Recent Payments</Text>
      <Text style={styles.sectionSubtitle}>{payments.length} payments found</Text>

      {loading ? (
        <LoadingState text="Loading payment history..." />
      ) : payments.length === 0 ? (
        <EmptyState
          icon="card-outline"
          title="No Payments Found"
          message={
            searchText || statusFilter !== 'all'
              ? 'No payments match your search criteria.'
              : 'You haven\'t made any payments yet.'
          }
        />
      ) : (
        <ScrollView
          style={styles.paymentList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {payments.map((payment, index) => (
            <PaymentItem
              key={payment.id || index}
              payment={payment}
              onViewMore={onViewMore}
              formatDate={formatDate}
              formatAmount={formatAmount}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  paymentList: {
    flex: 1,
  },
});