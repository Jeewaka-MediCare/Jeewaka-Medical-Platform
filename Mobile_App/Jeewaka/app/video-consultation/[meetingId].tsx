import React from "react";
import { MeetingProvider } from "@videosdk.live/react-native-sdk";
import { useLocalSearchParams, Stack } from "expo-router";
import { token } from "../../services/api";
import VideoJoinScreen from "./components/VideoJoinScreen";
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
      // Handle completely new meeting
      getMeetingId(null);
    } else if (sessionId && type === "appointment" && slotIndex) {
      // Handle appointment-based meeting
      handleAppointmentMeeting(sessionId as string, slotIndex as string);
    } else if (sessionId && type === "session") {
      // Handle session-based meeting
      handleSessionMeeting(sessionId as string);
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
        <VideoJoinScreen getMeetingId={getMeetingId} loading={loading} />
      )}
    </>
  );
}
