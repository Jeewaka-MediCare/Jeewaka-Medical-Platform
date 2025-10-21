import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useMeeting } from "@videosdk.live/react-native-sdk";
import { useRouter } from "expo-router";
import VideoParticipantList from "./VideoParticipantList";
import VideoControlsContainer from "./VideoControlsContainer";
import { switchCamera } from "../utils/videoMeetingHelpers";

export default function VideoMeetingView() {
  const [hasJoined, setHasJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();
  const hasJoinedRef = useRef(false);
  const leaveRef = useRef<(() => void) | null>(null);

  const {
    participants,
    join,
    leave,
    toggleWebcam,
    toggleMic,
    getWebcams,
    changeWebcam,
    meetingId,
  } = useMeeting({
    onMeetingJoined: () => {
      console.log("Meeting joined successfully");
      setHasJoined(true);
      hasJoinedRef.current = true;
      setIsJoining(false);
    },
    onMeetingLeft: () => {
      console.log("Meeting left successfully");
      setHasJoined(false);
      hasJoinedRef.current = false;
      setIsJoining(false);
    },
    onError: (error) => {
      console.error("Meeting error:", error);
      setIsJoining(false);
      Alert.alert("Error", "Failed to join meeting. Please try again.");
    },
  });

  const [isUsingFrontCamera, setIsUsingFrontCamera] = useState(false);
  const participantsArrId = [...participants.keys()];

  // Handle camera switching using utility function
  const handleSwitchCamera = async () => {
    await switchCamera(
      getWebcams,
      changeWebcam,
      isUsingFrontCamera,
      setIsUsingFrontCamera
    );
  };

  // Update ref when leave function changes
  useEffect(() => {
    leaveRef.current = leave;
  }, [leave]);

  // Handle proper leaving when component unmounts
  useEffect(() => {
    return () => {
      if (hasJoinedRef.current && leaveRef.current) {
        console.log("Component unmounting, leaving meeting...");
        leaveRef.current();
      }
    };
  }, []);

  const handleJoinMeeting = () => {
    if (!hasJoined && !isJoining) {
      setIsJoining(true);
      join?.();
    }
  };

  const handleLeaveMeeting = () => {
    Alert.alert(
      "Leave Meeting",
      "Are you sure you want to leave the video consultation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: () => {
            leave?.();
            router.back();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F6F6FF" }}>
      {/* Display Meeting ID */}
      {meetingId ? (
        <View
          style={{
            padding: 12,
            backgroundColor: "#c4e4e4ff",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "bold", color: "#008080" }}>
            Meeting ID: {meetingId}
          </Text>
          <Text style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
            Status: {hasJoined ? "Joined" : "Not Joined"}
          </Text>
        </View>
      ) : null}

      {/* Show join button if not joined, otherwise show meeting content */}
      {!hasJoined ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <Text style={{ fontSize: 18, marginBottom: 20, textAlign: "center" }}>
            Ready to join the video consultation?
          </Text>
          <TouchableOpacity
            onPress={handleJoinMeeting}
            disabled={isJoining}
            style={{
              backgroundColor: isJoining ? "#15c7c7ff" : "#008080",
              paddingVertical: 15,
              paddingHorizontal: 30,
              borderRadius: 8,
              minWidth: 150,
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 16,
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              {isJoining ? "Joining..." : "Join Meeting"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Participant List */}
          <View style={{ flex: 1 }}>
            <VideoParticipantList participants={participantsArrId} />
          </View>

          {/* Controls */}
          <VideoControlsContainer
            join={handleJoinMeeting}
            leave={handleLeaveMeeting}
            toggleWebcam={toggleWebcam}
            toggleMic={toggleMic}
            switchCamera={handleSwitchCamera}
            isUsingFrontCamera={isUsingFrontCamera}
            hasJoined={hasJoined}
          />
        </>
      )}
    </SafeAreaView>
  );
}
