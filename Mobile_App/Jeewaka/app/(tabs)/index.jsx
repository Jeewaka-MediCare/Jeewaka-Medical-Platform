import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { SearchFilters } from '../../components/SearchFilters';
import { DoctorList } from '../../components/DoctorList';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { debugNetworkInfo } from '../../services/networkTest';

export default function Home() {
  const { user, userRole, loading: authLoading } = useAuthStore();
  const router = useRouter();
  
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const [filters, setFilters] = useState({
    query: '',
    specialization: '',
    minFee: undefined,
    maxFee: undefined,
    minRating: undefined,
  });

  // Fetch doctors
  const fetchDoctors = async (searchFilters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if we have any search filters
      const hasFilters = searchFilters.query || searchFilters.specialization || 
                        searchFilters.minFee || searchFilters.maxFee || searchFilters.minRating;
      
      let response;
      let doctorsData;
      
      if (hasFilters) {
        // Use search endpoint for filtered results
        let url = '/api/doctor/search';
        const queryParams = [];
        if (searchFilters.query) queryParams.push(`name=${encodeURIComponent(searchFilters.query)}`);
        if (searchFilters.specialization) queryParams.push(`specialization=${encodeURIComponent(searchFilters.specialization)}`);
        if (searchFilters.minFee) queryParams.push(`minFee=${searchFilters.minFee}`);
        if (searchFilters.maxFee) queryParams.push(`maxFee=${searchFilters.maxFee}`);
        if (searchFilters.minRating) queryParams.push(`minRating=${searchFilters.minRating}`);
        
        if (queryParams.length > 0) {
          url = `${url}?${queryParams.join('&')}`;
        }
        
        response = await api.get(url);
        doctorsData = response.data?.data?.doctors || [];
        
        // For search results, we need to get rating data separately using the ratings API
        const doctorsWithRatings = await Promise.all(
          doctorsData.map(async (doctor) => {
            try {
              // Get rating data from the dedicated ratings endpoint
              const ratingResponse = await api.get(`/api/ratings/doctor/${doctor._id}/average`);
              return {
                ...doctor,
                avgRating: ratingResponse.data.avgRating || 0,
                totalReviews: ratingResponse.data.totalReviews || 0,
                ratingSummary: { 
                  avgRating: ratingResponse.data.avgRating || 0, 
                  totalReviews: ratingResponse.data.totalReviews || 0 
                },
                sessions: [] // We don't need sessions for the listing
              };
            } catch (error) {
              console.error(`Error fetching rating data for doctor ${doctor._id}:`, error);
              return {
                ...doctor,
                avgRating: 0,
                totalReviews: 0,
                ratingSummary: { avgRating: 0, totalReviews: 0 },
                sessions: []
              };
            }
          })
        );
        
        setDoctors(doctorsWithRatings);
      } else {
        // Get all doctors first
        response = await api.get('/api/doctor');
        doctorsData = response.data || [];
        
        // Fetch rating data for each doctor using the ratings API
        const doctorsWithRatings = await Promise.all(
          doctorsData.map(async (doctor) => {
            try {
              const ratingResponse = await api.get(`/api/ratings/doctor/${doctor._id}/average`);
              return {
                ...doctor,
                avgRating: ratingResponse.data.avgRating || 0,
                totalReviews: ratingResponse.data.totalReviews || 0,
                ratingSummary: { 
                  avgRating: ratingResponse.data.avgRating || 0, 
                  totalReviews: ratingResponse.data.totalReviews || 0 
                },
                sessions: [] // We don't need sessions for the listing
              };
            } catch (error) {
              console.error(`Error fetching rating data for doctor ${doctor._id}:`, error);
              return {
                ...doctor,
                avgRating: 0,
                totalReviews: 0,
                ratingSummary: { avgRating: 0, totalReviews: 0 },
                sessions: []
              };
            }
          })
        );
        
        setDoctors(doctorsWithRatings);
        console.log('Doctors loaded with ratings:', doctorsWithRatings.map(d => 
          `${d.name}: ${d.avgRating} (${d.totalReviews} reviews)`
        ).join(', '));
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
      console.error('Error response:', err.response?.data);
      setError('Failed to load doctors. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load doctors on component mount
  useEffect(() => {
    debugNetworkInfo(); // Debug network configuration
    fetchDoctors();
  }, []);

  // Handle filter search
  const handleSearch = (newFilters) => {
    setFilters(newFilters);
    fetchDoctors(newFilters);
  };

  // Pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchDoctors(filters);
  };

  // Navigate to profile/login based on auth state
  const handleProfilePress = () => {
    if (user) {
      if (userRole === 'doctor') {
        router.push('/appointments');  // Changed from doctor-dashboard to appointments tab
      } else {
        router.push('/(tabs)/appointments');  // Updated to use new appointments tab
      }
    } else {
      router.push('/login');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Jeewaka',
          headerStyle: {
            backgroundColor: '#2563EB',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerRight: () => (
            <TouchableOpacity onPress={handleProfilePress} style={styles.profileButton}>
              <Ionicons name="person-circle" size={28} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      
      <View style={styles.content}>
        <SearchFilters onSearch={handleSearch} />
        
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Find Doctors</Text>
          <Text style={styles.subtitle}>Book appointments with top specialists</Text>
        </View>
        
        <DoctorList 
          doctors={doctors} 
          loading={loading} 
          error={error} 
          refreshControl={
            <RefreshControl 
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2563EB']}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 4,
  },
  profileButton: {
    marginRight: 12,
  },
});
