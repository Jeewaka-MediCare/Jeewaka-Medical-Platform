import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { LineChart } from 'react-native-gifted-charts';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { format, parseISO } from 'date-fns';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import paymentService from '../services/paymentService';

export default function DoctorDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [doctorData, setDoctorData] = useState(null);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [recentReviews, setRecentReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Earnings state
  const [earningsData, setEarningsData] = useState({
    weeklyEarnings: 0,
    todayEarnings: 0,
    chartData: []
  });
  
  // Time range state for chart
  const [selectedTimeRange, setSelectedTimeRange] = useState('4weeks');
  const [showTimeRangePicker, setShowTimeRangePicker] = useState(false);
  const timeRangeOptions = [
    { label: 'Last 4 Weeks', value: '4weeks' },
    { label: 'Last 8 Weeks', value: '8weeks' },
    { label: 'Last 3 Months', value: '3months' },
    { label: 'Last 6 Months', value: '6months' },
  ];
      const [totalEarnings, setTotalEarnings] = useState(0);
  
  // Handler functions
  const handleTimeRangeSelect = (value) => {
    setSelectedTimeRange(value);
    setShowTimeRangePicker(false);
    fetchEarningsData(value);
  };

  const toggleTimeRangePicker = () => {
    setShowTimeRangePicker(!showTimeRangePicker);
  };

  const getSelectedTimeRangeLabel = () => {
    const selected = timeRangeOptions.find(option => option.value === selectedTimeRange);
    return selected ? selected.label : 'Last 4 Weeks';
  };
  
  // Animation values for floating reviews
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50)); // Start 50 pixels below
  const [scrollAnim] = useState(new Animated.Value(0)); // For continuous scrolling animation
  
  // Ref to track animation state and cleanup
  const animationRef = useRef(null);
  const isComponentMounted = useRef(true);

  // Function to start continuous scrolling animation
  const startContinuousScroll = (reviewCount) => {
    console.log('Starting continuous scroll for', reviewCount, 'reviews');
    if (reviewCount === 0 || !isComponentMounted.current) return;
    
    const cardWidth = 290; // Card width (280) + margin (10)
    const totalWidth = cardWidth * reviewCount;
    
    const scrollSequence = () => {
      if (!isComponentMounted.current) {
        console.log('Component unmounted, stopping animation');
        return;
      }
      
      scrollAnim.setValue(0);
      console.log('Scrolling to:', -totalWidth);
      animationRef.current = Animated.timing(scrollAnim, {
        toValue: -totalWidth,
        duration: reviewCount * 4000, // 4 seconds per card
        useNativeDriver: true,
      });
      
      animationRef.current.start((finished) => {
        if (finished && isComponentMounted.current) {
          // Reset and restart the animation only if component is still mounted
          console.log('Animation completed, restarting...');
          scrollSequence();
        } else {
          console.log('Animation stopped or component unmounted');
        }
      });
    };
    
    scrollSequence();
  };

  // Function to stop animations
  const stopAnimations = () => {
    console.log('Stopping all animations');
    isComponentMounted.current = false;
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
  };

  const fetchEarningsData = async (timeRange = '4weeks') => {
    if (!user?._id) return;
    
    try {
      console.log('Fetching earnings data for doctor:', user._id, 'timeRange:', timeRange);
      
      // Import payment service
      const { default: paymentService } = await import('../services/paymentService');
      
      // Fetch real earnings statistics from backend with time range
      const response = await paymentService.getDoctorEarningsStats(timeRange);
      
      if (response.success) {
        const { stats } = response;
        
        // Convert data format for the dashboard
        setEarningsData({
          weeklyEarnings: stats.weeklyEarnings, // Already in cents from backend
          todayEarnings: stats.todayEarnings, // Already in cents from backend
          chartData: stats.chartData // Already formatted with date, week, earnings
        });
        
        // Calculate total earnings for selected time range (sum all chartData earnings)
        const total = stats.chartData.reduce((sum, item) => sum + item.earnings, 0);
        setTotalEarnings(total);
        
        console.log('Real earnings data loaded successfully:', {
          weeklyEarnings: stats.weeklyEarnings,
          todayEarnings: stats.todayEarnings,
          chartDataPoints: stats.chartData.length,
          chartData: stats.chartData,
          totalEarnings: total
        });
      } else {
        throw new Error('Invalid response format from earnings API');
      }
      
    } catch (error) {
      console.error('Failed to fetch earnings data:', error);
      
      // Fallback to empty state if API fails
      setEarningsData({
        weeklyEarnings: 0,
        todayEarnings: 0,
        chartData: []
      });
      setTotalEarnings(0);
    }
  };

  const fetchDoctorData = async () => {
    if (!user?._id) return;
    
    try {
      console.log('Fetching doctor dashboard data for:', user._id);
      const { data } = await api.get(`/api/doctorCard/${user._id}`);
      setDoctorData(data.doctor);
      setRatingSummary(data.ratingSummary);
      
      // Fetch earnings data with selected time range
      await fetchEarningsData(selectedTimeRange);
      
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
      } catch (reviewError) {
        console.error('Failed to fetch reviews:', reviewError);
        setRecentReviews([]);
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

  // Handle focus/unfocus events for tab navigation
  useFocusEffect(
    useCallback(() => {
      console.log('DoctorDashboard tab focused - enabling animations');
      isComponentMounted.current = true;
      
      // Restart animations if reviews are available and we're focused
      if (recentReviews.length > 0) {
        setTimeout(() => {
          if (isComponentMounted.current) {
            startContinuousScroll(recentReviews.length);
          }
        }, 1000);
      }

      return () => {
        console.log('DoctorDashboard tab unfocused - stopping animations');
        stopAnimations();
      };
    }, [recentReviews])
  );

  // Listen for time range changes
  useEffect(() => {
    if (user?._id && selectedTimeRange) {
      fetchEarningsData(selectedTimeRange);
    }
  }, [selectedTimeRange, user?._id]);

  // Separate useEffect to handle animations when reviews change
  useEffect(() => {
    if (recentReviews.length > 0 && isComponentMounted.current) {
      // Start animation when reviews are available and component is focused
      console.log('Starting reviews section animation for', recentReviews.length, 'reviews');
      
      // Reset animation values
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      
      setTimeout(() => {
        if (!isComponentMounted.current) return;
        
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
        ]).start((finished) => {
          if (finished && isComponentMounted.current) {
            console.log('Fade-in animation completed');
            // Start continuous scrolling after fade-in completes
            setTimeout(() => {
              if (isComponentMounted.current) {
                startContinuousScroll(recentReviews.length);
              }
            }, 2000); // Wait 2 seconds before starting scroll
          }
        });
      }, 1000);
    } else if (recentReviews.length === 0) {
      // Stop animations if no reviews
      stopAnimations();
    }
  }, [recentReviews]);

  // Fallback cleanup effect for component unmount
  useEffect(() => {
    return () => {
      console.log('DoctorDashboard component unmounting - final cleanup');
      stopAnimations();
    };
  }, []);

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

  const handleViewEarnings = () => {
    // Navigate to doctor earnings page
    router.push('/doctor-earnings');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Calculate profile completion percentage
  const calculateProfileCompletion = (doctor) => {
    if (!doctor) return { percentage: 0, missingFields: [] };

    const requiredFields = [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'gender', label: 'Gender' },
      { key: 'profile', label: 'Profile Image' },
      { key: 'dob', label: 'Date of Birth' },
      { key: 'specialization', label: 'Specialization' },
      { key: 'subSpecializations', label: 'Sub-specializations' },
      { key: 'qualifications', label: 'Qualifications' },
      { key: 'yearsOfExperience', label: 'Years of Experience' },
      { key: 'languagesSpoken', label: 'Languages Spoken' },
      { key: 'bio', label: 'Bio' },
      { key: 'consultationFee', label: 'Consultation Fee' }
    ];

    let completedFields = 0;
    let missingFields = [];

    requiredFields.forEach(field => {
      const value = doctor[field.key];
      let isCompleted = false;

      if (Array.isArray(value)) {
        isCompleted = value && value.length > 0;
      } else if (typeof value === 'string') {
        isCompleted = value && value.trim() !== '';
      } else if (typeof value === 'number') {
        isCompleted = value !== null && value !== undefined && value >= 0;
      } else {
        isCompleted = value !== null && value !== undefined;
      }

      if (isCompleted) {
        completedFields++;
      } else {
        missingFields.push(field.label);
      }
    });

    const percentage = Math.round((completedFields / requiredFields.length) * 100);
    return { percentage, missingFields };
  };

  // Navigate to My Profile tab
  const navigateToProfile = () => {
    router.push('/(tabs)/profile');
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
          <MaterialCommunityIcons name="comment-multiple" size={24} color="#008080" />
          <Text style={styles.statValue}>{totalReviews}</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="clock" size={24} color="#10B981" />
          <Text style={styles.statValue}>{doctorData?.yearsOfExperience || 0}</Text>
          <Text style={styles.statLabel}>Years Exp</Text>
        </View>
      </View>

      {/* Your Earnings Section */}
      <View style={styles.earningsSection}>
        {/* Earnings Header Row */}
        <View style={styles.earningsHeaderRow}>
          <Text style={styles.sectionTitle}>Your Earnings</Text>
          <TouchableOpacity 
            style={styles.viewEarningsButton}
            onPress={handleViewEarnings}
          >
            <MaterialCommunityIcons name="eye" size={16} color="#008080" />
            <Text style={styles.viewEarningsText}>View Earnings</Text>
          </TouchableOpacity>
        </View>
            
        <View style={styles.earningsStatsRow}>
          <View style={styles.earningsCard}>
            <MaterialCommunityIcons name="calendar-today" size={20} color="#F59E0B" />
            <Text style={styles.earningsValue}>LKR {(earningsData.todayEarnings / 100).toLocaleString()}</Text>
            <Text style={styles.earningsLabel}>Today</Text>
          </View>
          <View style={styles.earningsCard}>
            <MaterialCommunityIcons name="calendar-week" size={20} color="#10B981" />
            <Text style={styles.earningsValue}>LKR {(earningsData.weeklyEarnings / 100).toLocaleString()}</Text>
            <Text style={styles.earningsLabel}>Weekly</Text>
          </View>
        </View>
        <View style={styles.totalEarningsRow}>
          <MaterialCommunityIcons name="cash-multiple" size={20} color="#008080" />
          <Text style={styles.totalEarningsLabel}>Total Earnings ({getSelectedTimeRangeLabel()}): </Text>
          <Text style={styles.totalEarningsValue}>LKR {(totalEarnings / 100).toLocaleString()}</Text>
        </View>
        
        {/* Earnings Chart with Time Range Selector */}
        {earningsData.chartData.length > 0 && (
          <View style={styles.chartContainer}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Earnings Trend</Text>
              <TouchableOpacity 
                style={styles.timeRangeButton}
                onPress={toggleTimeRangePicker}
              >
                <Text style={styles.timeRangeText}>{getSelectedTimeRangeLabel()}</Text>
                <MaterialCommunityIcons 
                  name={showTimeRangePicker ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#6B7280" 
                />
              </TouchableOpacity>
            </View>
            
            {/* Time Range Picker Dropdown */}
            {showTimeRangePicker && (
              <View style={styles.timeRangeDropdown}>
                {timeRangeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.timeRangeOption,
                      selectedTimeRange === option.value && styles.selectedTimeRangeOption
                    ]}
                    onPress={() => handleTimeRangeSelect(option.value)}
                  >
                    <Text style={[
                      styles.timeRangeOptionText,
                      selectedTimeRange === option.value && styles.selectedTimeRangeOptionText
                    ]}>
                      {option.label}
                    </Text>
                    {selectedTimeRange === option.value && (
                      <MaterialCommunityIcons name="check" size={16} color="#059669" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            <View style={styles.chartWrapper}>
              {(() => {
                const screenWidth = Dimensions.get('window').width;
                // Account for: screen margins (8px), container padding (32px), wrapper padding (20px)
                const chartWidth = screenWidth - 120; 
                const dataLength = earningsData.chartData.length;
                // Ensure spacing distributes points evenly with proper margins
                const availableWidth = chartWidth - 80; // Space for labels and margins
                const spacing = dataLength > 1 ? Math.max(30, availableWidth / (dataLength - 1)) : 50;
                
                // Calculate Y-axis labels with improved scaling
                const maxEarnings = Math.max(...earningsData.chartData.map(d => Math.max(d.earnings / 100, 0)));
                
                // Smart scaling: ensure nice round numbers for Y-axis
                let maxValue;
                if (maxEarnings <= 100) {
                  maxValue = Math.ceil(maxEarnings * 1.2 / 10) * 10; // Round to nearest 10
                } else if (maxEarnings <= 1000) {
                  maxValue = Math.ceil(maxEarnings * 1.2 / 100) * 100; // Round to nearest 100
                } else if (maxEarnings <= 10000) {
                  maxValue = Math.ceil(maxEarnings * 1.2 / 1000) * 1000; // Round to nearest 1000
                } else if (maxEarnings <= 100000) {
                  maxValue = Math.ceil(maxEarnings * 1.2 / 5000) * 5000; // Round to nearest 5000
                } else if (maxEarnings <= 1000000) {
                  maxValue = Math.ceil(maxEarnings * 1.2 / 50000) * 50000; // Round to nearest 50000
                } else {
                  maxValue = Math.ceil(maxEarnings * 1.2 / 100000) * 100000; // Round to nearest 100000
                }
                
                // Ensure minimum scale
                maxValue = Math.max(1000, maxValue);
                
                const yAxisLabels = [];
                for (let i = 0; i <= 6; i++) {
                  const value = (maxValue / 6) * i;
                  if (value >= 1000000) {
                    yAxisLabels.push(`${(value / 1000000).toFixed(1)}M`);
                  } else if (value >= 1000) {
                    yAxisLabels.push(`${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`);
                  } else {
                    yAxisLabels.push(`${Math.round(value)}`);
                  }
                }
                
                console.log('Chart Scaling Debug:', {
                  screenWidth,
                  chartWidth,
                  dataLength,
                  spacing,
                  availableWidth,
                  rawEarningsData: earningsData.chartData.map(item => item.earnings),
                  maxEarnings,
                  maxValue,
                  scalingRatio: maxValue / maxEarnings,
                  yAxisLabels,
                  chartData: earningsData.chartData.map(item => ({ week: item.week, earnings: item.earnings }))
                });
                
                // Test scaling logic with different scenarios
                const testScenarios = [
                  { name: 'Low earnings', maxEarnings: 50 },
                  { name: 'Medium earnings', maxEarnings: 500 },
                  { name: 'High earnings', maxEarnings: 5000 },
                  { name: 'Very high earnings', maxEarnings: 50000 },
                  { name: 'Extremely high earnings', maxEarnings: 500000 }
                ];
                
                console.log('Y-Axis Scaling Test Results:');
                testScenarios.forEach(scenario => {
                  let testMaxValue;
                  if (scenario.maxEarnings <= 100) {
                    testMaxValue = Math.ceil(scenario.maxEarnings * 1.2 / 10) * 10;
                  } else if (scenario.maxEarnings <= 1000) {
                    testMaxValue = Math.ceil(scenario.maxEarnings * 1.2 / 100) * 100;
                  } else if (scenario.maxEarnings <= 10000) {
                    testMaxValue = Math.ceil(scenario.maxEarnings * 1.2 / 1000) * 1000;
                  } else if (scenario.maxEarnings <= 100000) {
                    testMaxValue = Math.ceil(scenario.maxEarnings * 1.2 / 5000) * 5000;
                  } else if (scenario.maxEarnings <= 1000000) {
                    testMaxValue = Math.ceil(scenario.maxEarnings * 1.2 / 50000) * 50000;
                  } else {
                    testMaxValue = Math.ceil(scenario.maxEarnings * 1.2 / 100000) * 100000;
                  }
                  testMaxValue = Math.max(1000, testMaxValue);
                  
                  const testLabels = [];
                  for (let i = 0; i <= 6; i++) {
                    const value = (testMaxValue / 6) * i;
                    if (value >= 1000000) {
                      testLabels.push(`${(value / 1000000).toFixed(1)}M`);
                    } else if (value >= 1000) {
                      testLabels.push(`${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`);
                    } else {
                      testLabels.push(`${Math.round(value)}`);
                    }
                  }
                  
                  console.log(`${scenario.name} (${scenario.maxEarnings}):`, {
                    maxValue: testMaxValue,
                    labels: testLabels
                  });
                });
                
                return (
                  <LineChart
                    areaChart
                    data={earningsData.chartData.map(item => ({
                      value: Math.max(item.earnings / 100, 0), // Convert from cents to LKR, ensure minimum 0
                      label: item.week,
                    }))}
                    width={chartWidth}
                    height={240}
                    spacing={spacing}
                    initialSpacing={40}
                    endSpacing={40}
                    adjustToWidth={false}
                    color="#4DB6AC"
                    thickness={3}
                    startFillColor="#008080"
                    endFillColor="rgba(147, 197, 253, 0.1)"
                    startOpacity={0.4}
                    endOpacity={0.1}
                    noOfSections={6}
                    maxValue={maxValue}
                    minValue={0}
                    yAxisOffset={0}
                    hideOrigin={false}
                    yAxisLabelTexts={yAxisLabels}
                    yAxisColor="#E5E7EB"
                    xAxisColor="#E5E7EB"
                    yAxisThickness={1}
                    xAxisThickness={1}
                    yAxisLabelWidth={50}
                    rulesType="solid"
                    rulesColor="#F3F4F6"
                    rulesThickness={1}
                    yAxisTextStyle={{
                      color: '#374151',
                      fontSize: 11,
                      fontWeight: '500',
                    }}
                    showYAxisIndices={true}
                    yAxisLabelSuffix=""
                xAxisLabelTextStyle={{
                  color: '#6B7280',
                  fontSize: 11,
                  fontWeight: '500',
                }}
                showVerticalLines={false}
                curved={false}
                isAnimated={true}
                animationDuration={1500}
                animateOnDataChange={true}
                onDataChangeAnimationDuration={800}
                hideDataPoints={false}
                dataPointsHeight={8}
                dataPointsWidth={8}
                dataPointsColor="#008080"
                dataPointsRadius={4}
                focusEnabled={true}
                showStripOnFocus={true}
                stripColor="#E5E7EB"
                stripOpacity={0.5}
                stripWidth={2}
                showTextOnFocus={true}
                focusedDataPointColor="#1D4ED8"
                focusedDataPointRadius={6}
                textShiftY={-8}
                textShiftX={0}
                textColor="#1F2937"
                textFontSize={12}
                  />
                );
              })()}
            </View>
            
            {/* Chart Statistics */}
            <View style={styles.chartStats}>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="trending-up" size={16} color="#10B981" />
                  <Text style={styles.statLabel}>
                    {earningsData.chartData.length > 1 ? 
                      (earningsData.chartData[earningsData.chartData.length - 1].earnings > earningsData.chartData[0].earnings ? 
                        'Trending up' : 'Trending down') 
                      : 'Stable'}
                  </Text>
                </View>
                <Text style={styles.periodLabel}>
                  {timeRangeOptions.find(opt => opt.value === selectedTimeRange)?.label}
                </Text>
              </View>
            </View>
          </View>
        )}
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

      {/* Profile Completion Section */}
      {(() => {
        const { percentage, missingFields } = calculateProfileCompletion(doctorData);
        const isComplete = percentage === 100;
        
        return (
          <View style={[
            styles.profileCompletionSection,
            isComplete ? styles.profileCompletionComplete : styles.profileCompletionIncomplete
          ]}>
            <View style={styles.profileCompletionHeader}>
              <Ionicons 
                name={isComplete ? "checkmark-circle" : "warning"} 
                size={24} 
                color={isComplete ? "#10B981" : "#F59E0B"} 
              />
              <Text style={[
                styles.profileCompletionTitle,
                { color: isComplete ? "#065F46" : "#92400E" }
              ]}>
                {isComplete ? "Profile Complete" : `Complete Your Profile (${percentage}% Complete)`}
              </Text>
            </View>
            
            {isComplete ? (
              <Text style={[
                styles.profileCompletionDescription,
                { color: "#065F46" }
              ]}>
                Your profile is fully optimized! Keep it updated to attract more patients.
              </Text>
            ) : (
              <Text style={[
                styles.profileCompletionDescription,
                { color: "#78350F" }
              ]}>
                Please complete the following fields to have a fully optimized profile:
              </Text>
            )}
            
            {!isComplete && missingFields.length <= 3 && (
              <View style={styles.missingFieldsContainer}>
                {missingFields.map((field, index) => (
                  <View key={index} style={styles.missingFieldTag}>
                    <Text style={styles.missingFieldText}>{field}</Text>
                  </View>
                ))}
              </View>
            )}
            
            <View style={styles.profileProgressContainer}>
              <View style={[
                styles.profileProgressBar,
                { backgroundColor: isComplete ? "#A7F3D0" : "#FDE68A" }
              ]}>
                <View 
                  style={[
                    styles.profileProgressFill, 
                    { 
                      width: `${percentage}%`,
                      backgroundColor: isComplete ? "#10B981" : "#008080"
                    }
                  ]} 
                />
              </View>
              <Text style={[
                styles.profileProgressText,
                { color: isComplete ? "#065F46" : "#92400E" }
              ]}>{percentage}%</Text>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.profileActionButton,
                { backgroundColor: isComplete ? "#10B981" : "#008080" }
              ]}
              onPress={navigateToProfile}
            >
              <Ionicons 
                name={isComplete ? "person" : "add-circle"} 
                size={20} 
                color="#FFFFFF" 
              />
              <Text style={styles.profileActionButtonText}>
                {isComplete ? "Update Profile" : "Complete Profile"}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })()}

      {/* Professional Information */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Professional Information</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="medical-bag" size={20} color="#008080" />
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
            <MaterialCommunityIcons name="certificate" size={20} color="#008080" />
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
            <MaterialCommunityIcons name="card-account-details" size={20} color="#008080" />
            <Text style={styles.infoLabel}>Registration Number</Text>
          </View>
          <Text style={styles.infoValue}>
            {doctorData?.regNo || 'Not specified'}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="translate" size={20} color="#008080" />
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
            <MaterialCommunityIcons name="cash" size={20} color="#008080" />
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
  // Profile Completion Section Styles
  profileCompletionSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  profileCompletionIncomplete: {
    backgroundColor: '#d1f4f4ff',
    borderColor: '#008080',
  },
  profileCompletionComplete: {
    backgroundColor: '#91e2e2ff',
    borderColor: '#10B981',
  },
  profileCompletionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileCompletionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
    flex: 1,
  },
  profileCompletionDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  missingFieldsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 6,
  },
  missingFieldTag: {
    backgroundColor: '#39d3d3ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#008080',
  },
  missingFieldText: {
    fontSize: 12,
    color: '#1e6d6dff',
    fontWeight: '600',
  },
  profileProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileProgressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  profileProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  profileProgressText: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 40,
  },
  profileActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  profileActionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
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
  // Earnings Section Styles
  earningsSection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  earningsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  earningsStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  earningsCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  earningsValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 4,
    marginBottom: 2,
    textAlign: 'center',
  },
  earningsLabel: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  totalEarningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#0EA5E9',
  },
  totalEarningsLabel: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  totalEarningsValue: {
    fontSize: 16,
    color: '#008080',
    fontWeight: 'bold',
  },
  viewEarningsButton: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#E0F2F1',
  },
  viewEarningsText: {
    fontSize: 12,
    color: '#008080',
    fontWeight: '500',
  },
  // Chart styles
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 16,
    marginHorizontal: 4,
    position: 'relative',
    overflow: 'visible',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  timeRangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 120,
    justifyContent: 'center',
  },
  timeRangeText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
    marginRight: 4,
  },
  timeRangeDropdown: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
    minWidth: 140,
  },
  timeRangeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedTimeRangeOption: {
    backgroundColor: '#F0FDF4',
  },
  timeRangeOptionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '400',
  },
  selectedTimeRangeOptionText: {
    color: '#059669',
    fontWeight: '500',
  },
  chartWrapper: {
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 0,
    backgroundColor: '#FEFEFE',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    width: '100%',
  },
  chartStats: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 15,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  periodLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
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
    color: '#008080',
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