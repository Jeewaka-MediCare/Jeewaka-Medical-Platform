import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "../services/firebase";
import useAuthStore from "../store/authStore";

export default function ProtectedRoute({ allowedRoles }) {
  const { user, userRole, loading, isHydrated } = useAuthStore();
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  // Wait for Firebase auth to initialize
  useEffect(() => {
    // Firebase auth.currentUser is synchronously available after first init
    // But we need to wait for onAuthStateChanged to fire at least once
    const unsubscribe = auth.onAuthStateChanged(() => {
      setIsFirebaseReady(true);
    });

    return () => unsubscribe();
  }, []);

  // Wait for both Zustand hydration AND Firebase initialization
  if (!isHydrated || loading || !isFirebaseReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Simple auth checks - no fallback localStorage logic needed
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to={`/${userRole}-dashboard`} />;
  }

  return <Outlet />;
}
 