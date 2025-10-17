import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentActionButtons({ 
  onFilterPress, 
  onCalendarPress, 
  onExportPress, 
  isExporting 
}) {
  return (
    <View style={styles.actionButtonsContainer}>
      <View style={styles.filterCalendarContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={onFilterPress}
        >
          <Ionicons name="filter-outline" size={20} color="#1E293B" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.calendarButton}
          onPress={onCalendarPress}
        >
          <Ionicons name="calendar-outline" size={20} color="#4A90E2" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[styles.exportButton, isExporting && styles.disabledButton]}
        onPress={onExportPress}
        disabled={isExporting}
      >
        {isExporting ? (
          <ActivityIndicator size="small" color="#008080" />
        ) : (
          <Ionicons name="download-outline" size={16} color="#008080" />
        )}
        <Text style={styles.exportText}>
          {isExporting ? 'Exporting...' : 'Export'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  filterCalendarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  calendarButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#008080',
    gap: 4,
  },
  disabledButton: {
    opacity: 0.6,
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  exportText: {
    color: '#008080',
    fontSize: 14,
    fontWeight: '500',
  },
});