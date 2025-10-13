"use client"

import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase'
import useAuthStore from '../store/authStore'

export function AuthProvider({ children }) {
  const { user, validateSession, logout, isHydrated } = useAuthStore();
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    console.log('AuthProvider - Component mounted, isHydrated:', isHydrated);

    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('AuthProvider - Firebase auth state changed:', firebaseUser ? 'User logged in' : 'User logged out');

      if (firebaseUser) {
        console.log('AuthProvider - Firebase user authenticated:', firebaseUser.uid);
        // Only validate if we have hydrated and have a user in store
        if (isHydrated && user) {
          if (!validateSession()) {
            console.log('AuthProvider - Session expired, logging out');
            logout();
          } else {
            console.log('AuthProvider - Session valid, user authenticated');
          }
        }
      } else {
        // Only logout if we had a user in Zustand store
        // This prevents clearing state on initial page load
        if (isHydrated && user) {
          console.log('AuthProvider - Firebase user logged out, clearing Zustand state');
          logout();
        } else {
          console.log('AuthProvider - No Firebase user, no Zustand user - initial state');
        }
      }
      
      setIsAuthChecking(false);
    });

    return () => {
      console.log('AuthProvider - Component unmounting, unsubscribing from auth listener');
      unsubscribe();
    }
  }, [isHydrated, validateSession, logout, user])

  // Only show loading on initial mount, not for the entire app
  // This allows login page to render while Firebase is checking auth
  if (!isHydrated) {
    console.log('AuthProvider - Waiting for Zustand hydration');
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return children
}
