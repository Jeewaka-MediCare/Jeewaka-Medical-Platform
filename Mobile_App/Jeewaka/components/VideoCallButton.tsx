import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

interface VideoCallButtonProps {
  meetingId?: string;
  sessionId?: string;
  slotIndex?: number;
  style?: any;
  title?: string;
  disabled?: boolean;
}

export default function VideoCallButton({
  meetingId,
  sessionId,
  slotIndex,
  style,
  title = "Start Video Call",
  disabled = false,
}: VideoCallButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    if (disabled) {
      return; // Don't do anything if disabled
    }

    if (meetingId) {
      // Join existing meeting directly
      router.push(`/video-consultation/${meetingId}` as any);
    } else if (sessionId && slotIndex !== undefined) {
      // Route to video consultation with appointment parameters
      router.push({
        pathname: "/video-consultation/[meetingId]",
        params: {
          meetingId: "new",
          sessionId,
          slotIndex,
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
      style={[styles.button, style]}
      onPress={handlePress}
      disabled={disabled}
    >
      <Text style={[styles.buttonText, disabled && styles.disabledText]}>
        {title}
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
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledText: {
    color: "#fcfcfcff",
  },
});
