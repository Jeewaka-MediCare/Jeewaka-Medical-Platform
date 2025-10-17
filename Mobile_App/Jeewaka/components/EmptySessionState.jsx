import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const EmptySessionState = () => {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={60} color="#94A3B8" />
      <Text style={styles.emptyTitle}>No Time Slots</Text>
      <Text style={styles.emptyMessage}>This session has no time slots defined</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default EmptySessionState;