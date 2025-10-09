import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import api from '../services/api';
import useAuthStore from '../store/authStore';

export default function DoctorDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [doctorData, setDoctorData] = useState(null);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [recentReviews, setRecentReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation values for floating reviews
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50)); // Start 50 pixels below
  const [scrollAnim] = useState(new Animated.Value(0)); // For continuous scrolling animation

  // Mock reviews for testing
  const mockReviews = [
    {
      patient: { name: 'John Doe' },
      rating: 5,
      comment: 'Excellent doctor! Very professional and caring. Highly recommend for orthopedic treatments.',
      createdAt: new Date().toISOString()
    },
    {
      patient: { name: 'Jane Smith' },
      rating: 4,
      comment: 'Great experience. Dr. Priya explained everything clearly and the treatment was effective.',
      createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    }
  ];

  // Function to start continuous scrolling animation
  const startContinuousScroll = (reviewCount) => {
    console.log('Starting continuous scroll for', reviewCount, 'reviews');
    if (reviewCount === 0) return;
    
    const cardWidth = 290; // Card width (280) + margin (10)
    const totalWidth = cardWidth * reviewCount;
    
    const scrollSequence = () => {
      scrollAnim.setValue(0);
      console.log('Scrolling to:', -totalWidth);
      Animated.timing(scrollAnim, {
        toValue: -totalWidth,
        duration: reviewCount * 4000, // 4 seconds per card
        useNativeDriver: true,
      }).start(() => {
        // Reset and restart the animation
        console.log('Animation completed, restarting...');
        scrollSequence();
      });
    };
    
    scrollSequence();
  };

  const fetchDoctorData = async () => {
    if (!user?._id) return;
    
    try {
      console.log('Fetching doctor dashboard data for:', user._id);
      const { data } = await api.get(`/api/doctorCard/${user._id}`);
      setDoctorData(data.doctor);
      setRatingSummary(data.ratingSummary);
      
      // Fetch recent reviews
      try {
        const reviewsResponse = await api.get(`/api/ratings/doctor/${user._id}`);
        const reviews = reviewsResponse.data || [];
        // Get the 10 most recent reviews
        const sortedReviews = reviews
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10);
        setRecentReviews(sortedReviews);
        console.log('Reviews set:', sortedReviews.length);
        
        // For testing: Always use mock reviews to ensure animation works
        // Comment out this section when you have real reviews
        if (sortedReviews.length === 0) {
          setRecentReviews(mockReviews);
          console.log('Set mock reviews for testing');
        }
      } catch (reviewError) {
        console.error('Failed to fetch reviews:', reviewError);
        // Set mock reviews for testing even on error
        setRecentReviews(mockReviews);
      }
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

  // Separate useEffect to handle animations when reviews change
  useEffect(() => {
    if (recentReviews.length > 0) {
      // Start animation when reviews are available
      console.log('Starting reviews section animation for', recentReviews.length, 'reviews');
      
      // Reset animation values
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start(() => {
          console.log('Animation completed');
          // Start continuous scrolling after fade-in completes
          setTimeout(() => {
            startContinuousScroll(recentReviews.length);
          }, 2000); // Wait 2 seconds before starting scroll
        });
      }, 1000);
    }
  }, [recentReviews]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDoctorData();
  };

  const handleViewReviews = () => {
    if (doctorData?._id) {
      // Navigate to dedicated reviews page
      router.push({
        pathname: '/doctor-reviews',
        params: { doctorId: doctorData._id }
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
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
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

      {/* Recent Reviews Section */}
      <Animated.View 
        style={[
          styles.reviewsSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.reviewsSectionHeader}>
          <MaterialCommunityIcons name="star" size={24} color="#FFD700" />
          <Text style={styles.reviewsSectionTitle}>Recent Reviews</Text>
          <TouchableOpacity onPress={handleViewReviews}>
            <Text style={styles.viewAllReviewsButton}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {recentReviews.length > 0 ? (
          <View style={styles.reviewsContainer}>
            <Animated.View
              style={[
                styles.reviewsAnimatedContainer,
                {
                  transform: [{ translateX: scrollAnim }]
                }
              ]}
            >
              {/* Render reviews twice for seamless loop */}
              {[...recentReviews, ...recentReviews].map((review, index) => (
                <Animated.View 
                  key={`${review.id || index}-${index >= recentReviews.length ? 'duplicate' : 'original'}`}
                  style={[
                    styles.reviewCard,
                    {
                      opacity: fadeAnim,
                      transform: [{ 
                        scale: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1]
                        })
                      }]
                    }
                  ]}
                >
                  <View style={styles.reviewCardHeader}>
                    <Text style={styles.reviewerName} numberOfLines={1}>
                      {review.patient?.name || 'Anonymous'}
                    </Text>
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name="star"
                          size={14}
                          color={star <= review.rating ? "#FFD700" : "#CBD5E1"}
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewComment} numberOfLines={4}>
                    {review.comment}
                  </Text>
                  <Text style={styles.reviewDate}>
                    {review.createdAt ? format(parseISO(review.createdAt), 'MMM dd, yyyy') : 'Recent'}
                  </Text>
                </Animated.View>
              ))}
            </Animated.View>
          </View>
        ) : (
          <View style={styles.noReviewsContainer}>
            <MaterialCommunityIcons name="star-outline" size={48} color="#CBD5E1" />
            <Text style={styles.noReviewsText}>No reviews yet</Text>
            <Text style={styles.noReviewsSubtext}>
              Your first patient reviews will appear here
            </Text>
          </View>
        )}
      </Animated.View>

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

      {/* Bottom spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
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
  bottomSpacing: {
    height: 20,
  },
  // Recent Reviews Section Styles
  reviewsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  reviewsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  reviewsSectionTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginLeft: 12,
  },
  viewAllReviewsButton: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    overflow: 'hidden',
  },
  reviewsHorizontalScroll: {
    marginHorizontal: -16,
  },
  reviewsScrollContent: {
    paddingHorizontal: 16,
  },
  reviewsContainer: {
    height: 200,
    overflow: 'hidden',
    marginHorizontal: -16,
  },
  reviewsAnimatedContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  reviewCard: {
    width: 280,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    marginRight: 8,
  },
  reviewStars: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 12,
    minHeight: 60,
  },
  reviewDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  noReviewsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noReviewsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 12,
    marginBottom: 4,
  },
  noReviewsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});