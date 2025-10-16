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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import FilterSummary from './FilterSummary';

const SessionFilters = ({ 
  onFiltersChange, 
  onSectionChange, 
  currentSection,
  hospitals = [] 
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showHospitalDropdown, setShowHospitalDropdown] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    patientName: '',
    hospitalName: '',
    appointmentType: '', // 'in-person', 'video', or ''
    selectedDate: null,
    startDate: null,
    endDate: null,
    dateFilterType: 'single', // 'single', 'range'
  });

  // Hospital search state
  const [hospitalSearchText, setHospitalSearchText] = useState('');

  // Handle filter changes and notify parent
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters]);

  // Initialize hospital search text when hospital name changes
  useEffect(() => {
    if (filters.hospitalName !== hospitalSearchText) {
      setHospitalSearchText(filters.hospitalName);
    }
  }, [filters.hospitalName]);

  // Clear specific filter
  const clearSpecificFilter = (filterKey) => {
    const updatedFilters = { ...filters };
    
    switch (filterKey) {
      case 'patientName':
        updatedFilters.patientName = '';
        break;
      case 'hospitalName':
        updatedFilters.hospitalName = '';
        setHospitalSearchText('');
        setShowHospitalDropdown(false);
        break;
      case 'appointmentType':
        updatedFilters.appointmentType = '';
        updatedFilters.hospitalName = ''; // Clear hospital when type changes
        setHospitalSearchText('');
        setShowHospitalDropdown(false);
        break;
      case 'selectedDate':
        updatedFilters.selectedDate = null;
        break;
      case 'dateRange':
        updatedFilters.startDate = null;
        updatedFilters.endDate = null;
        break;
    }
    
    setFilters(updatedFilters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    const clearedFilters = {
      patientName: '',
      hospitalName: '',
      appointmentType: '',
      selectedDate: null,
      startDate: null,
      endDate: null,
      dateFilterType: 'single',
    };
    setFilters(clearedFilters);
    setHospitalSearchText('');
    setShowHospitalDropdown(false);
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
    if (filters.patientName.trim()) count++;
    if (filters.hospitalName.trim()) count++;
    if (filters.appointmentType) count++;
    if (filters.selectedDate || (filters.startDate && filters.endDate)) count++;
    return count;
  };

  // Check if hospital filter should be shown
  const shouldShowHospitalFilter = () => {
    return filters.appointmentType === 'in-person';
  };

  // Filter hospitals based on search text
  const filteredHospitals = hospitals.filter(hospital => 
    hospital.toLowerCase().includes(hospitalSearchText.toLowerCase())
  );

  // Handle hospital selection
  const handleHospitalSelect = (hospital) => {
    setFilters(prev => ({ ...prev, hospitalName: hospital }));
    setHospitalSearchText(hospital);
    setShowHospitalDropdown(false);
  };

  // Handle hospital search text change
  const handleHospitalSearchChange = (text) => {
    setHospitalSearchText(text);
    setFilters(prev => ({ ...prev, hospitalName: text }));
    setShowHospitalDropdown(text.length > 0 && filteredHospitals.length > 0);
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
            placeholder="Search by patient name..."
            placeholderTextColor="#9CA3AF"
            value={filters.patientName}
            onChangeText={(text) => setFilters(prev => ({ ...prev, patientName: text }))}
          />
          {filters.patientName.length > 0 && (
            <TouchableOpacity 
              onPress={() => setFilters(prev => ({ ...prev, patientName: '' }))}
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

      {/* Filter Summary */}
      <FilterSummary
        filters={filters}
        onClearFilter={clearSpecificFilter}
        onClearAll={clearAllFilters}
      />

      {/* Expandable Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <ScrollView 
            contentContainerStyle={styles.filtersContentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          
          {/* Hospital Filter - moved to top */}
          {shouldShowHospitalFilter() && (
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Hospital</Text>
              <View style={styles.hospitalInputContainer}>
                <TextInput
                  style={styles.hospitalInput}
                  value={hospitalSearchText}
                  onChangeText={handleHospitalSearchChange}
                  placeholder="Search hospitals..."
                  placeholderTextColor="#9CA3AF"
                  onFocus={() => {
                    if (filteredHospitals.length > 0) {
                      setShowHospitalDropdown(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding dropdown to allow for selection
                    setTimeout(() => setShowHospitalDropdown(false), 150);
                  }}
                />
                {hospitalSearchText.length > 0 && (
                  <TouchableOpacity 
                    onPress={() => {
                      setHospitalSearchText('');
                      setFilters(prev => ({ ...prev, hospitalName: '' }));
                      setShowHospitalDropdown(false);
                    }}
                    style={styles.clearHospitalButton}
                  >
                    <Ionicons name="close-circle" size={20} color="#64748B" />
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Hospital Dropdown */}
              {showHospitalDropdown && filteredHospitals.length > 0 && (
                <View style={styles.hospitalDropdown}>
                  {filteredHospitals.slice(0, 3).map((hospital, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.hospitalOption}
                      onPress={() => handleHospitalSelect(hospital)}
                    >
                      <Text style={styles.hospitalOptionText}>{hospital}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Appointment Type Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Appointment Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={filters.appointmentType}
                style={styles.picker}
                onValueChange={(value) => {
                  setFilters(prev => ({ 
                    ...prev, 
                    appointmentType: value,
                    hospitalName: value !== 'in-person' ? '' : prev.hospitalName
                  }));
                  if (value !== 'in-person') {
                    setHospitalSearchText('');
                    setShowHospitalDropdown(false);
                  }
                }}
              >
                <Picker.Item label="All Types" value="" />
                <Picker.Item label="In-Person" value="in-person" />
                <Picker.Item label="Video Call" value="video" />
              </Picker>
            </View>
          </View>

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
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={16} color="#008080" />
                <Text style={styles.datePickerText}>
                  {filters.selectedDate ? format(filters.selectedDate, 'MMM dd, yyyy') : 'Select Date'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Date Range Pickers */}
            {filters.dateFilterType === 'range' && (
              <View style={styles.dateRangeContainer}>
                <TouchableOpacity
                  style={[styles.datePickerButton, styles.dateRangeButton]}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={16} color="#008080" />
                  <Text style={styles.datePickerText}>
                    {filters.startDate ? format(filters.startDate, 'MMM dd') : 'Start Date'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.datePickerButton, styles.dateRangeButton]}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={16} color="#008080" />
                  <Text style={styles.datePickerText}>
                    {filters.endDate ? format(filters.endDate, 'MMM dd') : 'End Date'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          </ScrollView>
        </View>
      )}

      {/* Date Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={filters.selectedDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => handleDateChange(event, selectedDate, 'single')}
        />
      )}

      {showStartDatePicker && (
        <DateTimePicker
          value={filters.startDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => handleDateChange(event, selectedDate, 'start')}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
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
    backgroundColor: '#f8faff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1f2937',
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#008080',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeFilterButton: {
    backgroundColor: '#008080',
  },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  keyboardAvoidingView: {
    // Remove flex: 1 as it might be causing layout issues
  },
  filtersContainer: {
    backgroundColor: '#ffffff',
    margin: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    maxHeight: 400, // Limit height to make it scrollable
  },
  filtersContentContainer: {
    padding: 12,
  },
  filterSection: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  picker: {
    height: 44,
  },
  dateTypeToggle: {
    flexDirection: 'row',
    marginBottom: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 3,
  },
  dateTypeButton: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeDateTypeButton: {
    backgroundColor: '#008080',
  },
  dateTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeDateTypeText: {
    color: '#ffffff',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 6,
  },
  datePickerText: {
    fontSize: 16,
    color: '#1f2937',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dateRangeButton: {
    flex: 1,
  },
  // Hospital search styles
  hospitalInputContainer: {
    position: 'relative',
  },
  hospitalInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
    paddingRight: 40,
  },
  clearHospitalButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    padding: 2,
  },
  hospitalDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 120, // Reduced height to prevent keyboard overlap
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  hospitalOption: {
    paddingHorizontal: 12,
    paddingVertical: 8, // Reduced padding for more compact options
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  hospitalOptionText: {
    fontSize: 16,
    color: '#374151',
  },
});

export default SessionFilters;