import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { auth } from "../config/firebase";

// Function to determine the appropriate baseURL
export const getBaseUrl = () => {
  // Check if we have environment variable from .env file
  const envBackendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (envBackendUrl) {
    return envBackendUrl;
  }

  // Always use your specific backend server
  return "http://13.53.53.29:5000";
};

const api = axios.create({
  baseURL: getBaseUrl(),
});

// Add request interceptor for authentication and debugging
api.interceptors.request.use(
  async (config) => {
    // Add Firebase token to requests if user is authenticated
    try {
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
        console.log(
          `API Request with auth: ${config.method?.toUpperCase()} ${
            config.baseURL
          }${config.url}`
        );
      } else {
        console.log(
          `API Request without auth: ${config.method?.toUpperCase()} ${
            config.baseURL
          }${config.url}`
        );
      }
    } catch (error) {
      console.error("Error getting Firebase token:", error);
      // Continue with request even if token retrieval fails
    }

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

// Add response interceptor for debugging and error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    // Don't log expected 404s for verification checks (normal for new doctors)
    if (
      error.response?.status === 404 &&
      error.config?.url?.includes("/api/admin-verification/")
    ) {
      console.log(
        `Verification not found (expected for new doctors): ${error.config.url}`
      );
    } else {
      console.error("API Response Error:", error.message);
      if (error.response) {
        console.error("Error Status:", error.response.status);
        console.error("Error Data:", error.response.data);

        // Handle authentication errors globally
        if (error.response.status === 401) {
          console.warn(
            "Authentication error detected - user may need to re-login"
          );
          // You could emit an event here or call a global logout function
        }
      }
    }
    return Promise.reject(error);
  }
);

// VideoSDK Configuration
export const token = process.env.EXPO_PUBLIC_VIDEOSDK_TOKEN;

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

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  const { roomId } = await res.json();
  return roomId;
};

export default api;
