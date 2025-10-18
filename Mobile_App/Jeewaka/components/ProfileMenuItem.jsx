import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileMenuItem({ 
  icon, 
  title, 
  onPress,
  iconColor = '#1E293B',
  showChevron = true
}) {
  return (
    <TouchableOpacity 
      style={styles.menuItem}
      onPress={onPress}
    >
      <Ionicons name={icon} size={24} color={iconColor} />
      <Text style={styles.menuText}>{title}</Text>
      {showChevron && (
        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    marginLeft: 12,
  },
});