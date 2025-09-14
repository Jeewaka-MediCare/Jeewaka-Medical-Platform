import { create } from 'zustand';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useAuthStore = create((set) => ({
  user: null,
  userRole: null,
  loading: true,
  
  setUser: async (user) => {
    set({ user });
    if (user) {
      await AsyncStorage.setItem('userData', JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem('userData');
    }
  },
  
  setUserRole: async (userRole) => {
    set({ userRole });
    if (userRole) {
      await AsyncStorage.setItem('userRole', userRole);
    } else {
      await AsyncStorage.removeItem('userRole');
    }
  },
  
  setLoading: (loading) => set({ loading }),
  
  logout: async () => {
    await signOut(auth);
    await AsyncStorage.removeItem('userData');
    await AsyncStorage.removeItem('userRole');
    set({ user: null, userRole: null });
  },
  
  // Initialize user from AsyncStorage
  initializeAuth: async () => {
    try {
      const storedUser = await AsyncStorage.getItem('userData');
      const storedRole = await AsyncStorage.getItem('userRole');
      
      if (storedUser) {
        set({ user: JSON.parse(storedUser) });
      }
      
      if (storedRole) {
        set({ userRole: storedRole });
      }
      
      set({ loading: false });
    } catch (error) {
      console.error('Error loading auth state:', error);
      set({ loading: false });
    }
  },
}));

export default useAuthStore;
