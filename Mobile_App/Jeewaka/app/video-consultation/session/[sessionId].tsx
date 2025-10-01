import React, { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert } from "react-native";
import { createMeeting, token } from "../../../services/api";
import api from "../../../services/api";

export default function SessionVideoConsultation() {
  const { sessionId } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleSessionMeeting = async () => {
      try {
        setLoading(true);

        // First, get the session to check if it already has a meeting ID
        const sessionResponse = await api.get(`/api/session/${sessionId}`);
        const session = sessionResponse.data;

        let meetingId = session.meetingId;

        if (!meetingId) {
          // Create new meeting if session doesn't have one
          meetingId = await createMeeting({ token });

          // Update the session with the new meeting ID
          await api.patch(`/api/session/${sessionId}/meeting-id`, {
            meetingId: meetingId,
          });
        }

        // Navigate to the video consultation with the meeting ID
        router.replace(`/video-consultation/${meetingId}` as any);
      } catch (error) {
        console.error("Error handling session meeting:", error);
        Alert.alert(
          "Error",
          "Failed to join video consultation. Please try again."
        );
        router.back();
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      handleSessionMeeting();
    }
  }, [sessionId]);

  // This component just handles the routing logic, no UI needed
  return null;
}
