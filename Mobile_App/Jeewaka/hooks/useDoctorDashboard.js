import { useState, useEffect, useRef, useCallback } from "react";
import { Alert, Animated } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../services/api";

export default function useDoctorDashboard(user, router) {
  // Core data state
  const [doctorData, setDoctorData] = useState(null);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [recentReviews, setRecentReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);

  // Earnings state
  const [earningsData, setEarningsData] = useState({
    weeklyEarnings: 0,
    todayEarnings: 0,
    chartData: [],
  });

  // Time range state for chart
  const [selectedTimeRange, setSelectedTimeRange] = useState("last-week");
  const [showTimeRangePicker, setShowTimeRangePicker] = useState(false);

  // Month/Year selection state
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const [totalEarnings, setTotalEarnings] = useState(0);

  // Animation values for floating reviews
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50)); // Start 50 pixels below
  const [scrollAnim] = useState(new Animated.Value(0)); // For continuous scrolling animation

  // Ref to track animation state and cleanup
  const animationRef = useRef(null);
  const isComponentMounted = useRef(true);

  // Data options
  const timeRangeOptions = [
    { label: "Last Week (Daily)", value: "last-week" },
    { label: "Last 4 Weeks (Daily)", value: "4weeks-daily" },
    { label: "Monthly View", value: "monthly" },
  ];

  const monthOptions = [
    { label: "January", value: 1 },
    { label: "February", value: 2 },
    { label: "March", value: 3 },
    { label: "April", value: 4 },
    { label: "May", value: 5 },
    { label: "June", value: 6 },
    { label: "July", value: 7 },
    { label: "August", value: 8 },
    { label: "September", value: 9 },
    { label: "October", value: 10 },
    { label: "November", value: 11 },
    { label: "December", value: 12 },
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => ({
    label: (currentYear - i).toString(),
    value: currentYear - i,
  }));

  // Function to start continuous scrolling animation
  const startContinuousScroll = (reviewCount) => {
    console.log("Starting continuous scroll for", reviewCount, "reviews");
    if (reviewCount === 0 || !isComponentMounted.current) return;

    const cardWidth = 290; // Card width (280) + margin (10)
    const totalWidth = cardWidth * reviewCount;

    const scrollSequence = () => {
      if (!isComponentMounted.current) {
        console.log("Component unmounted, stopping animation");
        return;
      }

      scrollAnim.setValue(0);
      console.log("Scrolling to:", -totalWidth);
      animationRef.current = Animated.timing(scrollAnim, {
        toValue: -totalWidth,
        duration: reviewCount * 4000, // 4 seconds per card
        useNativeDriver: true,
      });

      animationRef.current.start((finished) => {
        if (finished && isComponentMounted.current) {
          setTimeout(() => {
            if (isComponentMounted.current) {
              scrollSequence();
            }
          }, 2000);
        } else {
          console.log("Animation cancelled or component unmounted");
        }
      });
    };

    scrollSequence();
  };

  // Function to stop animations
  const stopAnimations = () => {
    console.log("Stopping all animations");
    isComponentMounted.current = false;
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
  };

  const fetchEarningsData = async (
    timeRange = "4weeks-daily",
    year = null,
    month = null
  ) => {
    if (!user?._id) return;

    try {
      setChartLoading(true);
      console.log(
        "Fetching earnings data for doctor:",
        user._id,
        "timeRange:",
        timeRange,
        "year:",
        year,
        "month:",
        month
      );

      // Import payment service
      const { default: paymentService } = await import(
        "../services/paymentService"
      );

      // Fetch real earnings statistics from backend with time range and optional year/month
      const response = await paymentService.getDoctorEarningsStats(
        timeRange,
        year,
        month
      );

      if (response.success) {
        const { stats } = response;

        // Convert data format for the dashboard
        setEarningsData({
          weeklyEarnings: stats.weeklyEarnings,
          todayEarnings: stats.todayEarnings,
          chartData: stats.chartData,
        });

        // Calculate total earnings for selected time range (sum all chartData earnings)
        const total = stats.chartData.reduce(
          (sum, item) => sum + item.earnings,
          0
        );
        setTotalEarnings(total);

        console.log("Real earnings data loaded successfully:", {
          weeklyEarnings: stats.weeklyEarnings,
          todayEarnings: stats.todayEarnings,
          chartDataPoints: stats.chartData.length,
          chartData: stats.chartData,
          totalEarnings: total,
          timeRange: stats.timeRange,
          period: stats.period,
        });
      } else {
        throw new Error("Invalid response format from earnings API");
      }
    } catch (error) {
      console.error("Failed to fetch earnings data:", error);

      // Fallback to empty state if API fails
      setEarningsData({
        weeklyEarnings: 0,
        todayEarnings: 0,
        chartData: [],
      });
      setTotalEarnings(0);
    } finally {
      setChartLoading(false);
    }
  };

  const fetchDoctorData = async () => {
    if (!user?._id) return;

    try {
      console.log("Fetching doctor dashboard data for:", user._id);
      const { data } = await api.get(`/api/doctorCard/${user._id}`);
      setDoctorData(data.doctor);
      setRatingSummary(data.ratingSummary);

      // Fetch earnings data with selected time range
      await fetchEarningsData(selectedTimeRange);

      // Fetch recent reviews
      try {
        const reviewsResponse = await api.get(
          `/api/ratings/doctor/${user._id}`
        );
        const reviews = reviewsResponse.data || [];
        // Get the 10 most recent reviews
        const sortedReviews = reviews
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10);
        setRecentReviews(sortedReviews);
        console.log("Reviews set:", sortedReviews.length);
      } catch (reviewError) {
        console.error("Failed to fetch reviews:", reviewError);
        setRecentReviews([]);
      }
    } catch (error) {
      console.error("Failed to fetch doctor data:", error);
      Alert.alert("Error", "Failed to load your profile data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handler functions
  const handleTimeRangeSelect = (value) => {
    setSelectedTimeRange(value);
    setShowTimeRangePicker(false);

    // If switching to monthly view, fetch data for current selected month/year
    if (value === "monthly") {
      fetchEarningsData(value, selectedYear, selectedMonth);
    } else {
      fetchEarningsData(value);
    }
  };

  const handleMonthSelect = (month) => {
    setSelectedMonth(month);
    setShowMonthPicker(false);
    if (selectedTimeRange === "monthly") {
      fetchEarningsData("monthly", selectedYear, month);
    }
  };

  const handleYearSelect = (year) => {
    setSelectedYear(year);
    setShowYearPicker(false);
    if (selectedTimeRange === "monthly") {
      fetchEarningsData("monthly", year, selectedMonth);
    }
  };

  const toggleTimeRangePicker = () => {
    setShowTimeRangePicker(!showTimeRangePicker);
  };

  const toggleMonthPicker = () => {
    setShowMonthPicker(!showMonthPicker);
  };

  const toggleYearPicker = () => {
    setShowYearPicker(!showYearPicker);
  };

  const getSelectedTimeRangeLabel = () => {
    const selected = timeRangeOptions.find(
      (option) => option.value === selectedTimeRange
    );
    return selected ? selected.label : "Last Week (Daily)";
  };

  const getSelectedMonthLabel = () => {
    const selected = monthOptions.find(
      (option) => option.value === selectedMonth
    );
    return selected ? selected.label : "January";
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDoctorData();
  };

  const handleViewReviews = () => {
    if (doctorData?._id) {
      // Navigate to dedicated reviews page
      router.push({
        pathname: "/doctor-reviews",
        params: { doctorId: doctorData._id },
      });
    }
  };

  const handleViewEarnings = () => {
    // Navigate to doctor earnings page
    router.push("/doctor-earnings");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Calculate profile completion percentage
  const calculateProfileCompletion = (doctor) => {
    if (!doctor) return { percentage: 0, missingFields: [] };

    const requiredFields = [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "gender", label: "Gender" },
      { key: "profile", label: "Profile Image" },
      { key: "dob", label: "Date of Birth" },
      { key: "specialization", label: "Specialization" },
      { key: "subSpecializations", label: "Sub-specializations" },
      { key: "qualifications", label: "Qualifications" },
      { key: "yearsOfExperience", label: "Years of Experience" },
      { key: "languagesSpoken", label: "Languages Spoken" },
      { key: "bio", label: "Bio" },
      { key: "consultationFee", label: "Consultation Fee" },
    ];

    let completedFields = 0;
    let missingFields = [];

    requiredFields.forEach((field) => {
      const value = doctor[field.key];
      let isCompleted = false;

      if (Array.isArray(value)) {
        isCompleted = value && value.length > 0;
      } else if (typeof value === "string") {
        isCompleted = value && value.trim() !== "";
      } else {
        isCompleted = value !== null && value !== undefined && value !== 0;
      }

      if (isCompleted) {
        completedFields++;
      } else {
        missingFields.push(field.label);
      }
    });

    const percentage = Math.round(
      (completedFields / requiredFields.length) * 100
    );
    return { percentage, missingFields };
  };

  // Navigate to My Profile tab
  const navigateToProfile = () => {
    router.push("/(tabs)/profile");
  };

  // Effects
  useEffect(() => {
    fetchDoctorData();
  }, [user?._id]);

  // Handle focus/unfocus events for tab navigation
  useFocusEffect(
    useCallback(() => {
      console.log("DoctorDashboard tab focused - enabling animations");
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
        console.log("DoctorDashboard tab unfocused - stopping animations");
        stopAnimations();
      };
    }, [recentReviews])
  );

  // Listen for time range changes
  useEffect(() => {
    if (user?._id && selectedTimeRange) {
      if (selectedTimeRange === "monthly") {
        fetchEarningsData(selectedTimeRange, selectedYear, selectedMonth);
      } else {
        fetchEarningsData(selectedTimeRange);
      }
    }
  }, [selectedTimeRange, selectedYear, selectedMonth, user?._id]);

  // Separate useEffect to handle animations when reviews change
  useEffect(() => {
    if (recentReviews.length > 0 && isComponentMounted.current) {
      // Start animation when reviews are available and component is focused
      console.log(
        "Starting reviews section animation for",
        recentReviews.length,
        "reviews"
      );

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
            setTimeout(() => {
              if (isComponentMounted.current) {
                startContinuousScroll(recentReviews.length);
              }
            }, 1000);
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
      console.log("DoctorDashboard component unmounting - final cleanup");
      stopAnimations();
    };
  }, []);

  return {
    // State
    doctorData,
    ratingSummary,
    recentReviews,
    loading,
    refreshing,
    chartLoading,
    earningsData,
    selectedTimeRange,
    showTimeRangePicker,
    selectedMonth,
    selectedYear,
    showMonthPicker,
    showYearPicker,
    totalEarnings,
    fadeAnim,
    slideAnim,
    scrollAnim,

    // Data options
    timeRangeOptions,
    monthOptions,
    yearOptions,

    // Handlers
    handleTimeRangeSelect,
    handleMonthSelect,
    handleYearSelect,
    toggleTimeRangePicker,
    toggleMonthPicker,
    toggleYearPicker,
    getSelectedTimeRangeLabel,
    getSelectedMonthLabel,
    onRefresh,
    handleViewReviews,
    handleViewEarnings,
    getGreeting,
    calculateProfileCompletion,
    navigateToProfile,

    // Computed values
    avgRating: ratingSummary?.avgRating || 0,
    totalReviews: ratingSummary?.totalReviews || 0,
  };
}
