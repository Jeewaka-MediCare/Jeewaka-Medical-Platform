import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import EnhancedSearchFilters from '../../components/EnhancedSearchFilters';
import { DoctorList } from '../../components/DoctorList';
import DoctorSearchService from '../../services/doctorSearchService';
import useAuthStore from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { debugNetworkInfo } from '../../services/networkTest';
import UserDropdown from '../../components/UserSidebar';
import DoctorDashboard from '../../components/DoctorDashboard';
import LandingPage from '../../components/LandingPage';

export default function Home() {
  const { user, userRole, loading: authLoading, logout } = useAuthStore();
  const router = useRouter();
  
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchType, setSearchType] = useState('normal'); // Track if using AI search
  const [sidebarVisible, setSidebarVisible] = useState(false);
  
  const [filters, setFilters] = useState({
    query: '',
    specialization: '',
    minFee: undefined,
    maxFee: undefined,
    minRating: undefined,
  });

  // Fetch doctors using normal search
  const fetchDoctors = async (searchFilters = {}) => {
    setLoading(true);
    setError(null);
    setSearchType('normal');
    
    try {
      let result;
      
      // Check if we have any search filters
      const hasFilters = Object.values(searchFilters).some(value => 
        value !== undefined && value !== '' && value !== null
      );
      
      if (hasFilters) {
        // Use search endpoint for filtered results
        result = await DoctorSearchService.searchDoctors(searchFilters);
        setDoctors(result.doctors);
      } else {
        // Get all doctors
        result = await DoctorSearchService.getAllDoctors();
        setDoctors(result.doctors);
      }
      
      console.log(`Loaded ${result.doctors.length} doctors`);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError('Failed to load doctors. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle AI search
  const handleAISearch = async (aiSearchResult) => {
    setLoading(true);
    setError(null);
    setSearchType('ai');
    
    try {
      // Transform AI search results to match expected format
      const transformedDoctors = aiSearchResult.doctorCards.map(card => ({
        ...card.doctor,
        avgRating: card.ratingSummary.avgRating,
        totalReviews: card.ratingSummary.totalReviews,
        ratingSummary: card.ratingSummary,
        sessions: card.sessions,
        aiScore: card.doctor.score // Keep AI relevance score
      }));
      
      setDoctors(transformedDoctors);
      console.log(`AI Search found ${transformedDoctors.length} doctors for query: "${aiSearchResult.query}"`);
    } catch (err) {
      console.error('Error processing AI search results:', err);
      setError('Failed to process AI search results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load doctors on component mount - ONLY for patients
  useEffect(() => {
    debugNetworkInfo(); // Debug network configuration
    
    // Only fetch doctors if user is a patient (not doctor, not logged out)
    if (user && userRole === 'patient') {
      fetchDoctors();
    }
  }, [user, userRole]); // Add user as dependency to handle login/logout

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

  // Toggle sidebar visibility
  const handleMenuPress = () => {
    setSidebarVisible(true);
  };

  const handleCloseSidebar = () => {
    setSidebarVisible(false);
  };

  const handleLogin = () => {
    setSidebarVisible(false);
    router.push('/login');
  };

  const handleLogout = async () => {
    setSidebarVisible(false);
    await logout();
    // Stay on current page (index.jsx) which will show LandingPage for logged-out users
    // Removed: router.push('/login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Jeewaka',
          headerShown: true,
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
          headerRight: () => (
            <TouchableOpacity onPress={handleMenuPress} style={styles.profileButton}>
              <Ionicons name="menu" size={28} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      
      {/* Conditional rendering based on user authentication and role */}
      {!user ? (
        // User is logged out - show landing page
        <LandingPage />
      ) : userRole === 'doctor' ? (
        // User is a doctor - show doctor dashboard
        <DoctorDashboard />
      ) : (
        // User is a patient - show doctor list
        <View style={styles.content}>
          <EnhancedSearchFilters 
            onSearch={handleSearch} 
            onAISearch={handleAISearch}
          />
          
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              {searchType === 'ai' ? 'AI Search Results' : 'Find Doctors'}
            </Text>
            <Text style={styles.subtitle}>
              {searchType === 'ai' 
                ? 'Results based on your symptoms and needs' 
                : 'Book appointments with top specialists'
              }
            </Text>
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
      )}
      
      <UserDropdown
        visible={sidebarVisible}
        onClose={handleCloseSidebar}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
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
