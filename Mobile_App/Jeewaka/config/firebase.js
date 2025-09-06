// Import the functions you need from the SDKs
import { initializeApp } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
import { Platform } from 'react-native';

// Firebase configuration - using the same config as the web app
const firebaseConfig = {
  apiKey: "AIzaSyCRvaFIqS1vTEHQa8c8oX_RlwOxo80-mm8",
  authDomain: "medai-f6b21.firebaseapp.com",
  projectId: "medai-f6b21",
  storageBucket: "medai-f6b21.firebasestorage.app",
  messagingSenderId: "865128551315",
  appId: "1:865128551315:web:886bb65176f6a00b184e66",
  measurementId: "G-TL9BJSKD5T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth based on platform
let auth;
if (Platform.OS === 'web') {
  // Use default auth for web
  auth = getAuth(app);
} else {
  // Use React Native persistence for mobile
  const { getReactNativePersistence } = require('firebase/auth');
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

export { auth };
export default app;
