import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DoctorInfoCard({ doctorData }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoTitle}>Doctor Information</Text>
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Doctor ID</Text>
          <Text style={styles.infoValue}>{doctorData.doctorId}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Name</Text>
          <Text style={styles.infoValue}>{doctorData.name}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{doctorData.email}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Status</Text>
          <Text style={styles.infoValue}>
            {doctorData.isVerified ? 'Verified' : 'Not Verified'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
});