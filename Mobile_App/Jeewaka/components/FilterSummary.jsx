import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

const FilterSummary = ({ filters, onClearFilter, onClearAll }) => {
  const activeFilters = [];
  
  // Patient name filter
  if (filters.patientName.trim()) {
    activeFilters.push({
      key: 'patientName',
      label: `Patient: ${filters.patientName}`,
      type: 'text'
    });
  }
  
  // Hospital name filter
  if (filters.hospitalName.trim()) {
    activeFilters.push({
      key: 'hospitalName',
      label: `Hospital: ${filters.hospitalName}`,
      type: 'text'
    });
  }
  
  // Appointment type filter
  if (filters.appointmentType) {
    const typeLabel = filters.appointmentType === 'in-person' ? 'In-Person' : 'Video Call';
    activeFilters.push({
      key: 'appointmentType',
      label: `Type: ${typeLabel}`,
      type: 'select'
    });
  }
  
  // Appointment status filter
  if (filters.appointmentStatus) {
    const statusLabel = filters.appointmentStatus.charAt(0).toUpperCase() + filters.appointmentStatus.slice(1);
    activeFilters.push({
      key: 'appointmentStatus',
      label: `Status: ${statusLabel}`,
      type: 'select'
    });
  }
  
  // Date filter
  if (filters.dateFilterType === 'single' && filters.selectedDate) {
    activeFilters.push({
      key: 'selectedDate',
      label: `Date: ${format(filters.selectedDate, 'MMM dd, yyyy')}`,
      type: 'date'
    });
  } else if (filters.dateFilterType === 'range' && filters.startDate && filters.endDate) {
    activeFilters.push({
      key: 'dateRange',
      label: `${format(filters.startDate, 'MMM dd')} - ${format(filters.endDate, 'MMM dd, yyyy')}`,
      type: 'dateRange'
    });
  }

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Active Filters ({activeFilters.length})</Text>
        <TouchableOpacity onPress={onClearAll} style={styles.clearAllButton}>
          <Text style={styles.clearAllText}>Clear All</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.filtersContainer}>
        {activeFilters.map((filter, index) => (
          <View key={index} style={styles.filterChip}>
            <Text style={styles.filterLabel}>{filter.label}</Text>
            <TouchableOpacity
              onPress={() => onClearFilter(filter.key)}
              style={styles.removeButton}
            >
              <Ionicons name="close" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8faff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  clearAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearAllText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '500',
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    gap: 6,
  },
  filterLabel: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  removeButton: {
    padding: 2,
  },
});

export default FilterSummary;