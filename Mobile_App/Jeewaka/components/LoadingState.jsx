import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default function LoadingState({ 
  text = 'Loading...',
  showIndicator = true,
  size = 'large',
  color = '#008080'
}) {
  return (
    <View style={styles.loadingContainer}>
      {showIndicator && (
        <ActivityIndicator 
          size={size} 
          color={color}
          style={styles.indicator}
        />
      )}
      <Text style={styles.loadingText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  indicator: {
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
});