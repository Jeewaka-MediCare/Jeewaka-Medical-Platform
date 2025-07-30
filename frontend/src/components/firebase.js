// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

import {getAuth} from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
export const auth = getAuth(app); // <-- pass app here!
export default app;
