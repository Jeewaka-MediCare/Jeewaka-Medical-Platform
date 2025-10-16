import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import ReviewsComponent from '../components/ReviewsComponent';

export default function DoctorReviews() {
  const { doctorId } = useLocalSearchParams();
  const router = useRouter();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDoctorReviews = async () => {
    if (!doctorId) {
      Alert.alert('Error', 'Doctor ID not provided');
      router.back();
      return;
    }
    
    try {
      console.log('Fetching doctor reviews for ID:', doctorId);
      const { data } = await api.get(`/api/doctorCard/${doctorId}`);
      
      // Fetch reviews separately from the ratings API
      let reviews = [];
      try {
        const reviewsResponse = await api.get(`/api/ratings/doctor/${doctorId}`);
        reviews = reviewsResponse.data || [];
        console.log('Reviews fetched:', reviews.length);
      } catch (reviewError) {
        console.error('Failed to fetch reviews:', reviewError);
        reviews = [];
      }

      // Merge doctor data with reviews
      const doctorWithReviews = {
        ...data.doctor,
        reviews: reviews,
        avgRating: data.ratingSummary?.avgRating || 0,
        totalReviews: data.ratingSummary?.totalReviews || 0
      };

      setDoctor(doctorWithReviews);
    } catch (error) {
      console.error('Failed to fetch doctor data:', error);
      Alert.alert('Error', 'Failed to load reviews');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDoctorReviews();
  }, [doctorId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDoctorReviews();
  };

  if (loading && !doctor) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{
            title: 'Reviews',
            headerShown: true,
            headerBackTitle: 'Back',
          headerStyle: {
            backgroundColor: '#1E293B',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          headerTitleStyle: {
            color: 'white',
            fontSize: 20,
            fontWeight: '600',
          },
          headerTintColor: 'white',
          }} 
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: `Reviews - ${doctor?.name || 'Doctor'}`,
          headerShown: true,
          headerBackTitle: 'Back',
          headerStyle: {
            backgroundColor: '#1E293B',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          headerTitleStyle: {
            color: 'white',
            fontSize: 20,
            fontWeight: '600',
          },
          headerTintColor: 'white',
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          <ReviewsComponent doctor={doctor} showRatingSummary={true} />
        </View>
      </ScrollView>
    </SafeAreaView>
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
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
});