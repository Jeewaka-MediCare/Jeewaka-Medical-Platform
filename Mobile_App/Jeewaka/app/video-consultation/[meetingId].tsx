import React from "react";
import { View, Text } from "react-native";
import { MeetingProvider } from "@videosdk.live/react-native-sdk";
import { useLocalSearchParams, Stack } from "expo-router";
import { token } from "../../services/api";
import VideoMeetingView from "./components/VideoMeetingView";
import { useVideoRouting } from "./hooks/useVideoRouting";

// Main Component
export default function VideoConsultationPage() {
  const {
    meetingId: urlMeetingId,
    sessionId,
    slotIndex,
    type,
  } = useLocalSearchParams();

  const {
    meetingId,
    loading,
    getMeetingId,
    getParticipantName,
    handleSessionMeeting,
    handleAppointmentMeeting,
  } = useVideoRouting(urlMeetingId);

  // Handle session/appointment routing when parameters are provided
  React.useEffect(() => {
    if (urlMeetingId === "new-meeting") {
      // Handle completely new meeting (no appointment/session context)
      getMeetingId(null);
    } else if (
      urlMeetingId === "new" &&
      sessionId &&
      type === "appointment" &&
      slotIndex
    ) {
      // Handle appointment-based meeting (when routed with "new" from VideoCallButton)
      console.log(
        `🎯 Starting appointment meeting flow for session ${sessionId}, slot ${slotIndex}`
      );
      handleAppointmentMeeting(sessionId as string, slotIndex as string);
    } else if (urlMeetingId === "new" && sessionId && type === "session") {
      // Handle session-based meeting (when routed with "new" from VideoCallButton)
      console.log(`🎯 Starting session meeting flow for session ${sessionId}`);
      handleSessionMeeting(sessionId as string);
    } else if (urlMeetingId === "new") {
      // Fallback: create generic new meeting if no context provided
      console.log(
        `🎯 Creating generic new meeting (no appointment/session context)`
      );
      getMeetingId(null);
    }
  }, [
    urlMeetingId,
    sessionId,
    slotIndex,
    type,
    getMeetingId,
    handleSessionMeeting,
    handleAppointmentMeeting,
  ]);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Video Consultation",
          headerShown: true,
          headerStyle: {
            backgroundColor: "#1E293B",
          },
          headerTitleStyle: {
            color: "white",
            fontSize: 20,
            fontWeight: "600",
          },
          headerTintColor: "white",
        }}
      />
      {meetingId &&
      typeof meetingId === "string" &&
      meetingId !== "new" &&
      meetingId !== "new-meeting" ? (
        <MeetingProvider
          config={{
            meetingId,
            micEnabled: false,
            webcamEnabled: true,
            name: getParticipantName(),
          }}
          token={token}
        >
          <VideoMeetingView />
        </MeetingProvider>
      ) : (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#F6F6FF",
            padding: 20,
          }}
        >
          <Text style={{ fontSize: 18, textAlign: "center", marginBottom: 10 }}>
            {loading
              ? "Setting up your meeting..."
              : "Preparing video consultation..."}
          </Text>
          {loading && (
            <Text style={{ fontSize: 14, color: "#666", textAlign: "center" }}>
              Please wait while we connect you to your appointment
            </Text>
          )}
        </View>
      )}
    </>
  );
}
