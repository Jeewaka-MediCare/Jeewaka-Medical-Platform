import { useState, useEffect, useCallback, useMemo } from "react";
import { Alert } from "react-native";
import api from "../services/api";
import { format, parseISO, addDays, isSameDay } from "date-fns";

export default function useDoctorSessionsLogic(user, router) {
  // State
  const [tabIndex, setTabIndex] = useState(0);
  const [routes] = useState([
    { key: "upcoming", title: "Upcoming" },
    { key: "past", title: "Past" },
  ]);

  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    patientName: "",
    hospitalName: "",
    appointmentType: "",
    appointmentStatus: "",
    selectedDate: null,
    startDate: null,
    endDate: null,
    dateFilterType: "single",
  });

  // Session creation modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [newSession, setNewSession] = useState({
    date: addDays(new Date(), 1),
    startTime: "09:00",
    slotDuration: 15,
    totalSlots: 6,
    sessionType: "in-person",
    hospital: "",
  });

  // Hospital options
  const [hospitals, setHospitals] = useState([]);

  // Fetch sessions with filters
  const fetchSessions = useCallback(
    async (currentFilters = filters) => {
      if (!user || !user._id) return;

      setLoading(true);
      try {
        // Build query parameters
        const queryParams = new URLSearchParams();

        if (currentFilters.patientName.trim()) {
          queryParams.append("patientName", currentFilters.patientName.trim());
        }

        if (currentFilters.hospitalName.trim()) {
          queryParams.append(
            "hospitalName",
            currentFilters.hospitalName.trim()
          );
        }

        if (currentFilters.appointmentType) {
          queryParams.append("type", currentFilters.appointmentType);
        }

        if (currentFilters.appointmentStatus) {
          queryParams.append("status", currentFilters.appointmentStatus);
        }

        // Handle date filtering
        if (
          currentFilters.dateFilterType === "single" &&
          currentFilters.selectedDate
        ) {
          const formattedDate = format(
            currentFilters.selectedDate,
            "yyyy-MM-dd"
          );
          queryParams.append("startDate", formattedDate);
          queryParams.append("endDate", formattedDate);
        } else if (
          currentFilters.dateFilterType === "range" &&
          currentFilters.startDate &&
          currentFilters.endDate
        ) {
          queryParams.append(
            "startDate",
            format(currentFilters.startDate, "yyyy-MM-dd")
          );
          queryParams.append(
            "endDate",
            format(currentFilters.endDate, "yyyy-MM-dd")
          );
        }

        const queryString = queryParams.toString();
        const url = queryString
          ? `/api/session/doctor/${user._id}?${queryString}`
          : `/api/session/doctor/${user._id}`;

        const { data } = await api.get(url);

        const doctorSessions = data || [];
        setSessions(doctorSessions);
        setFilteredSessions(doctorSessions);
      } catch (error) {
        console.error("Error fetching sessions:", error);
        Alert.alert("Error", "Failed to load sessions");
      } finally {
        setLoading(false);
      }
    },
    [user, filters]
  );

  // Fetch hospitals
  const fetchHospitals = useCallback(async () => {
    try {
      const { data } = await api.get("/api/hospital");
      setHospitals(data || []);
    } catch (error) {
      console.error("Error fetching hospitals:", error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchSessions();
      fetchHospitals();
    }
  }, [user, fetchSessions, fetchHospitals]);

  // Handle filter changes
  const handleFiltersChange = useCallback(
    (newFilters) => {
      setFilters(newFilters);
      fetchSessions(newFilters);
    },
    [fetchSessions]
  );

  // Handle section change from filters
  const handleSectionChange = useCallback((section) => {
    const sectionIndex = section === "upcoming" ? 0 : 1;
    setTabIndex(sectionIndex);
  }, []);

  // Get hospital names for filter dropdown
  const hospitalNames = useMemo(() => {
    return hospitals.map((hospital) => hospital.name).filter(Boolean);
  }, [hospitals]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSessions();
    setRefreshing(false);
  }, [fetchSessions]);

  // Handle session click to navigate to appointments for that session
  const handleSessionPress = useCallback(
    (session) => {
      const bookedSlots = getBookedSlotsCount(session);
      if (bookedSlots > 0) {
        router.push(`/session-appointments/${session._id}`);
      }
    },
    [router]
  );

  // Create time slots array based on form inputs
  const createTimeSlots = useCallback(() => {
    const slots = [];
    const startHour = parseInt(newSession.startTime.split(":")[0]);
    const startMinute = parseInt(newSession.startTime.split(":")[1]);

    for (let i = 0; i < newSession.totalSlots; i++) {
      const slotStartMinutes =
        startHour * 60 + startMinute + i * newSession.slotDuration;
      const slotEndMinutes = slotStartMinutes + newSession.slotDuration;

      // Handle 24-hour wrap-around properly
      const startHourCalculated = Math.floor(slotStartMinutes / 60) % 24;
      const endHourCalculated = Math.floor(slotEndMinutes / 60) % 24;

      const startTime = `${startHourCalculated.toString().padStart(2, "0")}:${(
        slotStartMinutes % 60
      )
        .toString()
        .padStart(2, "0")}`;
      const endTime = `${endHourCalculated.toString().padStart(2, "0")}:${(
        slotEndMinutes % 60
      )
        .toString()
        .padStart(2, "0")}`;

      slots.push({
        startTime,
        endTime,
        status: "available",
      });
    }

    return slots;
  }, [newSession.startTime, newSession.totalSlots, newSession.slotDuration]);

  const getSessionEndDateTime = useCallback((session) => {
    const lastSlot = session.timeSlots?.[session.timeSlots.length - 1];
    const firstSlot = session.timeSlots?.[0];
    if (!lastSlot || !firstSlot) return null;

    const sessionEndDateTime = new Date(session.date);
    const [endHours, endMinutes] = lastSlot.endTime.split(":");
    const [startHours] = firstSlot.startTime.split(":");

    // If end hour is less than start hour, it means the session crosses midnight
    // so we need to add a day to the end time
    if (parseInt(endHours) < parseInt(startHours)) {
      sessionEndDateTime.setDate(sessionEndDateTime.getDate() + 1);
    }

    sessionEndDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
    return sessionEndDateTime;
  }, []);

  // Helper function to check if a session is in the past
  const isSessionPast = useCallback(
    (session) => {
      const sessionEndDateTime = getSessionEndDateTime(session);
      if (!sessionEndDateTime) return false;
      return sessionEndDateTime < new Date();
    },
    [getSessionEndDateTime]
  );

  // Helper function to sort sessions (upcoming first, past last)
  const sortedSessions = useMemo(() => {
    const now = new Date();

    // Separate sessions into future and past
    const futureSessions = [];
    const pastSessions = [];

    filteredSessions.forEach((session) => {
      const sessionEndTime = getSessionEndDateTime(session);

      if (sessionEndTime && sessionEndTime >= now) {
        futureSessions.push(session);
      } else {
        pastSessions.push(session);
      }
    });

    // Sort future sessions: earliest first
    futureSessions.sort((a, b) => {
      const dateA = new Date(a.date);
      const firstSlotA = a.timeSlots?.[0];
      if (firstSlotA?.startTime) {
        const [hours, minutes] = firstSlotA.startTime.split(":");
        dateA.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }

      const dateB = new Date(b.date);
      const firstSlotB = b.timeSlots?.[0];
      if (firstSlotB?.startTime) {
        const [hours, minutes] = firstSlotB.startTime.split(":");
        dateB.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }

      return dateA - dateB;
    });

    // Sort past sessions: most recent first
    pastSessions.sort((a, b) => {
      const dateA = new Date(a.date);
      const firstSlotA = a.timeSlots?.[0];
      if (firstSlotA?.startTime) {
        const [hours, minutes] = firstSlotA.startTime.split(":");
        dateA.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }

      const dateB = new Date(b.date);
      const firstSlotB = b.timeSlots?.[0];
      if (firstSlotB?.startTime) {
        const [hours, minutes] = firstSlotB.startTime.split(":");
        dateB.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }

      return dateB - dateA; // Reverse order for past sessions
    });

    // Combine: future sessions first, then past sessions
    return [...futureSessions, ...pastSessions];
  }, [filteredSessions, getSessionEndDateTime]);

  // Separate upcoming and past sessions with proper sorting
  const upcomingSessions = useMemo(() => {
    const now = new Date();

    // Get future sessions
    const futureSessions = [];

    filteredSessions.forEach((session) => {
      const sessionEndTime = getSessionEndDateTime(session);

      if (sessionEndTime && sessionEndTime >= now) {
        futureSessions.push(session);
      }
    });

    // Sort future sessions: earliest first
    futureSessions.sort((a, b) => {
      const dateA = new Date(a.date);
      const firstSlotA = a.timeSlots?.[0];
      if (firstSlotA?.startTime) {
        const [hours, minutes] = firstSlotA.startTime.split(":");
        dateA.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }

      const dateB = new Date(b.date);
      const firstSlotB = b.timeSlots?.[0];
      if (firstSlotB?.startTime) {
        const [hours, minutes] = firstSlotB.startTime.split(":");
        dateB.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }

      return dateA - dateB;
    });

    return futureSessions;
  }, [filteredSessions, getSessionEndDateTime]);

  const pastSessions = useMemo(() => {
    const now = new Date();

    // Get past sessions
    const pastSessionsList = [];

    filteredSessions.forEach((session) => {
      const sessionEndTime = getSessionEndDateTime(session);

      if (sessionEndTime && sessionEndTime < now) {
        pastSessionsList.push(session);
      }
    });

    // Sort past sessions: most recent first
    pastSessionsList.sort((a, b) => {
      const dateA = new Date(a.date);
      const firstSlotA = a.timeSlots?.[0];
      if (firstSlotA?.startTime) {
        const [hours, minutes] = firstSlotA.startTime.split(":");
        dateA.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }

      const dateB = new Date(b.date);
      const firstSlotB = b.timeSlots?.[0];
      if (firstSlotB?.startTime) {
        const [hours, minutes] = firstSlotB.startTime.split(":");
        dateB.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }

      return dateB - dateA; // Reverse order for past sessions
    });

    return pastSessionsList;
  }, [filteredSessions, getSessionEndDateTime]);

  // Helper function to get booked slots count
  const getBookedSlotsCount = useCallback((session) => {
    return session.timeSlots?.filter((slot) => slot.patientId).length || 0;
  }, []);

  // Handle session cancellation
  const handleCancelSession = useCallback(
    async (sessionId) => {
      Alert.alert(
        "Cancel Session",
        "Are you sure you want to cancel this session? This action cannot be undone.",
        [
          { text: "No", style: "cancel" },
          {
            text: "Yes, Cancel",
            style: "destructive",
            onPress: async () => {
              try {
                await api.delete(`/api/session/${sessionId}`);
                await fetchSessions();
                Alert.alert("Success", "Session cancelled successfully");
              } catch (error) {
                console.error("Error cancelling session:", error);
                Alert.alert("Error", "Failed to cancel session");
              }
            },
          },
        ]
      );
    },
    [fetchSessions]
  );

  // Handle session creation
  const handleCreateSession = useCallback(async () => {
    if (!user) return;

    try {
      // Validate required fields
      if (newSession.sessionType === "in-person" && !newSession.hospital) {
        Alert.alert("Error", "Please select a hospital for in-person sessions");
        return;
      }

      const timeSlots = createTimeSlots();

      const payload = {
        doctorId: user._id,
        timeSlots: timeSlots,
        type: newSession.sessionType, // Changed from 'sessionType' to 'type'
        date: format(newSession.date, "yyyy-MM-dd"),
      };

      // Add hospital for in-person sessions
      if (newSession.sessionType === "in-person" && newSession.hospital) {
        payload.hospital = newSession.hospital;
      }

      console.log("Creating session with payload:", payload);

      const response = await api.post("/api/session", payload);

      if (response.data) {
        Alert.alert("Success", "Session created successfully!");
        setModalVisible(false);

        // Reset form
        setNewSession({
          date: addDays(new Date(), 1),
          startTime: "09:00",
          slotDuration: 30,
          totalSlots: 6,
          sessionType: "in-person",
          hospital: "",
        });

        // Refresh data immediately
        await fetchSessions();
      }
    } catch (error) {
      console.error("Error creating session:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to create session"
      );
    }
  }, [user, newSession, fetchSessions, createTimeSlots]);

  return {
    // State
    tabIndex,
    setTabIndex,
    routes,
    sessions,
    filteredSessions,
    loading,
    refreshing,
    filters,
    setFilters,

    // Modal state
    modalVisible,
    setModalVisible,
    showDatePicker,
    setShowDatePicker,
    showTimePicker,
    setShowTimePicker,
    newSession,
    setNewSession,

    // Data
    hospitals,
    hospitalNames,
    upcomingSessions,
    pastSessions,
    sortedSessions,

    // Functions
    fetchSessions,
    fetchHospitals,
    handleFiltersChange,
    handleSectionChange,
    onRefresh,
    handleSessionPress,
    createTimeSlots,
    getSessionEndDateTime,
    isSessionPast,
    getBookedSlotsCount,
    handleCancelSession,
    handleCreateSession,
  };
}
