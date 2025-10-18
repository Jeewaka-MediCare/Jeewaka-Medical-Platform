import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useMeeting } from "@videosdk.live/react-native-sdk";
import VideoIconButton from "./VideoIconButton";

interface VideoControlsContainerProps {
  join?: () => void;
  leave?: () => void;
  toggleWebcam?: () => void;
  toggleMic?: () => void;
  switchCamera?: () => void;
  isUsingFrontCamera?: boolean;
  hasJoined?: boolean;
}

export default function VideoControlsContainer({
  join,
  leave,
  toggleWebcam,
  toggleMic,
  switchCamera,
  isUsingFrontCamera,
  hasJoined,
}: VideoControlsContainerProps) {
  const { localMicOn, localWebcamOn } = useMeeting();

  return (
    <View
      style={{
        paddingVertical: 20,
        paddingHorizontal: 16,
        backgroundColor: "#1C1C1C",
        alignItems: "center",
      }}
    >
      {hasJoined ? (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 4,
          }}
        >
          {/* Camera toggle */}
          <VideoIconButton
            onPress={() => toggleWebcam?.()}
            iconName={localWebcamOn ? "videocam" : "videocam-off"}
            backgroundColor="#0aa7a7ff"
            isActive={localWebcamOn}
          />

          {/* Microphone toggle */}
          <VideoIconButton
            onPress={() => toggleMic?.()}
            iconName={localMicOn ? "mic" : "mic-off"}
            backgroundColor="#0aa7a7ff"
            isActive={localMicOn}
          />

          {/* Camera switch */}
          <VideoIconButton
            onPress={() => switchCamera?.()}
            iconName="camera-reverse"
            backgroundColor="#0aa7a7ff"
            isActive={true}
          />

          {/* Leave button */}
          <TouchableOpacity
            onPress={() => leave?.()}
            style={{
              backgroundColor: "#FF0000",
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingVertical: 18,
              borderRadius: 30,
              marginHorizontal: 8,
              minWidth: 80,
            }}
          >
            <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>
              Leave
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ color: "white", fontSize: 14 }}>
            Join the meeting to access controls
          </Text>
        </View>
      )}
    </View>
  );
}
