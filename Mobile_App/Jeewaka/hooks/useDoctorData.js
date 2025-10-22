import { useState, useEffect } from "react";
import { Alert } from "react-native";
import api from "../services/api";
import reviewService from "../services/reviewService";

export const useDoctorData = (id, fallbackData, router) => {
  const [doctor, setDoctor] = useState(null);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctorDetails = async () => {
      // If we have fallback data, use it immediately to improve UX
      if (fallbackData && fallbackData.doctor) {
        console.log(
          "Using fallback data for doctor:",
          fallbackData.doctor.name
        );
        setDoctor(fallbackData.doctor);
        setRatingSummary(fallbackData.ratingSummary || null);
        setSessions(fallbackData.sessions || []);
        setLoading(false);
      }

      try {
        console.log("Fetching doctor details for ID:", id);
        // Use the same endpoint as web app to get doctor with sessions
        const { data } = await api.get(`/api/doctorCard/${id}`);
        console.log("Doctor details received:", {
          doctorName: data.doctor?.name,
          sessionsCount: data.sessions?.length,
          ratingSummary: data.ratingSummary,
        });

        // Fetch reviews separately from the ratings API
        let reviews = [];
        try {
          reviews = await reviewService.getDoctorReviews(id);
          console.log("Reviews fetched separately:", reviews.length);
        } catch (reviewError) {
          console.error("Error fetching reviews:", reviewError);
          // Continue without reviews if fetching fails
        }

        // Backend returns structured data with doctor, sessions, and ratingSummary
        setDoctor({
          ...data.doctor,
          avgRating: data.ratingSummary?.avgRating || 0,
          totalReviews: data.ratingSummary?.totalReviews || 0,
          reviews: reviews,
        });
        setRatingSummary(data.ratingSummary || null);
        setSessions(data.sessions || []);
      } catch (error) {
        console.error("Error fetching doctor details:", error);
        console.error("Error details:", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });

        // Try to use fallback data if available
        if (fallbackData && fallbackData.doctor) {
          console.log(
            "Using fallback data after error for doctor:",
            fallbackData.doctor.name
          );
          setDoctor(fallbackData.doctor);
          setRatingSummary(fallbackData.ratingSummary || null);
          setSessions(fallbackData.sessions || []);
        } else {
          // Check if it's a network error or server error
          if (
            error.code === "NETWORK_ERROR" ||
            error.message === "Network Error"
          ) {
            Alert.alert(
              "Connection Error",
              "Unable to connect to the server. Please check your internet connection and try again.",
              [
                { text: "Retry", onPress: () => fetchDoctorDetails() },
                { text: "Go Back", onPress: () => router.back() },
              ]
            );
          } else {
            Alert.alert("Error", "Failed to load doctor information");
          }
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDoctorDetails();
    } else {
      console.error("No doctor ID provided");
      setLoading(false);
    }
  }, [id]);

  return {
    doctor,
    ratingSummary,
    sessions,
    loading,
  };
};
