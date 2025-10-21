import React from "react";
import { View, Text, FlatList } from "react-native";
import VideoParticipantView from "./VideoParticipantView";

interface VideoParticipantListProps {
  participants: string[];
}

export default function VideoParticipantList({
  participants,
}: VideoParticipantListProps) {
  return participants.length > 0 ? (
    <FlatList
      data={participants}
      renderItem={({ item }) => (
        <VideoParticipantView
          participantId={item}
          participantCount={participants.length}
        />
      )}
      numColumns={participants.length > 2 ? 2 : 1}
      key={participants.length > 2 ? "grid" : "single"}
      contentContainerStyle={{
        flex: 1,
        justifyContent: participants.length === 1 ? "center" : "flex-start",
        alignItems: "center",
        padding: 8,
      }}
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
