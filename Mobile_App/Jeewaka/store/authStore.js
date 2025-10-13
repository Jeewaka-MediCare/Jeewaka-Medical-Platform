import { create } from "zustand";
import { auth } from "../config/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const useAuthStore = create((set, get) => ({
  user: null,
  userRole: null,
  loading: true,
  authToken: null,

  setUser: async (user) => {
    set({ user });
    if (user) {
      await AsyncStorage.setItem("userData", JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem("userData");
    }
  },

  setUserRole: async (userRole) => {
    set({ userRole });
    if (userRole) {
      await AsyncStorage.setItem("userRole", userRole);
    } else {
      await AsyncStorage.removeItem("userRole");
    }
  },

  setAuthToken: (token) => set({ authToken: token }),

  setLoading: (loading) => set({ loading }),

  updateUser: async (updatedUserData) => {
    set({ user: updatedUserData });
    await AsyncStorage.setItem("userData", JSON.stringify(updatedUserData));
  },

  // Get current Firebase token
  getAuthToken: async () => {
    try {
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        set({ authToken: token });
        return token;
      }
      return null;
    } catch (error) {
      console.error("Error getting auth token:", error);
      return null;
    }
  },

  logout: async () => {
    await signOut(auth);
    await AsyncStorage.removeItem("userData");
    await AsyncStorage.removeItem("userRole");
    set({ user: null, userRole: null, authToken: null });
  },

  // Initialize user from AsyncStorage and set up auth listener
  initializeAuth: async () => {
    try {
      const storedUser = await AsyncStorage.getItem("userData");
      const storedRole = await AsyncStorage.getItem("userRole");

      if (storedUser) {
        set({ user: JSON.parse(storedUser) });
      }

      if (storedRole) {
        set({ userRole: storedRole });
      }

      // Set up Firebase auth state listener
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            // Get token and role from Firebase
            const token = await firebaseUser.getIdToken();
            const idTokenResult = await firebaseUser.getIdTokenResult();
            const role = idTokenResult.claims.role;
            
            set({ authToken: token });
            
            // Update role if it's different from stored role
            if (role && role !== get().userRole) {
              await get().setUserRole(role);
            }
          } catch (error) {
            console.error("Error processing Firebase auth state:", error);
          }
        } else {
          // User is logged out
          set({ authToken: null });
        }
      });

      set({ loading: false });
      
      // Return cleanup function
      return unsubscribe;
    } catch (error) {
      console.error("Error loading auth state:", error);
      set({ loading: false });
    }
  },
}));

export default useAuthStore;
