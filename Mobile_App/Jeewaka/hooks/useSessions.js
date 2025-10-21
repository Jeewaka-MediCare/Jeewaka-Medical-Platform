import { useMemo } from "react";
import { Alert } from "react-native";

export const useSessions = (sessions, user, router, doctor) => {
  // Helper functions to categorize and sort sessions
  const categorizeAndSortSessions = useMemo(() => {
    if (!sessions || sessions.length === 0) {
      return { upcomingSessions: [], pastSessions: [] };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today

    const upcoming = [];
    const past = [];

    sessions.forEach((session) => {
      const sessionDate = new Date(session.date);
      sessionDate.setHours(0, 0, 0, 0); // Set to start of session date

      if (sessionDate >= today) {
        upcoming.push(session);
      } else {
        past.push(session);
      }
    });

    // Sort upcoming sessions: nearest date first
    upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Sort past sessions: most recent first
    past.sort((a, b) => new Date(b.date) - new Date(a.date));

    return { upcomingSessions: upcoming, pastSessions: past };
  }, [sessions]);

  const handleBookSession = (session) => {
    if (!user) {
      Alert.alert("Login Required", "You need to login to book a session", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => router.push("/login") },
      ]);
      return;
    }

    router.push({
      pathname: `/book-session/${session._id}`,
      params: {
        doctorId: doctor._id,
        doctorName: doctor.name,
        sessionData: JSON.stringify(session),
        doctorConsultationFee: doctor.consultationFee || 0,
      },
    });
  };

  return {
    ...categorizeAndSortSessions,
    handleBookSession,
  };
};
