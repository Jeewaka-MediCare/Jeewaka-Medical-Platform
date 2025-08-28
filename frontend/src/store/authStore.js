import { create } from 'zustand';
import { auth } from '../components/firebase';
import { signOut } from 'firebase/auth';

// Utility function to log localStorage state
export const logLocalStorageState = (context) => {
  console.log(`🔐 ${context} - localStorage state:`, {
    userData: localStorage.getItem('userData'),
    userRole: localStorage.getItem('userRole'),
    parsedUserData: localStorage.getItem('userData') ? JSON.parse(localStorage.getItem('userData')) : null,
    parsedUserRole: localStorage.getItem('userRole')
  });
};

// Utility function to check authentication state
export const checkAuthState = (context) => {
  const userData = localStorage.getItem('userData');
  const userRole = localStorage.getItem('userRole');
  const isAuthenticated = !!(userData && userRole);

  console.log(`🔐 ${context} - Auth state check:`, {
    hasUserData: !!userData,
    hasUserRole: !!userRole,
    isAuthenticated: isAuthenticated,
    userData: userData ? JSON.parse(userData) : null,
    userRole: userRole
  });

  return isAuthenticated;
};

const useAuthStore = create((set) => ({
  user: null,
  userRole: null,
  loading: true,
  setUser: (user) => {
    console.log('🔐 AuthStore - setUser called:', user);
    logLocalStorageState('AuthStore before setUser');
    set({ user });
    if (user) {
      localStorage.setItem('userData', JSON.stringify(user));
      logLocalStorageState('AuthStore after setUser');
    } else {
      localStorage.removeItem('userData');
      console.log('🔐 AuthStore - localStorage after removing userData');
    }
  },
  setUserRole: (userRole) => {
    console.log('🔐 AuthStore - setUserRole called:', userRole);
    logLocalStorageState('AuthStore before setUserRole');
    set({ userRole });
    if (userRole) {
      localStorage.setItem('userRole', userRole);
      logLocalStorageState('AuthStore after setUserRole');
    } else {
      localStorage.removeItem('userRole');
      console.log('🔐 AuthStore - localStorage after removing userRole');
    }
  },
  setLoading: (loading) => {
    console.log('🔐 AuthStore - setLoading called:', loading);
    set({ loading });
  },
  logout: async () => {
    console.log('🔐 AuthStore - logout called');
    logLocalStorageState('AuthStore before logout');
    await signOut(auth);
    localStorage.removeItem('userData');
    localStorage.removeItem('userRole');
    set({ user: null, userRole: null });
    logLocalStorageState('AuthStore after logout');
  },
}));

export default useAuthStore; 