import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function VerificationHeader({ doctorData }) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Welcome to Doctor Verification</Text>
      <Text style={styles.subtitle}>Complete your profile by uploading certificates</Text>
      
      {/* Welcome message for new doctors */}
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeText}>
          🎉 Registration successful! Now please upload your medical certificates for admin verification.
        </Text>
      </View>
      
      <View style={[
        styles.statusBadge,
        doctorData.isVerified ? styles.verifiedBadge : styles.pendingBadge
      ]}>
        <Text style={[
          styles.statusText,
          doctorData.isVerified ? styles.verifiedText : styles.pendingText
        ]}>
          {doctorData.isVerified ? '✓ Verified' : '⏳ Pending Verification'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 16,
  },
  welcomeCard: {
    backgroundColor: '#d5eeeeff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#008080',
  },
  welcomeText: {
    fontSize: 14,
    color: '#008080',
    lineHeight: 20,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  verifiedText: {
    color: '#15803D',
  },
  pendingText: {
    color: '#A16207',
  },
});