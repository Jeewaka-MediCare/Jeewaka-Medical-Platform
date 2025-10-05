import React from 'react';
import { FlatList, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { DoctorCard } from './DoctorCard';

export const DoctorList = ({ doctors, loading, error }) => {
  console.log('DoctorList received:', { doctorsCount: doctors?.length, loading, error });
  
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          {error}
        </Text>
      </View>
    );
  }

  if (!doctors || doctors.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>
          No doctors found
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={doctors}
      keyExtractor={(item) => item._id.toString()}
      renderItem={({ item }) => {
        console.log(`DoctorList rendering ${item.name}: avgRating=${item.avgRating}, totalReviews=${item.totalReviews}`);
        return (
          <DoctorCard
            id={item._id}
            name={item.name}
            specialization={item.specialization}
            profile={item.profile} // Backend uses 'profile' not 'profilePicture'
            consultationFee={item.consultationFee || 0}
            avgRating={item.avgRating || item.ratingSummary?.avgRating || 0}
            totalReviews={item.totalReviews || item.ratingSummary?.totalReviews || 0}
            doctor={item}
            ratingSummary={item.ratingSummary}
            sessions={item.sessions}
          />
        );
      }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContainer}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingVertical: 8,
    paddingBottom: 20,
  },
  separator: {
    height: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
});
