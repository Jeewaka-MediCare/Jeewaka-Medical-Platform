import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const DoctorTabNavigation = ({ selectedTab, onTabChange }) => {
  const tabs = [
    { key: 'about', label: 'About' },
    { key: 'sessions', label: 'Sessions' },
    { key: 'reviews', label: 'Reviews' }
  ];

  return (
    <View style={styles.tabsContainer}>
      {tabs.map((tab) => (
        <TouchableOpacity 
          key={tab.key}
          style={[styles.tabButton, selectedTab === tab.key && styles.activeTab]} 
          onPress={() => onTabChange(tab.key)}
        >
          <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabButton: {
    paddingVertical: 16,
    marginRight: 20,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#008080',
  },
  tabText: {
    fontSize: 16,
    color: '#64748B',
  },
  activeTabText: {
    fontWeight: '500',
    color: '#008080',
  },
});

export default DoctorTabNavigation;