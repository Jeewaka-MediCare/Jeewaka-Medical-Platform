import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

interface VideoCallButtonProps {
  meetingId?: string;
  sessionId?: string;
  slotIndex?: number;
  style?: any;
  title?: string;
}

export default function VideoCallButton({
  meetingId,
  sessionId,
  slotIndex,
  style,
  title = "Start Video Call",
}: VideoCallButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    if (meetingId) {
      // Join existing meeting
      router.push(`/video-consultation/${meetingId}` as any);
    } else if (sessionId && slotIndex !== undefined) {
      // Create meeting for this specific appointment
      router.push(
        `/video-consultation/appointment/${sessionId}/${slotIndex}` as any
      );
    } else if (sessionId) {
      // Create meeting for this session (legacy fallback)
      router.push(`/video-consultation/session/${sessionId}` as any);
    } else {
      // Create new meeting
      router.push("/video-consultation/new" as any);
    }
  };

  return (
    <TouchableOpacity style={[styles.button, style]} onPress={handlePress}>
      <Text style={styles.buttonText}>{title}</Text>
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
});
