import React, { useState, useEffect } from "react";
import { TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";

interface VideoCallButtonProps {
  meetingId?: string;
  sessionId?: string;
  slotIndex?: number;
  style?: any;
  title?: string;
  disabled?: boolean;
  appointmentDate?: string; // Date of the appointment (YYYY-MM-DD)
  appointmentStartTime?: string; // Start time (HH:MM format)
  appointmentEndTime?: string; // End time (HH:MM format)
}

export default function VideoCallButton({
  meetingId,
  sessionId,
  slotIndex,
  style,
  title = "Start Video Call",
  disabled = false,
  appointmentDate,
  appointmentStartTime,
  appointmentEndTime,
}: VideoCallButtonProps) {
  const router = useRouter();
  const [timingStatus, setTimingStatus] = useState({
    canJoin: true,
    buttonText: title,
    isTimingDisabled: false,
  });

  // Check timing status for appointments
  useEffect(() => {
    const checkTiming = () => {
      // If explicitly disabled (e.g., past appointments), use the provided title as-is
      if (disabled) {
        setTimingStatus({
          canJoin: false,
          buttonText: title,
          isTimingDisabled: false,
        });
        return;
      }

      // If no timing data provided, allow joining (general sessions or meetings)
      if (!appointmentDate || !appointmentStartTime || !appointmentEndTime) {
        setTimingStatus({
          canJoin: true,
          buttonText: title,
          isTimingDisabled: false,
        });
        return;
      }

      const appointmentDateTime = new Date(
        `${appointmentDate}T${appointmentStartTime}`
      );
      const currentTime = new Date();
      const fiveMinutesBeforeAppointment = new Date(
        appointmentDateTime.getTime() - 5 * 60 * 1000
      );
      const appointmentEndDateTime = new Date(
        `${appointmentDate}T${appointmentEndTime}`
      );

      // Check if appointment has already ended
      if (currentTime > appointmentEndDateTime) {
        setTimingStatus({
          canJoin: false,
          buttonText: "Appointment Ended",
          isTimingDisabled: true,
        });
        return;
      }

      // Check if current time is before the 5-minute window
      if (currentTime < fiveMinutesBeforeAppointment) {
        const timeUntilJoinInMinutes = Math.ceil(
          (fiveMinutesBeforeAppointment.getTime() - currentTime.getTime()) /
            (1000 * 60)
        );
        setTimingStatus({
          canJoin: false,
          buttonText: `Available in ${timeUntilJoinInMinutes} min`,
          isTimingDisabled: true,
        });
        return;
      }

      // Within the allowed time window
      setTimingStatus({
        canJoin: true,
        buttonText: title,
        isTimingDisabled: false,
      });
    };

    checkTiming();

    // Update timing status every minute if we have appointment timing data
    if (appointmentDate && appointmentStartTime && appointmentEndTime) {
      const interval = setInterval(checkTiming, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [
    appointmentDate,
    appointmentStartTime,
    appointmentEndTime,
    title,
    disabled,
  ]);

  const isButtonDisabled = disabled || !timingStatus.canJoin;

  const handlePress = () => {
    if (isButtonDisabled) {
      // Only show timing alerts for timing-based restrictions, not explicit disabling
      if (
        timingStatus.isTimingDisabled &&
        appointmentDate &&
        appointmentStartTime
      ) {
        if (timingStatus.buttonText.includes("Available in")) {
          const timeUntilJoinInMinutes = Math.ceil(
            (new Date(`${appointmentDate}T${appointmentStartTime}`).getTime() -
              5 * 60 * 1000 -
              new Date().getTime()) /
              (1000 * 60)
          );
          Alert.alert(
            "Too Early to Join",
            `You can join this video consultation ${timeUntilJoinInMinutes} minute${
              timeUntilJoinInMinutes !== 1 ? "s" : ""
            } before the appointment time (${appointmentStartTime}). Please try again later.`
          );
        } else if (timingStatus.buttonText.includes("Ended")) {
          Alert.alert(
            "Appointment Ended",
            "This appointment has already ended. You can no longer join the video consultation."
          );
        }
      }
      return; // Don't navigate if disabled
    }

    // Validate required parameters
    if (meetingId) {
      // Join existing meeting directly (most efficient path)
      router.push(`/video-consultation/${meetingId}` as any);
    } else if (sessionId && slotIndex !== undefined) {
      // Route to video consultation with appointment parameters
      router.push({
        pathname: "/video-consultation/[meetingId]",
        params: {
          meetingId: "new",
          sessionId,
          slotIndex: slotIndex.toString(),
          type: "appointment",
        },
      } as any);
    } else if (sessionId) {
      // Route to video consultation with session parameters
      router.push({
        pathname: "/video-consultation/[meetingId]",
        params: {
          meetingId: "new",
          sessionId,
          type: "session",
        },
      } as any);
    } else {
      // Create completely new meeting
      router.push(`/video-consultation/new-meeting` as any);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, isButtonDisabled && styles.disabledButton, style]}
      onPress={handlePress}
      disabled={isButtonDisabled}
    >
      <Text
        style={[styles.buttonText, isButtonDisabled && styles.disabledText]}
      >
        {timingStatus.buttonText}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: "#cccccc",
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledText: {
    color: "#666666",
  },
});
