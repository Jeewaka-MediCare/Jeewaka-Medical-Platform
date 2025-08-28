"use client"

import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import useAuthStore from '../store/authStore'

export function AuthProvider({ children }) {
  const { setUser, setUserRole, setLoading, logout } = useAuthStore()

  useEffect(() => {
    console.log('🔐 AuthProvider - Component mounted');
    console.log('🔐 AuthProvider - Initial localStorage state:', {
      userData: localStorage.getItem('userData'),
      userRole: localStorage.getItem('userRole')
    });

    setLoading(true)

    // Immediately restore user state from localStorage
    const restoreUserFromStorage = () => {
      const savedUserData = localStorage.getItem('userData');
      const savedUserRole = localStorage.getItem('userRole');

      console.log('🔐 AuthProvider - Attempting to restore from localStorage');
      console.log('🔐 AuthProvider - Raw savedUserData:', savedUserData);
      console.log('🔐 AuthProvider - Raw savedUserRole:', savedUserRole);

      if (savedUserData) {
        try {
          const userData = JSON.parse(savedUserData);
          console.log('🔐 AuthProvider - Parsed userData:', userData);
          console.log('🔐 AuthProvider - UserData keys:', Object.keys(userData));

          // Check if tokens are still valid
          const now = Date.now();
          const expirationTime = userData.stsTokenManager?.expirationTime;

          console.log('🔐 AuthProvider - Current time:', now);
          console.log('🔐 AuthProvider - Token expiration:', expirationTime);
          console.log('🔐 AuthProvider - Token expired:', expirationTime ? now >= expirationTime : 'No expiration time');

          if (expirationTime && now >= expirationTime) {
            console.log('🔐 AuthProvider - Token expired, clearing localStorage');
            localStorage.removeItem('userData');
            localStorage.removeItem('userRole');
            console.log('🔐 AuthProvider - localStorage cleared due to expired token');
            return;
          }

          // Validate the user data structure
          const hasFirebaseProps = userData.uid && userData.email && userData.stsTokenManager;
          const hasBackendProps = userData._id && userData.name;

          console.log('🔐 AuthProvider - Validation results:', {
            hasFirebaseProps,
            hasBackendProps,
            isValidUser: hasFirebaseProps && hasBackendProps
          });

          if (!hasFirebaseProps) {
            console.warn('🔐 AuthProvider - User data missing Firebase properties, clearing localStorage');
            localStorage.removeItem('userData');
            localStorage.removeItem('userRole');
            return;
          }

          // Use the complete merged user object (Firebase + backend data)
          console.log('🔐 AuthProvider - Restoring complete merged user object');
          console.log('🔐 AuthProvider - User object keys:', Object.keys(userData));
          console.log('🔐 AuthProvider - Has Firebase properties:', {
            uid: !!userData.uid,
            email: !!userData.email,
            stsTokenManager: !!userData.stsTokenManager
          });
          console.log('🔐 AuthProvider - Has backend properties:', {
            _id: !!userData._id,
            name: !!userData.name,
            role: userData.role
          });

          setUser(userData);

          if (savedUserRole) {
            console.log('🔐 AuthProvider - Restoring user role from localStorage:', savedUserRole);
            setUserRole(savedUserRole);
          } else {
            console.log('🔐 AuthProvider - No saved role, setting default: patient');
            setUserRole('patient'); // Default role
          }

          console.log('🔐 AuthProvider - User state restored from localStorage successfully');
        } catch (error) {
          console.error('🔐 AuthProvider - Error parsing saved user data:', error);
          console.error('🔐 AuthProvider - Error details:', error.message);
          localStorage.removeItem('userData');
          localStorage.removeItem('userRole');
          console.log('🔐 AuthProvider - localStorage cleared due to parse error');
        }
      } else {
        console.log('🔐 AuthProvider - No saved user data found in localStorage');
      }
    };

    // Restore user immediately
    restoreUserFromStorage();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('🔐 AuthProvider - Firebase auth state changed:', currentUser ? 'User logged in' : 'User logged out');
      console.log('🔐 AuthProvider - Firebase user object:', currentUser);

      if (currentUser) {
        console.log('🔐 AuthProvider - Firebase confirmed user is authenticated');
        // Firebase confirmed the user is authenticated, update with fresh data
        setUser(currentUser)

        // Get user role from localStorage or API
        const savedRole = localStorage.getItem('userRole')
        console.log('🔐 AuthProvider - Saved role from localStorage:', savedRole);

        if (savedRole) {
          console.log('🔐 AuthProvider - Using saved role:', savedRole);
          setUserRole(savedRole)
        } else {
          // If no role saved, you might want to fetch it from your backend
          // For now, we'll set it as patient by default
          console.log('🔐 AuthProvider - No saved role, setting default: patient');
          setUserRole('patient')
        }
      } else {
        console.log('🔐 AuthProvider - Firebase confirmed user is NOT authenticated');
        // Firebase says user is not authenticated, clear localStorage
        localStorage.removeItem('userData');
        localStorage.removeItem('userRole');
        logout()
      }

      console.log('🔐 AuthProvider - Setting loading to false');
      setLoading(false)

      console.log('🔐 AuthProvider - Final localStorage state:', {
        userData: localStorage.getItem('userData'),
        userRole: localStorage.getItem('userRole')
      });
    })

    return () => {
      console.log('🔐 AuthProvider - Component unmounting, unsubscribing from auth listener');
      unsubscribe()
    }
  }, [setUser, setUserRole, setLoading, logout])

  return children
}
