// Import the functions you need from the SDKs
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

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
export const auth = getAuth(app);
export default app;
