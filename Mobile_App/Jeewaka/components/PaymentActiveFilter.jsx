import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

export default function PaymentActiveFilter({ 
  selectedDate, 
  startDate, 
  endDate, 
  dateFilterType,
  onClearFilter 
}) {
  if (!selectedDate && (!startDate || !endDate)) {
    return null;
  }

  return (
    <View style={styles.activeFilterContainer}>
      <Text style={styles.activeFilterText}>
        {dateFilterType === 'single' 
          ? `Filtered by: ${format(selectedDate, 'MMM d, yyyy')}` 
          : `Filtered by: ${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`
        }
      </Text>
      <TouchableOpacity onPress={onClearFilter} style={styles.clearFilterButton}>
        <Ionicons name="close-circle" size={18} color="#666" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  activeFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E0F2FE',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4A90E2',
  },
  activeFilterText: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '500',
  },
  clearFilterButton: {
    padding: 4,
  },
});