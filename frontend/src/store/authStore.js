import { create } from 'zustand';
import { auth } from '../components/firebase';
import { signOut } from 'firebase/auth';

const useAuthStore = create((set) => ({
  user: null,
  userRole: null,
  loading: true,
  setUser: (user) => {
    set({ user });
    if (user) {
      localStorage.setItem('userData', JSON.stringify(user));
    } else {
      localStorage.removeItem('userData');
    }
  },
  setUserRole: (userRole) => {
    set({ userRole });
    if (userRole) {
      localStorage.setItem('userRole', userRole);
    } else {
      localStorage.removeItem('userRole');
    }
  },
  setLoading: (loading) => set({ loading }),
  logout: async () => {
    await signOut(auth);
    localStorage.removeItem('userData');
    localStorage.removeItem('userRole');
    set({ user: null, userRole: null });
  },
}));

export default useAuthStore; 