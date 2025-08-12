import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Function to determine the appropriate baseURL
const getBaseUrl = () => {
  // When running in an Expo development build or Expo Go
  if (__DEV__) {
    // For Android emulator
    if (Platform.OS === 'android' && !Constants.expoConfig?.debuggerHost) {
      return 'http://10.0.2.2:5000';
    }
    
    // For iOS simulator
    if (Platform.OS === 'ios' && !Constants.expoConfig?.debuggerHost) {
      return 'http://localhost:5000';
    }
    
    // For physical device via Expo Go
    // Extract the IP address from the debuggerHost
    const debuggerHost = Constants.expoConfig?.debuggerHost;
    if (debuggerHost) {
      const hostAddress = debuggerHost.split(':')[0];
      return `http://${hostAddress}:5000`;
    }
  }
  
  // Fallback or production URL
  return 'http://10.0.2.2:5000'; // Replace with your production API URL in real deployment
};

const api = axios.create({
  baseURL: getBaseUrl(),
});

export default api;
