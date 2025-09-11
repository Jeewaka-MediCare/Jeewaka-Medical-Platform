import React, { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert } from "react-native";
import { createMeeting, token } from "../../../../services/api";
import api from "../../../../services/api";

export default function AppointmentVideoConsultation() {
  const { sessionId, slotIndex } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAppointmentMeeting = async () => {
      try {
        setLoading(true);

        // Get the session to check the specific appointment's meeting ID
        const sessionResponse = await api.get(`/api/session/${sessionId}`);
        const session = sessionResponse.data;

        const appointmentIndex = parseInt(slotIndex as string);
        const appointment = session.timeSlots[appointmentIndex];

        if (!appointment) {
          Alert.alert("Error", "Appointment not found.");
          router.back();
          return;
        }

        let meetingId = appointment.meetingId;

        if (!meetingId) {
          // Create new meeting for this specific appointment
          meetingId = await createMeeting({ token });

          // Update the appointment with the new meeting ID
          await api.patch(
            `/api/session/${sessionId}/appointment/${slotIndex}/meeting-id`,
            {
              meetingId: meetingId,
            }
          );
        }

        // Navigate to the video consultation with the meeting ID
        router.replace(`/video-consultation/${meetingId}` as any);
      } catch (error) {
        console.error("Error handling appointment meeting:", error);
        Alert.alert(
          "Error",
          "Failed to join video consultation. Please try again."
        );
        router.back();
      } finally {
        setLoading(false);
      }
    };

    if (sessionId && slotIndex !== undefined) {
      handleAppointmentMeeting();
    }
  }, [sessionId, slotIndex]);

  return null;
}
