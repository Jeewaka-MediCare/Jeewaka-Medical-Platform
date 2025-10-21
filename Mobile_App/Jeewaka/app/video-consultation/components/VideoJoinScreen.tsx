import React, { useState } from "react";
import {
  SafeAreaView,
  TouchableOpacity,
  Text,
  TextInput,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";

interface VideoJoinScreenProps {
  getMeetingId: (id: string | null) => void;
  loading: boolean;
}

export default function VideoJoinScreen({
  getMeetingId,
  loading,
}: VideoJoinScreenProps) {
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
          backgroundColor: "#008080",
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
