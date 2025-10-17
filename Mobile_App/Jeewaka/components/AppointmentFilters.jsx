import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

const AppointmentFilters = ({ 
  onFiltersChange, 
  onSectionChange, 
  currentSection,
  hospitals = [] 
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    doctorName: '',
    hospitalName: '',
    appointmentType: '', // 'in-person', 'video', or ''
    selectedDate: null,
    startDate: null,
    endDate: null,
    dateFilterType: 'single', // 'single', 'range'
  });

  // Handle filter changes and notify parent
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters]);

  // Clear all filters
  const clearAllFilters = () => {
    const clearedFilters = {
      doctorName: '',
      hospitalName: '',
      appointmentType: '',
      selectedDate: null,
      startDate: null,
      endDate: null,
      dateFilterType: 'single',
    };
    setFilters(clearedFilters);
  };

  // Handle date selection
  const handleDateChange = (event, selectedDate, type) => {
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      setShowStartDatePicker(false);
      setShowEndDatePicker(false);
      return;
    }

    if (selectedDate) {
      if (type === 'single') {
        setFilters(prev => ({
          ...prev,
          selectedDate: selectedDate,
        }));
        
        // Auto-switch section based on date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selected = new Date(selectedDate);
        selected.setHours(0, 0, 0, 0);
        
        if (selected >= today) {
          onSectionChange('upcoming');
        } else {
          onSectionChange('past');
        }
      } else if (type === 'start') {
        setFilters(prev => ({
          ...prev,
          startDate: selectedDate,
        }));
      } else if (type === 'end') {
        setFilters(prev => ({
          ...prev,
          endDate: selectedDate,
        }));
      }
    }

    setShowDatePicker(false);
    setShowStartDatePicker(false);
    setShowEndDatePicker(false);
  };

  // Get active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.doctorName.trim()) count++;
    if (filters.hospitalName.trim()) count++;
    if (filters.appointmentType) count++;
    if (filters.selectedDate || (filters.startDate && filters.endDate)) count++;
    return count;
  };

  // Check if hospital filter should be shown
  const shouldShowHospitalFilter = () => {
    return filters.appointmentType === 'in-person';
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by doctor name..."
            placeholderTextColor="#9CA3AF"
            value={filters.doctorName}
            onChangeText={(text) => setFilters(prev => ({ ...prev, doctorName: text }))}
          />
          {filters.doctorName.length > 0 && (
            <TouchableOpacity 
              onPress={() => setFilters(prev => ({ ...prev, doctorName: '' }))}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Filter Toggle Button */}
        <TouchableOpacity 
          style={[styles.filterButton, activeFiltersCount > 0 && styles.activeFilterButton]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter" size={18} color={activeFiltersCount > 0 ? "#fff" : "#008080"} />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Expandable Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          {/* Date Filter Section */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Date Filter</Text>
            
            {/* Date Filter Type Toggle */}
            <View style={styles.dateTypeToggle}>
              <TouchableOpacity
                style={[
                  styles.dateTypeButton,
                  filters.dateFilterType === 'single' && styles.activeDateTypeButton
                ]}
                onPress={() => setFilters(prev => ({ 
                  ...prev, 
                  dateFilterType: 'single',
                  startDate: null,
                  endDate: null
                }))}
              >
                <Text style={[
                  styles.dateTypeText,
                  filters.dateFilterType === 'single' && styles.activeDateTypeText
                ]}>
                  Single Date
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.dateTypeButton,
                  filters.dateFilterType === 'range' && styles.activeDateTypeButton
                ]}
                onPress={() => setFilters(prev => ({ 
                  ...prev, 
                  dateFilterType: 'range',
                  selectedDate: null
                }))}
              >
                <Text style={[
                  styles.dateTypeText,
                  filters.dateFilterType === 'range' && styles.activeDateTypeText
                ]}>
                  Date Range
                </Text>
              </TouchableOpacity>
            </View>

            {/* Single Date Picker */}
            {filters.dateFilterType === 'single' && (
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar" size={18} color="#008080" />
                <Text style={styles.dateButtonText}>
                  {filters.selectedDate 
                    ? format(filters.selectedDate, 'MMM dd, yyyy')
                    : 'Select Date'
                  }
                </Text>
              </TouchableOpacity>
            )}

            {/* Date Range Pickers */}
            {filters.dateFilterType === 'range' && (
              <View style={styles.dateRangeContainer}>
                <TouchableOpacity
                  style={[styles.dateButton, styles.halfWidth]}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Ionicons name="calendar" size={16} color="#008080" />
                  <Text style={[styles.dateButtonText, styles.smallDateText]}>
                    {filters.startDate 
                      ? format(filters.startDate, 'MMM dd')
                      : 'Start Date'
                    }
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.dateButton, styles.halfWidth]}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Ionicons name="calendar" size={16} color="#008080" />
                  <Text style={[styles.dateButtonText, styles.smallDateText]}>
                    {filters.endDate 
                      ? format(filters.endDate, 'MMM dd')
                      : 'End Date'
                    }
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Appointment Type Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Appointment Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={filters.appointmentType}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  appointmentType: value,
                  // Clear hospital name if switching away from in-person
                  hospitalName: value === 'in-person' ? prev.hospitalName : ''
                }))}
                style={styles.picker}
              >
                <Picker.Item label="All Types" value="" />
                <Picker.Item label="In-Person" value="in-person" />
                <Picker.Item label="Video Call" value="video" />
              </Picker>
            </View>
          </View>

          {/* Hospital Filter (only show for in-person appointments) */}
          {shouldShowHospitalFilter() && (
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Hospital</Text>
              {hospitals.length > 0 ? (
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={filters.hospitalName}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, hospitalName: value }))}
                    style={styles.picker}
                  >
                    <Picker.Item label="All Hospitals" value="" />
                    {hospitals.map((hospital, index) => (
                      <Picker.Item 
                        key={index} 
                        label={hospital.name || hospital} 
                        value={hospital.name || hospital} 
                      />
                    ))}
                  </Picker>
                </View>
              ) : (
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter hospital name..."
                  placeholderTextColor="#9CA3AF"
                  value={filters.hospitalName}
                  onChangeText={(text) => setFilters(prev => ({ ...prev, hospitalName: text }))}
                />
              )}
            </View>
          )}

          {/* Filter Actions */}
          <View style={styles.filterActions}>
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={clearAllFilters}
            >
              <Ionicons name="refresh" size={16} color="#6B7280" />
              <Text style={styles.clearFiltersText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Date Pickers */}
      {showDatePicker && (
        <DateTimePicker
          testID="datePicker"
          value={filters.selectedDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => handleDateChange(event, selectedDate, 'single')}
        />
      )}

      {showStartDatePicker && (
        <DateTimePicker
          testID="startDatePicker"
          value={filters.startDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => handleDateChange(event, selectedDate, 'start')}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          testID="endDatePicker"
          value={filters.endDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => handleDateChange(event, selectedDate, 'end')}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  clearButton: {
    marginLeft: 8,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#008080',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  activeFilterButton: {
    backgroundColor: '#008080',
    borderColor: '#008080',
  },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filtersContainer: {
    marginTop: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  dateTypeToggle: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
    padding: 2,
    marginBottom: 12,
  },
  dateTypeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  activeDateTypeButton: {
    backgroundColor: '#008080',
  },
  dateTypeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  activeDateTypeText: {
    color: 'white',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  halfWidth: {
    flex: 1,
    marginHorizontal: 4,
  },
  dateButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  smallDateText: {
    fontSize: 12,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#374151',
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#374151',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  clearFiltersText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default AppointmentFilters;