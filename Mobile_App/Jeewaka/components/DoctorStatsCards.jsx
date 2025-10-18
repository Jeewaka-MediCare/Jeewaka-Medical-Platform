import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DoctorStatsCards({ 
  avgRating, 
  totalReviews, 
  yearsOfExperience 
}) {
  return (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <MaterialCommunityIcons name="star" size={24} color="#FFD700" />
        <Text style={styles.statValue}>{avgRating.toFixed(1)}</Text>
        <Text style={styles.statLabel}>Rating</Text>
      </View>
      <View style={styles.statCard}>
        <MaterialCommunityIcons name="comment-multiple" size={24} color="#008080" />
        <Text style={styles.statValue}>{totalReviews}</Text>
        <Text style={styles.statLabel}>Reviews</Text>
      </View>
      <View style={styles.statCard}>
        <MaterialCommunityIcons name="clock" size={24} color="#10B981" />
        <Text style={styles.statValue}>{yearsOfExperience || 0}</Text>
        <Text style={styles.statLabel}>Years Exp</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});