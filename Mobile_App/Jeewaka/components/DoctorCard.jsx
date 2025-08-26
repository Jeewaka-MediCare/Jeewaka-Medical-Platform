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
  
  // Extract additional data from doctor object
  const yearsOfExperience = doctor?.yearsOfExperience || 0;
  const qualifications = doctor?.qualifications || [];
  const subSpecializations = doctor?.subSpecializations || [];
  const languagesSpoken = doctor?.languagesSpoken || [];
  const bio = doctor?.bio || '';
  
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
      {/* Header with Profile and Basic Info */}
      <View style={styles.headerContainer}>
        <View style={styles.profileContainer}>
          <Image 
            source={profile ? { uri: profile } : require('../assets/images/doctor-placeholder.png')}
            style={styles.profileImage}
            resizeMode="cover"
          />
          <View style={styles.statusIndicator} />
        </View>
        
        <View style={styles.basicInfo}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.specialization} numberOfLines={1}>
            {specialization}
            {subSpecializations.length > 0 && ` • ${subSpecializations[0]}`}
          </Text>
          
          {/* Qualifications and Experience */}
          <View style={styles.credentialsContainer}>
            <Text style={styles.qualifications} numberOfLines={1}>
              {qualifications.join(', ')} • {yearsOfExperience}+ years exp
            </Text>
          </View>
          
          <View style={styles.ratingContainer}>
            <AntDesign name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{avgRating?.toFixed(1) || '0.0'}</Text>
            <Text style={styles.reviewsText}>({totalReviews || 0})</Text>
          </View>
        </View>

        <View style={styles.feeContainer}>
          <Text style={styles.feeLabel}>Fee</Text>
          <Text style={styles.feeAmount}>${consultationFee?.toLocaleString() || '0'}</Text>
        </View>
      </View>

      {/* Bio Section - if available */}
      {bio && bio.trim() && (
        <View style={styles.bioSection}>
          <Text style={styles.bioText} numberOfLines={2}>
            {bio}
          </Text>
        </View>
      )}

      {/* Enhanced Info Section */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <AntDesign name="team" size={14} color="#64748B" />
            <Text style={styles.infoText}>
              {languagesSpoken.length > 0 ? languagesSpoken.join(', ') : 'English'}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <AntDesign name="clockcircleo" size={14} color="#64748B" />
            <Text style={styles.infoText}>Available Today</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <AntDesign name="enviromento" size={14} color="#64748B" />
            <Text style={styles.infoText}>In-person & Online</Text>
          </View>
          
          <View style={styles.infoItem}>
            <AntDesign name="Safety" size={14} color="#64748B" />
            <Text style={styles.infoText}>Verified Doctor</Text>
          </View>
        </View>
      </View>

      {/* Action Footer */}
      <View style={styles.footer}>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.secondaryButton}>
            <AntDesign name="message1" size={16} color="#2563EB" />
            <Text style={styles.secondaryButtonText}>Message</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.primaryButton}>
            <AntDesign name="calendar" size={16} color="#fff" />
            <Text style={styles.primaryButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
  },
  headerContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  profileContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#E2E8F0',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: 'white',
  },
  basicInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  specialization: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '500',
  },
  credentialsContainer: {
    marginBottom: 6,
  },
  qualifications: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    color: '#1E293B',
  },
  reviewsText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  feeContainer: {
    alignItems: 'flex-end',
  },
  feeLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  feeAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563EB',
  },
  bioSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  bioText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 6,
    fontWeight: '500',
    flex: 1,
  },
  footer: {
    padding: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563EB',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    marginLeft: 6,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 6,
  },
});
