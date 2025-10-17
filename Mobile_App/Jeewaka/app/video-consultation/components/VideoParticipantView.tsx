import React from "react";
import { View, Text, Dimensions } from "react-native";
import {
  useParticipant,
  MediaStream,
  RTCView,
} from "@videosdk.live/react-native-sdk";

interface VideoParticipantViewProps {
  participantId: string;
  participantCount: number;
}

export default function VideoParticipantView({
  participantId,
  participantCount,
}: VideoParticipantViewProps) {
  const { webcamStream, webcamOn, displayName, isLocal } =
    useParticipant(participantId);

  // Get screen dimensions
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

  // Calculate dynamic height based on screen size and participant count
  const getVideoHeight = () => {
    if (participantCount === 1) {
      // Single participant - use most of the screen height (minus controls)
      return screenHeight * 0.7;
    } else if (participantCount === 2) {
      // Two participants - split screen vertically
      return screenHeight * 0.35;
    } else {
      // Multiple participants - grid view
      return screenHeight * 0.25;
    }
  };

  const getVideoWidth = () => {
    if (participantCount <= 2) {
      // Single column - use most of screen width with margins
      return screenWidth - 32; // 16px margin on each side
    } else {
      // Grid view - two columns
      return (screenWidth - 48) / 2; // Account for margins and spacing between columns
    }
  };

  return webcamOn && webcamStream ? (
    <View
      style={{
        margin: 8,
        width: getVideoWidth(),
        height: getVideoHeight(),
      }}
    >
      <RTCView
        streamURL={new MediaStream([webcamStream.track]).toURL()}
        objectFit={"cover"}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 10,
          backgroundColor: "#000",
        }}
      />
      {/* Participant name overlay */}
      <Text
        style={{
          position: "absolute",
          bottom: 18,
          left: 18,
          color: "white",
          backgroundColor: "rgba(0,0,0,0.5)",
          padding: 5,
          borderRadius: 5,
          fontSize: 12,
        }}
      >
        {displayName || "Guest"} {isLocal && "(You)"}
      </Text>
    </View>
  ) : (
    <View
      style={{
        backgroundColor: "grey",
        width: getVideoWidth(),
        height: getVideoHeight(),
        justifyContent: "center",
        alignItems: "center",
        margin: 8,
        borderRadius: 10,
      }}
    >
      <Text style={{ fontSize: 50 }}>👤</Text>
      <Text style={{ fontSize: 16, color: "white", marginTop: 10 }}>
        {displayName || "NO MEDIA"}
      </Text>
      {isLocal && (
        <Text style={{ fontSize: 12, color: "white", marginTop: 5 }}>
          (You)
        </Text>
      )}
    </View>
  );
}
