import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

export default function PaymentDateFilterModal({ 
  visible, 
  onClose,
  dateFilterType,
  setDateFilterType,
  selectedDate,
  startDate,
  endDate,
  showSingleDatePicker,
  showStartDatePicker,
  showEndDatePicker,
  setShowSingleDatePicker,
  setShowStartDatePicker,
  setShowEndDatePicker,
  setSelectedDate,
  setStartDate,
  setEndDate,
  onClearFilter
}) {
  return (
    <>
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Date</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.filterOptions}>
              <Text style={styles.filterLabel}>Filter Type</Text>
              
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  dateFilterType === 'single' && styles.filterOptionActive
                ]}
                onPress={() => setDateFilterType('single')}
              >
                <Text style={[
                  styles.filterOptionText,
                  dateFilterType === 'single' && styles.filterOptionTextActive
                ]}>
                  Single Date
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterOption,
                  dateFilterType === 'range' && styles.filterOptionActive
                ]}
                onPress={() => setDateFilterType('range')}
              >
                <Text style={[
                  styles.filterOptionText,
                  dateFilterType === 'range' && styles.filterOptionTextActive
                ]}>
                  Date Range
                </Text>
              </TouchableOpacity>

              {dateFilterType === 'single' && (
                <View style={styles.datePickerSection}>
                  <Text style={styles.datePickerLabel}>Select Date:</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowSingleDatePicker(true)}
                  >
                    <Text style={styles.dateButtonText}>
                      {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Choose Date'}
                    </Text>
                    <Ionicons name="calendar-outline" size={16} color="#4A90E2" />
                  </TouchableOpacity>
                </View>
              )}

              {dateFilterType === 'range' && (
                <View style={styles.datePickerSection}>
                  <Text style={styles.datePickerLabel}>Start Date:</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowStartDatePicker(true)}
                  >
                    <Text style={styles.dateButtonText}>
                      {startDate ? format(startDate, 'MMM d, yyyy') : 'Choose Start Date'}
                    </Text>
                    <Ionicons name="calendar-outline" size={16} color="#4A90E2" />
                  </TouchableOpacity>

                  <Text style={styles.datePickerLabel}>End Date:</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Text style={styles.dateButtonText}>
                      {endDate ? format(endDate, 'MMM d, yyyy') : 'Choose End Date'}
                    </Text>
                    <Ionicons name="calendar-outline" size={16} color="#4A90E2" />
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.dateFilterActions}>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={onClearFilter}
                >
                  <Text style={styles.clearButtonText}>Clear Filter</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={onClose}
                >
                  <Text style={styles.applyButtonText}>Apply Filter</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Pickers */}
      {showSingleDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowSingleDatePicker(false);
            if (date) {
              setSelectedDate(date);
            }
          }}
        />
      )}

      {showStartDatePicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowStartDatePicker(false);
            if (date) {
              setStartDate(date);
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowEndDatePicker(false);
            if (date) {
              setEndDate(date);
            }
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  filterOptions: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterOptionActive: {
    backgroundColor: '#008080',
    borderColor: '#008080',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  filterOptionTextActive: {
    color: 'white',
    fontWeight: '500',
  },
  datePickerSection: {
    marginTop: 16,
  },
  datePickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    marginTop: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateButtonText: {
    color: '#374151',
    fontSize: 14,
  },
  dateFilterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});