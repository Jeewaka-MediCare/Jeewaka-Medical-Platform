import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DoctorHeroSection = ({ doctor }) => {
  return (
    <View style={styles.heroSection}>
      <Image
        source={
          doctor?.profile 
            ? { uri: doctor.profile } 
            : require('../assets/images/doctor-placeholder.png')
        }
        style={styles.doctorImage}
        resizeMode="cover"
      />
      
      <View style={styles.heroOverlay}>
        <View style={styles.heroContent}>
          <Text style={styles.doctorName}>{doctor?.name || 'Unknown Doctor'}</Text>
          <Text style={styles.doctorSpecialty}>
            {doctor?.specialization || 'General Practice'}
            {(doctor?.subSpecializations && doctor.subSpecializations.length > 0) 
              ? ` • ${doctor.subSpecializations[0]}` 
              : ''
            }
          </Text>
          
          {/* Qualifications and Experience Badge */}
          {Boolean((doctor?.qualifications?.length || 0) > 0 || (doctor?.yearsOfExperience || 0) > 0) && (
            <View style={styles.credentialsBadge}>
              <Text style={styles.credentialsText}>
                {doctor?.qualifications?.length > 0 ? doctor.qualifications.join(', ') : 'General Practice'}
                {doctor?.yearsOfExperience 
                  ? ` • ${doctor.yearsOfExperience}+ years experience`
                  : ''
                }
              </Text>
            </View>
          )}
          
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={18} color="#FFD700" />
            <Text style={styles.ratingText}>
              {doctor?.avgRating?.toFixed(1) || '0.0'} ({doctor?.totalReviews || 0} reviews)
            </Text>
          </View>
          
          <View style={styles.feeContainer}>
            <Text style={styles.feeLabel}>Consultation Fee</Text>
            <Text style={styles.feeAmount}>LKR{doctor?.consultationFee?.toLocaleString() || '0'}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heroSection: {
    height: 280,
    position: 'relative',
  },
  doctorImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 16,
  },
  heroContent: {
    paddingHorizontal: 16,
  },
  doctorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  credentialsBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  credentialsText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 14,
  },
  feeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  feeLabel: {
    color: 'white',
    fontSize: 12,
    marginRight: 4,
  },
  feeAmount: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default DoctorHeroSection;