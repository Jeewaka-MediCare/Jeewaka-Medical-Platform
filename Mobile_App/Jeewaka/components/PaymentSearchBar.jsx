import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentSearchBar({ 
  searchText, 
  onSearchChange, 
  onSearchSubmit,
  placeholder = "Enter doctor name, payment ID or amount"
}) {
  return (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Ionicons name="search-outline" size={20} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          value={searchText}
          onChangeText={onSearchChange}
          onSubmitEditing={onSearchSubmit}
          placeholderTextColor="#94A3B8"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1E293B',
  },
});