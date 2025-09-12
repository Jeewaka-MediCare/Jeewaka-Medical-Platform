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

  // Always use your specific backend server
  return "http://10.191.245.57:5000";
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
