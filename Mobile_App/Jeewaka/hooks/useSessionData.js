import { useState, useEffect } from "react";
import { Alert } from "react-native";
import api from "../services/api";

export const useSessionData = (sessionId, user, userRole, router) => {
  const [sessionInfo, setSessionInfo] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch session data and prepare time slots with patient info
  const fetchSessionData = async () => {
    if (!user || !user._id || !sessionId) return;

    setLoading(true);
    try {
      console.log("Fetching session data for session:", sessionId);
      const { data } = await api.get(`/api/session/${sessionId}`);

      if (!data) {
        Alert.alert("Error", "Session not found");
        router.back();
        return;
      }

      console.log("Session data received:", data);
      console.log("Hospital info:", data.hospital);
      console.log("Session type:", data.type);
      console.log("Time slots with patient data:", data.timeSlots);

      setSessionInfo(data);

      // Backend now includes patient information in timeSlots when accessed by authenticated doctor
      // No need to make separate API call to get all patients
      const slotsWithInfo = (data.timeSlots || []).map((slot, index) => {
        console.log(`Slot ${index}:`, slot);
        console.log(`Patient data for slot ${index}:`, slot.patient);
        console.log(`PatientId for slot ${index}:`, slot.patientId);

        return {
          ...slot,
          slotIndex: index,
          sessionDate: data.date,
          sessionType: data.type,
          hospital: data.hospital,
          isBooked: slot.patientId && slot.status !== "available",
        };
      });

      setTimeSlots(slotsWithInfo);
    } catch (error) {
      console.error("Error fetching session data:", error);
      Alert.alert("Error", "Failed to load session data");
      router.back();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchSessionData();
  };

  // Fetch session data when component mounts
  useEffect(() => {
    if (user && userRole === "doctor" && sessionId) {
      fetchSessionData();
    }
  }, [user, userRole, sessionId]);

  return {
    sessionInfo,
    timeSlots,
    loading,
    refreshing,
    onRefresh,
    fetchSessionData,
  };
};
