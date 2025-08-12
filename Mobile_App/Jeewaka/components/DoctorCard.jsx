import React from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';

export const DoctorCard = ({ 
  id, 
  name, 
  specialization, 
  profile, 
  consultationFee, 
  avgRating, 
  totalReviews,
  doctor,
  ratingSummary,
  sessions
}) => {
  const router = useRouter();
  
  const handlePress = () => {
    router.push({
      pathname: `/doctor/${id}`,
      params: {
        doctorData: JSON.stringify({
          doctor,
          ratingSummary,
          sessions
        })
      }
    });
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={profile ? { uri: profile } : require('../assets/images/doctor-placeholder.png')}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.feeContainer}>
          <Text style={styles.feeText}>${consultationFee?.toLocaleString()}</Text>
        </View>
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.specialization}>{specialization}</Text>
        
        <View style={styles.ratingContainer}>
          <AntDesign name="star" size={16} color="#FFD700" />
          <Text style={styles.ratingText}>{avgRating?.toFixed(1) || '0.0'}</Text>
          <Text style={styles.reviewsText}>({totalReviews || 0} reviews)</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    height: 160,
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  feeContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2563EB',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderTopLeftRadius: 8,
  },
  feeText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  contentContainer: {
    padding: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  specialization: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 4,
  },
});
