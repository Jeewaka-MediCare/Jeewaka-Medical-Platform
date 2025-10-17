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
  const [allDoctors, setAllDoctors] = useState([]); // Store all doctors for filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchType, setSearchType] = useState('normal'); // Track if using AI search
  const [sidebarVisible, setSidebarVisible] = useState(false);
  
  const DOCTORS_PER_PAGE = 15;
  
  const [filters, setFilters] = useState({
    query: '',
    specialization: '',
    minFee: undefined,
    maxFee: undefined,
    minRating: undefined,
  });

  // Fetch doctors using normal search
  const fetchDoctors = async (searchFilters = {}, reset = true) => {
    if (reset) {
      setLoading(true);
      setCurrentPage(1);
      setDoctors([]);
    }
    setError(null);
    setSearchType('normal');
    
    try {
      let result;
      
      // Extract minRating for client-side filtering and remove from backend filters
      const { minRating, ...backendFilters } = searchFilters;
      
      // Check if we have any backend search filters
      const hasBackendFilters = Object.values(backendFilters).some(value => 
        value !== undefined && value !== '' && value !== null
      );
      
      if (hasBackendFilters) {
        // Use search endpoint for filtered results (without minRating)
        result = await DoctorSearchService.searchDoctors(backendFilters);
        // For search results, show all at once (no pagination)
        let doctors = result.doctors;
        
        // Apply client-side rating filtering if minRating is specified
        if (minRating && parseFloat(minRating) > 0) {
          console.log(`🌟 Applying client-side minimum rating filter: ${minRating}`);
          doctors = doctors.filter(doctor => {
            const avgRating = doctor.avgRating || 0;
            return avgRating >= parseFloat(minRating);
          });
          console.log(`✅ Rating filter applied: ${doctors.length} doctors match criteria (avg rating >= ${minRating})`);
        }
        
        setDoctors(doctors);
        setAllDoctors(doctors);
        setHasMore(false); // No pagination for search results
        console.log(`Loaded ${doctors.length} filtered doctors`);
      } else {
        // Get first page of all doctors
        result = await DoctorSearchService.getAllDoctors(1, DOCTORS_PER_PAGE);
        let doctors = result.doctors;
        
        // Apply client-side rating filtering if minRating is specified
        if (minRating && parseFloat(minRating) > 0) {
          console.log(`🌟 Applying client-side minimum rating filter: ${minRating}`);
          const filteredAll = result.allDoctors.filter(doctor => {
            const avgRating = doctor.avgRating || 0;
            return avgRating >= parseFloat(minRating);
          });
          setAllDoctors(filteredAll);
          doctors = filteredAll.slice(0, DOCTORS_PER_PAGE);
          setHasMore(filteredAll.length > DOCTORS_PER_PAGE);
          console.log(`✅ Rating filter applied: ${filteredAll.length} doctors match criteria (avg rating >= ${minRating})`);
        } else {
          setAllDoctors(result.allDoctors);
          setHasMore(result.hasMore);
        }
        
        setDoctors(doctors);
        console.log(`Loaded ${doctors.length} doctors (page 1)`);
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError('Failed to load doctors. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load more doctors (pagination)
  const loadMoreDoctors = async () => {
    if (loadingMore || !hasMore || searchType === 'ai') return;
    
    setLoadingMore(true);
    try {
      const nextPageNum = currentPage + 1;
      const startIndex = (nextPageNum - 1) * DOCTORS_PER_PAGE;
      const endIndex = startIndex + DOCTORS_PER_PAGE;
      
      // Get next batch from already loaded data
      const nextDoctors = allDoctors.slice(startIndex, endIndex);
      
      if (nextDoctors.length > 0) {
        setDoctors(prev => [...prev, ...nextDoctors]);
        setCurrentPage(nextPageNum);
        setHasMore(endIndex < allDoctors.length);
        
        console.log(`Loaded ${nextDoctors.length} more doctors (page ${nextPageNum})`);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more doctors:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle AI search
  const handleAISearch = async (aiSearchResult) => {
    setLoading(true);
    setError(null);
    setSearchType('ai');
    setCurrentPage(1);
    
    try {
      // Transform AI search results to match expected format
      const transformedDoctors = aiSearchResult.doctorCards.map(card => {
        console.log('AI Search Doctor Card:', {
          doctorId: card.doctor._id,
          doctorName: card.doctor.name,
          avgRating: card.ratingSummary.avgRating,
          totalReviews: card.ratingSummary.totalReviews
        });
        
        return {
          ...card.doctor,
          avgRating: card.ratingSummary.avgRating,
          totalReviews: card.ratingSummary.totalReviews,
          ratingSummary: card.ratingSummary,
          sessions: card.sessions,
          aiScore: card.doctor.score // Keep AI relevance score
        };
      });
      
      setDoctors(transformedDoctors);
      setAllDoctors(transformedDoctors);
      setHasMore(false); // No pagination for AI search results
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
            onLoadMore={loadMoreDoctors}
            hasMore={hasMore}
            loadingMore={loadingMore}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#008080']}
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
