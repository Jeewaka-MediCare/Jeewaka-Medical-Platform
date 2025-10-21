import React from "react";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface VideoIconButtonProps {
  onPress: () => void;
  iconName: string;
  backgroundColor: string;
  isActive?: boolean;
}

export default function VideoIconButton({
  onPress,
  iconName,
  backgroundColor,
  isActive = false,
}: VideoIconButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: isActive ? backgroundColor : "#666",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
        borderRadius: 50,
        width: 60,
        height: 60,
        marginHorizontal: 8,
      }}
    >
      <Ionicons name={iconName as any} size={24} color="white" />
    </TouchableOpacity>
  );
}
