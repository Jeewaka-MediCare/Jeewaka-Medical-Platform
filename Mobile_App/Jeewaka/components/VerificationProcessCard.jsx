import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function VerificationProcessCard() {
  return (
    <View style={styles.processCard}>
      <Text style={styles.processTitle}>Verification Process</Text>
      <View style={styles.processSteps}>
        <Text style={styles.processStep}>→ Upload all your medical certificates and licenses</Text>
        <Text style={styles.processStep}>→ Click "Save Certificates" to submit for review</Text>
        <Text style={styles.processStep}>→ Admin team will review your documents within 24-48 hours</Text>
        <Text style={styles.processStep}>→ Use "Check Status" button to see verification progress</Text>
        <Text style={styles.processStep}>→ Once verified, you can access your dashboard</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  processCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  processTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  processSteps: {
    gap: 8,
  },
  processStep: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
});