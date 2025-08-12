import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

export const SearchFilters = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [minFee, setMinFee] = useState('');
  const [maxFee, setMaxFee] = useState('');
  const [minRating, setMinRating] = useState('');

  const specializations = [
    { label: 'All Specializations', value: '' },
    { label: 'Cardiologist', value: 'Cardiologist' },
    { label: 'Dermatologist', value: 'Dermatologist' },
    { label: 'Neurologist', value: 'Neurologist' },
    { label: 'Pediatrician', value: 'Pediatrician' },
    { label: 'Psychiatrist', value: 'Psychiatrist' },
    { label: 'Orthopedic Surgeon', value: 'Orthopedic Surgeon' },
    { label: 'Gynecologist', value: 'Gynecologist' },
  ];

  const handleSearch = () => {
    onSearch({
      query: searchQuery,
      specialization,
      minFee: minFee ? parseInt(minFee) : undefined,
      maxFee: maxFee ? parseInt(maxFee) : undefined,
      minRating: minRating ? parseFloat(minRating) : undefined,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="Search doctors"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
      </View>
      
      <TouchableOpacity 
        style={styles.filterButton}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Ionicons name="filter" size={20} color="#2563EB" />
        <Text style={styles.filterText}>Filters</Text>
      </TouchableOpacity>
      
      {showFilters && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filterLabel}>Specialization</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={specialization}
              onValueChange={(itemValue) => setSpecialization(itemValue)}
              style={styles.picker}
            >
              {specializations.map((item, index) => (
                <Picker.Item key={index} label={item.label} value={item.value} />
              ))}
            </Picker>
          </View>
          
          <View style={styles.feeContainer}>
            <View style={styles.feeField}>
              <Text style={styles.filterLabel}>Min Fee</Text>
              <TextInput
                style={styles.feeInput}
                placeholder="Min"
                value={minFee}
                onChangeText={setMinFee}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.feeField}>
              <Text style={styles.filterLabel}>Max Fee</Text>
              <TextInput
                style={styles.feeInput}
                placeholder="Max"
                value={maxFee}
                onChangeText={setMaxFee}
                keyboardType="numeric"
              />
            </View>
          </View>
          
          <Text style={styles.filterLabel}>Minimum Rating</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <TouchableOpacity
                key={rating}
                style={styles.ratingButton}
                onPress={() => setMinRating(rating.toString())}
              >
                <AntDesign
                  name={parseFloat(minRating) >= rating ? "star" : "staro"}
                  size={24}
                  color={parseFloat(minRating) >= rating ? "#FFD700" : "#64748B"}
                />
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleSearch}
          >
            <Text style={styles.applyText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#2563EB',
  },
  filtersContainer: {
    marginTop: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: 'white',
  },
  picker: {
    height: 50,
  },
  feeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  feeField: {
    width: '48%',
  },
  feeInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 8,
    backgroundColor: 'white',
    fontSize: 14,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  ratingButton: {
    marginRight: 8,
  },
  applyButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  applyText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
