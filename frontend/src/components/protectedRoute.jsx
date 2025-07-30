import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Navigate, Outlet } from 'react-router-dom';
import { auth } from './firebase';

export default function ProtectedRoute() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Check both Firebase and localStorage
  const userData = localStorage.getItem("userData");

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '2rem' }}>Loading...</div>;
  }

  if (!userData) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
