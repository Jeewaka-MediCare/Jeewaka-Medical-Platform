import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth } from '../components/firebase';
import { signOut, signInWithEmailAndPassword } from 'firebase/auth';
import api from '../services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      userRole: null,
      loading: false,
      isHydrated: false,

      // Centralized login method - SINGLE source of truth
      login: async (email, password) => {
        console.log('AuthStore - Login attempt');
        set({ loading: true });
        
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          const idTokenResult = await user.getIdTokenResult();
          const role = idTokenResult.claims.role || "patient";

          let mergedUserData = { ...user, role };
          
          // Fetch backend profile data
          try {
            let res;
            if (role === "doctor") {
              console.log('Fetching doctor profile for uid:', user.uid);
              res = await api.get(`/api/doctor/uuid/${user.uid}`);
              mergedUserData = { ...user, ...res.data, role: "doctor" };
              console.log('Doctor profile loaded:', res.data._id);
            } else if (role === "patient") {
              console.log('Fetching patient profile for uid:', user.uid);
              res = await api.get(`/api/patient/uuid/${user.uid}`);
              mergedUserData = { ...user, ...res.data, role: "patient" };
              console.log('Patient profile loaded:', res.data._id);
            } else if (role === "admin") {
              console.log('Fetching admin profile for uid:', user.uid);
              res = await api.get(`/api/admin/uuid/${user.uid}`);
              mergedUserData = { ...user, ...res.data, role: "admin" };
              console.log('Admin profile loaded:', res.data._id);
            }
          } catch (apiError) {
            console.error('AuthStore - API call failed:', {
              message: apiError.message,
              status: apiError.response?.status,
              data: apiError.response?.data,
              url: apiError.config?.url
            });
            console.warn('⚠️ Using Firebase data only - backend profile not loaded');
            mergedUserData = {
              ...user,
              name: user.displayName || user.email || "Unknown",
              email: user.email,
              role
            };
          }

          // Single state update - Zustand persist handles localStorage automatically
          set({ user: mergedUserData, userRole: role, loading: false });
          
          return { success: true, user: mergedUserData, role };
          
        } catch (error) {
          set({ loading: false });
          return { success: false, error: error.message };
        }
      },

      // Centralized logout
      logout: async () => {
        console.log('AuthStore - Logout');
        await signOut(auth);
        set({ user: null, userRole: null });
        // Zustand persist automatically clears localStorage
      },

      // Token validation
      validateSession: () => {
        const { user } = get();
        if (!user?.stsTokenManager?.expirationTime) return false;
        return Date.now() < user.stsTokenManager.expirationTime;
      },

      // Initialize on app start
      initializeAuth: () => {
        const { user, userRole } = get();
        if (user && userRole) {
          const isValid = get().validateSession();
          if (!isValid) {
            set({ user: null, userRole: null });
          }
        }
        set({ loading: false });
      }
    }),
    {
      name: 'jeewaka-auth',
      partialize: (state) => ({
        user: state.user,
        userRole: state.userRole,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true;
          state.initializeAuth();
        }
      },
    }
  )
);

export default useAuthStore; 