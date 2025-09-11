import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";

// Function to determine the appropriate baseURL
const getBaseUrl = () => {
  // Check if we have environment variable from .env file
  const envBackendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (envBackendUrl) {
    console.log(`Using backend URL from environment: ${envBackendUrl}`);
    return envBackendUrl;
  }

  // When running in an Expo development build or Expo Go
  if (__DEV__) {
    // For Android emulator
    if (Platform.OS === "android" && !Constants.expoConfig?.debuggerHost) {
      return "http://10.0.2.2:5000";
    }

    // For iOS simulator
    if (Platform.OS === "ios" && !Constants.expoConfig?.debuggerHost) {
      return "http://localhost:5000";
    }

    // For physical device via Expo Go
    // Extract the IP address from the debuggerHost
    const debuggerHost = Constants.expoConfig?.debuggerHost;
    if (debuggerHost) {
      const hostAddress = debuggerHost.split(":")[0];
      console.log(`Debugging on ${hostAddress}`);
      return `http://${hostAddress}:5000`;
    }
  }

  // Fallback or production URL
  return "http://10.13.0.57:5000"; // Replace with your production API URL in real deployment
};

const api = axios.create({
  baseURL: getBaseUrl(),
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(
      `API Request: ${config.method?.toUpperCase()} ${config.baseURL}${
        config.url
      }`
    );
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error("API Response Error:", error.message);
    if (error.response) {
      console.error("Error Status:", error.response.status);
      console.error("Error Data:", error.response.data);
    }
    return Promise.reject(error);
  }
);

// VideoSDK Configuration
export const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiIyYjEyMDdkMy0zMTMwLTQ5ZjAtYmZkYS01OTAyNDQ1N2ZhMTciLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIl0sImlhdCI6MTc1NzUwMjExOCwiZXhwIjoxNzY1Mjc4MTE4fQ.tZ_PyETvrvAQamQ2dBo2CXZyMXZj9gBCdvQIVwjXsaA";

// API call to create meeting
export const createMeeting = async ({ token }) => {
  const res = await fetch(`https://api.videosdk.live/v2/rooms`, {
    method: "POST",
    headers: {
      authorization: `${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  const { roomId } = await res.json();
  return roomId;
};

export default api;
