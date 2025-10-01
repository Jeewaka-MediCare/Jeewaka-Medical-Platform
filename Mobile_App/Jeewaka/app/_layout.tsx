import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { register } from "@videosdk.live/react-native-sdk";
import { registerRootComponent } from "expo";
import { useEffect } from "react";

import { useColorScheme } from "@/hooks/useColorScheme";
import useAuthStore from "../store/authStore";

// Register VideoSDK services before app component registration
register();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { initializeAuth } = useAuthStore();

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // Initialize auth state on app startup
  useEffect(() => {
    initializeAuth();
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="doctor/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="book-session/[sessionId]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="video-consultation/[meetingId]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="video-consultation/appointment/[sessionId]/[slotIndex]"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

registerRootComponent(RootLayout);
