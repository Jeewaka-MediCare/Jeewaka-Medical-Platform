import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../services/api';
import useAuthStore from '../store/authStore';

export default function DoctorDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [doctorData, setDoctorData] = useState(null);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDoctorData = async () => {
    if (!user?._id) return;
    
    try {
      console.log('Fetching doctor dashboard data for:', user._id);
      const { data } = await api.get(`/api/doctorCard/${user._id}`);
      setDoctorData(data.doctor);
      setRatingSummary(data.ratingSummary);
    } catch (error) {
      console.error('Failed to fetch doctor data:', error);
      Alert.alert('Error', 'Failed to load your profile data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, [user?._id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDoctorData();
  };

  const handleViewReviews = () => {
    if (doctorData?._id) {
      // Navigate to doctor details page with reviews tab selected
      router.push({
        pathname: `/doctor/${doctorData._id}`,
        params: { selectedTab: 'reviews' }
      });
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading && !doctorData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  const avgRating = ratingSummary?.avgRating || 0;
  const totalReviews = ratingSummary?.totalReviews || 0;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <View style={styles.welcomeContent}>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.doctorName}>{doctorData?.name || 'Doctor'}</Text>
          <Text style={styles.welcomeMessage}>Welcome to your dashboard</Text>
        </View>
        <Image 
          source={
            doctorData?.profile 
              ? { uri: doctorData.profile } 
              : require('../assets/images/doctor-placeholder.png')
          } 
          style={styles.profileImage} 
        />
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="star" size={24} color="#FFD700" />
          <Text style={styles.statValue}>{avgRating.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="comment-multiple" size={24} color="#2563EB" />
          <Text style={styles.statValue}>{totalReviews}</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="clock" size={24} color="#10B981" />
          <Text style={styles.statValue}>{doctorData?.yearsOfExperience || 0}</Text>
          <Text style={styles.statLabel}>Years Exp</Text>
        </View>
      </View>

      {/* Professional Information */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Professional Information</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="medical-bag" size={20} color="#2563EB" />
            <Text style={styles.infoLabel}>Specialization</Text>
          </View>
          <Text style={styles.infoValue}>
            {doctorData?.specialization || 'Not specified'}
          </Text>
          {doctorData?.subSpecializations && doctorData.subSpecializations.length > 0 && (
            <Text style={styles.subSpecText}>
              {doctorData.subSpecializations.join(', ')}
            </Text>
          )}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="certificate" size={20} color="#2563EB" />
            <Text style={styles.infoLabel}>Qualifications</Text>
          </View>
          <Text style={styles.infoValue}>
            {doctorData?.qualifications && doctorData.qualifications.length > 0 
              ? doctorData.qualifications.join(', ') 
              : 'Not specified'
            }
          </Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="card-account-details" size={20} color="#2563EB" />
            <Text style={styles.infoLabel}>Registration Number</Text>
          </View>
          <Text style={styles.infoValue}>
            {doctorData?.regNo || 'Not specified'}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="translate" size={20} color="#2563EB" />
            <Text style={styles.infoLabel}>Languages</Text>
          </View>
          <Text style={styles.infoValue}>
            {doctorData?.languagesSpoken && doctorData.languagesSpoken.length > 0 
              ? doctorData.languagesSpoken.join(', ') 
              : 'Not specified'
            }
          </Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="cash" size={20} color="#2563EB" />
            <Text style={styles.infoLabel}>Consultation Fee</Text>
          </View>
          <Text style={styles.infoValue}>
            LKR {doctorData?.consultationFee || 0}
          </Text>
        </View>
      </View>

      {/* About Section */}
      {doctorData?.bio && doctorData.bio.trim() && (
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.bioCard}>
            <Text style={styles.bioText}>{doctorData.bio}</Text>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionButton} onPress={handleViewReviews}>
          <MaterialCommunityIcons name="star-outline" size={24} color="#2563EB" />
          <Text style={styles.actionButtonText}>View Reviews</Text>
          <Ionicons name="chevron-forward" size={20} color="#64748B" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => router.push('/edit-profile')}
        >
          <MaterialCommunityIcons name="account-edit" size={24} color="#2563EB" />
          <Text style={styles.actionButtonText}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Bottom spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  welcomeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  welcomeContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 4,
  },
  doctorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  welcomeMessage: {
    fontSize: 14,
    color: '#64748B',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#E2E8F0',
  },
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
  infoSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginLeft: 12,
  },
  infoValue: {
    fontSize: 16,
    color: '#1E293B',
    lineHeight: 22,
  },
  subSpecText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    fontStyle: 'italic',
  },
  bioCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bioText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  actionsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
    marginLeft: 12,
  },
  bottomSpacing: {
    height: 20,
  },
});