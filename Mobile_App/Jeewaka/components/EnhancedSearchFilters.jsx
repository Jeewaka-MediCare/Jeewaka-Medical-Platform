import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DoctorSearchService from '../services/doctorSearchService';

export const EnhancedSearchFilters = ({ onSearch, onAISearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [minFee, setMinFee] = useState('');
  const [maxFee, setMaxFee] = useState('');
  const [minRating, setMinRating] = useState('');
  const [searchType, setSearchType] = useState('normal'); // 'normal' or 'ai'
  
  // AI search features
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  // Filter options from backend
  const [filterOptions, setFilterOptions] = useState({
    specializations: [],
    subSpecializations: [],
    languages: [],
    experienceRange: { min: 0, max: 30 },
    feeRange: { min: 0, max: 50000 }
  });

  // Load filter options on component mount
  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const options = await DoctorSearchService.getFilterOptions();
      setFilterOptions(options);
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  // Handle search suggestions as user types
  useEffect(() => {
    if (searchType === 'ai' && searchQuery.length >= 2) {
      const debounceTimer = setTimeout(() => {
        loadSearchSuggestions(searchQuery);
      }, 300);
      
      return () => clearTimeout(debounceTimer);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, searchType]);

  const loadSearchSuggestions = async (query) => {
    setLoadingSuggestions(true);
    try {
      const result = await DoctorSearchService.getSearchSuggestions(query);
      setSuggestions(result.suggestions);
      setShowSuggestions(result.suggestions.length > 0);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleNormalSearch = () => {
    const filters = {
      name: searchQuery, // Backend expects 'name' parameter for doctor name search
      specialization,
      minFee: minFee ? parseInt(minFee) : undefined,
      maxFee: maxFee ? parseInt(maxFee) : undefined,
      minRating: minRating ? parseFloat(minRating) : undefined,
    };
    
    onSearch(filters);
    setShowSuggestions(false);
  };

  const handleAISearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a search query');
      return;
    }

    try {
      const result = await DoctorSearchService.aiSearchDoctors(searchQuery);
      onAISearch(result);
      setShowSuggestions(false);
    } catch (error) {
      Alert.alert('Search Error', error.message);
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    // Auto-trigger AI search when suggestion is selected
    setTimeout(() => {
      handleAISearch();
    }, 100);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSpecialization('');
    setMinFee('');
    setMaxFee('');
    setMinRating('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSearchType('normal');
    onSearch({}); // Trigger search with empty filters to reset
  };

  const handleSearchTypeChange = (type) => {
    if (type !== searchType) {
      setSearchQuery(''); // Clear input field when switching search types
      setShowSuggestions(false);
      setSuggestions([]);
    }
    setSearchType(type);
  };

  const renderSuggestion = ({ item }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionSelect(item)}
    >
      <Ionicons name="search" size={16} color="#64748B" style={styles.suggestionIcon} />
      <Text style={styles.suggestionText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Type Toggle */}
      <View style={styles.searchTypeContainer}>
        <TouchableOpacity
          style={[
            styles.searchTypeButton,
            searchType === 'normal' ? styles.activeSearchType : styles.inactiveSearchType
          ]}
          onPress={() => handleSearchTypeChange('normal')}
        >
          <Text style={[
            styles.searchTypeText,
            searchType === 'normal' ? styles.activeSearchTypeText : styles.inactiveSearchTypeText
          ]}>
            Normal Search
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.searchTypeButton,
            searchType === 'ai' ? styles.activeSearchType : styles.inactiveSearchType
          ]}
          onPress={() => handleSearchTypeChange('ai')}
        >
          <Text style={[
            styles.searchTypeText,
            searchType === 'ai' ? styles.activeSearchTypeText : styles.inactiveSearchTypeText
          ]}>
            AI Search
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder={
            searchType === 'ai' 
              ? "Describe your symptoms or needs..." 
              : "Search doctors by name..."
          }
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={searchType === 'ai' ? handleAISearch : handleNormalSearch}
          multiline={searchType === 'ai'}
          numberOfLines={searchType === 'ai' ? 2 : 1}
        />
        
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* AI Search Suggestions */}
      {searchType === 'ai' && showSuggestions && (
        <View style={styles.suggestionsContainer}>
          {loadingSuggestions ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#008080" />
              <Text style={styles.loadingText}>Getting suggestions...</Text>
            </View>
          ) : (
            <FlatList
              data={suggestions}
              renderItem={renderSuggestion}
              keyExtractor={(item, index) => index.toString()}
              style={styles.suggestionsList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}

      {/* Search Buttons */}
      <View style={styles.buttonContainer}>
        {searchType === 'ai' ? (
          <TouchableOpacity
            style={[styles.searchButton, styles.aiSearchButton]}
            onPress={handleAISearch}
            disabled={!searchQuery.trim()}
          >
            <Ionicons name="sparkles" size={18} color="white" />
            <Text style={styles.searchButtonText}>AI Search</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleNormalSearch}
          >
            <Ionicons name="search" size={18} color="white" />
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        )}
        
        {searchType === 'normal' && (
          <TouchableOpacity 
            style={styles.filterToggleButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="filter" size={18} color="#008080" />
            <Text style={styles.filterToggleText}>Filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Normal Search Filters */}
      {searchType === 'normal' && showFilters && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filterLabel}>Specialization</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={specialization}
              onValueChange={(itemValue) => setSpecialization(itemValue)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item 
                label="All Specializations" 
                value="" 
                style={styles.pickerItemStyle}
              />
              {filterOptions.specializations.map((spec, index) => (
                <Picker.Item 
                  key={index} 
                  label={spec} 
                  value={spec}
                  style={styles.pickerItemStyle}
                />
              ))}
            </Picker>
          </View>
          
          <View style={styles.feeContainer}>
            <View style={styles.feeField}>
              <Text style={styles.filterLabel}>Min Fee</Text>
              <TextInput
                style={styles.feeInput}
                placeholder="Min"
                placeholderTextColor="#9CA3AF"
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
                placeholderTextColor="#9CA3AF"
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
          
          <View style={styles.filterButtonsContainer}>
            <TouchableOpacity
              style={[styles.filterActionButton, styles.clearFiltersButton]}
              onPress={clearSearch}
            >
              <Ionicons name="refresh" size={16} color="#6B7280" />
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.filterActionButton, styles.applyButton]}
              onPress={handleNormalSearch}
            >
              <Text style={styles.applyText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchTypeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 3,
  },
  searchTypeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeSearchType: {
    backgroundColor: '#008080',
  },
  inactiveSearchType: {
    backgroundColor: 'transparent',
  },
  searchTypeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeSearchTypeText: {
    color: 'white',
  },
  inactiveSearchTypeText: {
    color: '#64748B',
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
    minHeight: 40,
    fontSize: 16,
    paddingVertical: 8,
  },
  clearButton: {
    marginLeft: 8,
  },
  suggestionsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginBottom: 12,
    maxHeight: 150,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: '#64748B',
    fontSize: 14,
  },
  suggestionsList: {
    maxHeight: 120,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  suggestionIcon: {
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#1E293B',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#008080',
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 8,
    minWidth: 100,
  },
  aiSearchButton: {
    backgroundColor: '#06c2c2ff',
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  filterToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#008080',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 90,
  },
  filterToggleText: {
    color: '#008080',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  filtersContainer: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#1F2937',
    backgroundColor: 'white',
  },
  pickerItem: {
    color: '#1F2937',
    fontSize: 16,
  },
  pickerItemStyle: {
    color: '#1F2937',
    backgroundColor: 'white',
  },
  feeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  feeField: {
    flex: 1,
    marginHorizontal: 4,
  },
  feeInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  ratingButton: {
    padding: 8,
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  filterActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingVertical: 8,
  },
  clearFiltersButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 8,
  },
  clearFiltersText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  applyButton: {
    backgroundColor: '#008080',
  },
  applyText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default EnhancedSearchFilters;