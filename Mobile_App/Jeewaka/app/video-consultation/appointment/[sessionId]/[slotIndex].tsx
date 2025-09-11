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

        // Check if appointment is booked and has a patient
        if (!appointment.patientId) {
          Alert.alert("Error", "This appointment is not booked yet.");
          router.back();
          return;
        }

        // Validate appointment timing - allow joining only 5 minutes before appointment
        const appointmentDateTime = new Date(
          `${session.date.split("T")[0]}T${appointment.startTime}`
        );
        const currentTime = new Date();
        const fiveMinutesBeforeAppointment = new Date(
          appointmentDateTime.getTime() - 5 * 60 * 1000
        );

        console.log("Appointment time:", appointmentDateTime);
        console.log("Current time:", currentTime);
        console.log("Can join from:", fiveMinutesBeforeAppointment);

        // Check if current time is before the 5-minute window
        if (currentTime < fiveMinutesBeforeAppointment) {
          const timeUntilJoin = Math.ceil(
            (fiveMinutesBeforeAppointment.getTime() - currentTime.getTime()) /
              (1000 * 60)
          );
          Alert.alert(
            "Too Early",
            `You can join this video consultation ${timeUntilJoin} minutes before the appointment time (${appointment.startTime}). Please try again later.`
          );
          router.back();
          return;
        }

        // Check if appointment has already ended
        const appointmentEndTime = new Date(
          `${session.date.split("T")[0]}T${appointment.endTime}`
        );
        if (currentTime > appointmentEndTime) {
          Alert.alert(
            "Appointment Ended",
            "This appointment has already ended. Please contact your doctor if you need to reschedule."
          );
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
