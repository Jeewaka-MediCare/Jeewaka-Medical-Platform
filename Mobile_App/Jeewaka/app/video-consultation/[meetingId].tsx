import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  TouchableOpacity,
  Text,
  View,
  Alert,
  TextInput,
  FlatList,
} from "react-native";
import {
  MeetingProvider,
  useMeeting,
  useParticipant,
  MediaStream,
  RTCView,
} from "@videosdk.live/react-native-sdk";
import { useLocalSearchParams, useRouter } from "expo-router";
import { createMeeting, token } from "../../services/api";
import useAuthStore from "../../store/authStore";

// Reusable Button Component (from example)
const Button = ({
  onPress,
  buttonText,
  backgroundColor,
}: {
  onPress: () => void;
  buttonText: string;
  backgroundColor: string;
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: backgroundColor,
        justifyContent: "center",
        alignItems: "center",
        padding: 12,
        borderRadius: 4,
        minWidth: 80,
      }}
    >
      <Text style={{ color: "white", fontSize: 12, textAlign: "center" }}>
        {buttonText}
      </Text>
    </TouchableOpacity>
  );
};

// Controls Component
function ControlsContainer({
  join,
  leave,
  toggleWebcam,
  toggleMic,
  switchCamera,
  isUsingFrontCamera,
  hasJoined,
}: {
  join?: () => void;
  leave?: () => void;
  toggleWebcam?: () => void;
  toggleMic?: () => void;
  switchCamera?: () => void;
  isUsingFrontCamera?: boolean;
  hasJoined?: boolean;
}) {
  // Get local state from useMeeting hook
  const { localMicOn, localWebcamOn } = useMeeting();

  return (
    <View
      style={{
        padding: 24,
        backgroundColor: "#1C1C1C",
      }}
    >
      {/* Only show controls if user has joined */}
      {hasJoined ? (
        <>
          {/* First row of controls */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <Button
              onPress={() => {
                toggleWebcam?.();
              }}
              buttonText={localWebcamOn ? "Turn Off Cam" : "Turn On Cam"}
              backgroundColor={"#1178F8"}
            />
            <Button
              onPress={() => {
                switchCamera?.();
              }}
              buttonText={`Switch to ${
                isUsingFrontCamera ? "Back" : "Front"
              } Camera`}
              backgroundColor={"#FF9500"}
            />
          </View>
          {/* Second row of controls */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Button
              onPress={() => {
                toggleMic?.();
              }}
              buttonText={localMicOn ? "Turn Off Mic" : "Turn On Mic"}
              backgroundColor={"#1178F8"}
            />
            <Button
              onPress={() => leave?.()}
              buttonText={"Leave"}
              backgroundColor={"#FF0000"}
            />
          </View>
        </>
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

// Participant View Component (Enhanced version of example)
function ParticipantView({ participantId }: { participantId: string }) {
  const { webcamStream, webcamOn, displayName, isLocal } =
    useParticipant(participantId);

  return webcamOn && webcamStream ? (
    <View style={{ flex: 1, margin: 8 }}>
      <RTCView
        streamURL={new MediaStream([webcamStream.track]).toURL()}
        objectFit={"cover"}
        style={{
          height: 300,
          marginVertical: 8,
          marginHorizontal: 8,
          borderRadius: 10,
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
        height: 300,
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

// Participant List Component (from example)
function ParticipantList({ participants }: { participants: string[] }) {
  return participants.length > 0 ? (
    <FlatList
      data={participants}
      renderItem={({ item }) => {
        return <ParticipantView participantId={item} />;
      }}
      numColumns={participants.length > 2 ? 2 : 1}
      key={participants.length > 2 ? "grid" : "single"}
      contentContainerStyle={{ flex: 1 }}
    />
  ) : (
    <View
      style={{
        flex: 1,
        backgroundColor: "#F6F6FF",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 20 }}>Press Join button to enter meeting.</Text>
    </View>
  );
}

// Meeting View Component
function MeetingView() {
  const [hasJoined, setHasJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isUsingFrontCamera, setIsUsingFrontCamera] = useState(false); // Track current camera
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
  const participantsArrId = [...participants.keys()];

  // Update ref when leave function changes
  useEffect(() => {
    leaveRef.current = leave;
  }, [leave]);

  // Debug: Track camera state changes
  useEffect(() => {
    console.log(
      "Camera state changed - isUsingFrontCamera:",
      isUsingFrontCamera
    );
  }, [isUsingFrontCamera]);

  // Handle proper leaving when component unmounts
  useEffect(() => {
    return () => {
      if (hasJoinedRef.current && leaveRef.current) {
        console.log("Component unmounting, leaving meeting...");
        leaveRef.current();
      }
    };
  }, []); // Empty dependency array - only run on mount/unmount

  const handleJoinMeeting = () => {
    if (!hasJoined && !isJoining) {
      setIsJoining(true);
      join?.();
      // Don't set hasJoined here - wait for onMeetingJoined callback
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
            // Don't set hasJoined here - wait for onMeetingLeft callback
            router.back();
          },
        },
      ]
    );
  };

  // Handle camera switching
  const handleSwitchCamera = async () => {
    try {
      console.log("=== CAMERA SWITCH START ===");
      console.log("Current state - isUsingFrontCamera:", isUsingFrontCamera);

      const webcams = await getWebcams();
      console.log("Available cameras:", webcams);

      if (webcams && webcams.length > 1) {
        // Enhanced camera detection
        console.log("Detailed camera info:");
        webcams.forEach((cam, index) => {
          console.log(`Camera ${index}:`, {
            deviceId: cam.deviceId,
            label: cam.label,
            facingMode: cam.facingMode,
          });
        });

        // Find front and back cameras with multiple detection methods
        const frontCamera = webcams.find(
          (cam) =>
            cam.label?.toLowerCase().includes("front") ||
            cam.label?.toLowerCase().includes("user") ||
            cam.label?.toLowerCase().includes("facing") ||
            cam.label?.toLowerCase().includes("selfie") ||
            cam.facingMode === "user" ||
            cam.deviceId?.includes("front") ||
            cam.deviceId?.includes("1") // Often front camera is camera 1
        );

        const backCamera = webcams.find(
          (cam) =>
            cam.label?.toLowerCase().includes("back") ||
            cam.label?.toLowerCase().includes("environment") ||
            cam.label?.toLowerCase().includes("rear") ||
            cam.label?.toLowerCase().includes("main") ||
            cam.facingMode === "environment" ||
            cam.deviceId?.includes("back") ||
            cam.deviceId?.includes("0") // Often back camera is camera 0
        );

        console.log("Front camera found:", frontCamera);
        console.log("Back camera found:", backCamera);

        // Toggle between cameras
        if (frontCamera && backCamera) {
          const targetCamera = isUsingFrontCamera ? backCamera : frontCamera;
          const newCameraType = isUsingFrontCamera ? "back" : "front";
          console.log("Target camera:", targetCamera);
          console.log("Switching TO:", newCameraType);

          try {
            await changeWebcam(targetCamera.deviceId);
            console.log("changeWebcam call successful");

            setIsUsingFrontCamera(!isUsingFrontCamera);
            console.log(
              "State updated. New state should be:",
              !isUsingFrontCamera
            );

            Alert.alert(
              "Camera Switched",
              `Switched to ${newCameraType} camera`
            );
          } catch (changeError) {
            console.error("Error in changeWebcam:", changeError);
            Alert.alert("Error", "Failed to change camera. Please try again.");
          }
        } else {
          // Fallback: cycle through available cameras
          const currentIndex = 0; // You might want to track this
          const nextIndex = (currentIndex + 1) % webcams.length;
          const nextCamera = webcams[nextIndex];

          if (nextCamera?.deviceId) {
            await changeWebcam(nextCamera.deviceId);
            Alert.alert("Camera Switched", "Switched to next available camera");
          }
        }
      } else if (webcams && webcams.length === 1) {
        Alert.alert("Camera Switch", "Only one camera found on this device.");
      } else {
        Alert.alert("Camera Switch", "No cameras found on this device.");
      }
    } catch (error) {
      console.error("Error switching camera:", error);
      Alert.alert("Error", "Unable to switch camera. Please try again.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F6F6FF" }}>
      {/* Display Meeting ID */}
      {meetingId ? (
        <View
          style={{
            padding: 12,
            backgroundColor: "#E8F4FD",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "bold", color: "#1178F8" }}>
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
              backgroundColor: isJoining ? "#ccc" : "#1178F8",
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
          {/* Use ParticipantList component when joined */}
          <View style={{ flex: 1 }}>
            <ParticipantList participants={participantsArrId} />
          </View>

          {/* Pass updated props to ControlsContainer */}
          <ControlsContainer
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

// Join Screen Component
function JoinScreen({
  getMeetingId,
  loading,
}: {
  getMeetingId: (id: string | null) => void;
  loading: boolean;
}) {
  const [meetingVal, setMeetingVal] = useState("");
  const router = useRouter();

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#F6F6FF",
        justifyContent: "center",
        paddingHorizontal: 60,
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          marginBottom: 30,
          alignSelf: "center",
        }}
      >
        Video Consultation
      </Text>

      <TouchableOpacity
        onPress={() => getMeetingId(null)}
        disabled={loading}
        style={{
          backgroundColor: loading ? "#ccc" : "#1178F8",
          padding: 12,
          borderRadius: 6,
          marginBottom: 16,
        }}
      >
        <Text style={{ color: "white", alignSelf: "center", fontSize: 18 }}>
          {loading ? "Creating Meeting..." : "Create Meeting"}
        </Text>
      </TouchableOpacity>

      <Text
        style={{
          alignSelf: "center",
          fontSize: 22,
          marginVertical: 16,
          fontStyle: "italic",
          color: "grey",
        }}
      >
        ---------- OR ----------
      </Text>

      <TextInput
        value={meetingVal}
        onChangeText={setMeetingVal}
        placeholder={"XXXX-XXXX-XXXX"}
        style={{
          padding: 12,
          borderWidth: 1,
          borderRadius: 6,
          fontStyle: "italic",
          borderColor: "#ddd",
          backgroundColor: "white",
        }}
      />

      <TouchableOpacity
        style={{
          backgroundColor: "#1178F8",
          padding: 12,
          marginTop: 14,
          borderRadius: 6,
        }}
        onPress={() => {
          if (meetingVal.trim()) {
            getMeetingId(meetingVal.trim());
          } else {
            Alert.alert("Error", "Please enter a valid meeting ID");
          }
        }}
        disabled={loading || !meetingVal.trim()}
      >
        <Text style={{ color: "white", alignSelf: "center", fontSize: 18 }}>
          Join Meeting
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.back()}
        style={{
          backgroundColor: "#666",
          padding: 12,
          marginTop: 20,
          borderRadius: 6,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontSize: 16 }}>Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// Main Component
export default function VideoConsultationPage() {
  const { meetingId: urlMeetingId } = useLocalSearchParams();
  const [meetingId, setMeetingId] = useState(urlMeetingId || null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, userRole } = useAuthStore();

  const getMeetingId = async (id: string | null) => {
    try {
      setLoading(true);
      // Create a new meeting if id is null or "new"
      const newMeetingId =
        id == null || id === "new" ? await createMeeting({ token }) : id;
      setMeetingId(newMeetingId);

      // Update the URL to include the meeting ID
      if (!id || id === "new") {
        router.replace(`/video-consultation/${newMeetingId}` as any);
      }
    } catch (error) {
      console.error("Error creating meeting:", error);
      Alert.alert("Error", "Failed to create meeting. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-join if meetingId is provided in URL, or create new meeting if "new"
  useEffect(() => {
    if (urlMeetingId && typeof urlMeetingId === "string") {
      if (urlMeetingId === "new") {
        // Trigger meeting creation for "new" meetings
        getMeetingId("new");
      } else {
        // Use existing meeting ID
        setMeetingId(urlMeetingId);
      }
    }
  }, [urlMeetingId]);

  // Generate unique participant name based on user info
  const getParticipantName = () => {
    if (user?.name) {
      return `${user.name} (${userRole === "doctor" ? "Doctor" : "Patient"})`;
    }
    return userRole === "doctor" ? "Doctor" : "Patient";
  };

  return meetingId && typeof meetingId === "string" ? (
    <MeetingProvider
      config={{
        meetingId,
        micEnabled: false,
        webcamEnabled: true,
        name: getParticipantName(),
      }}
      token={token}
    >
      <MeetingView />
    </MeetingProvider>
  ) : (
    <JoinScreen getMeetingId={getMeetingId} loading={loading} />
  );
}
