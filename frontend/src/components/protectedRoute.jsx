import { useEffect, useState } from "react";
import { useMemo } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function ProtectedRoute({ allowedRoles }) {
  const location = useLocation();

  // Use the central auth store so restored localStorage user from AuthProvider
  // is available immediately and we avoid race conditions between components.
  const { user: storeUser, userRole: storeUserRole, loading: storeLoading } = useAuthStore();

  console.log('\ud83d\udd10 ProtectedRoute - Component rendered for path:', location.pathname);
  console.log('\ud83d\udd10 ProtectedRoute - Allowed roles:', allowedRoles);
  console.log('\ud83d\udd10 ProtectedRoute - Auth store state:', { storeUser, storeUserRole, storeLoading });

  // Derive a parsedUser using the store first, falling back to localStorage
  const parsedUser = useMemo(() => {
    if (storeUser) return storeUser;
    try {
      const userData = localStorage.getItem("userData");
      return userData ? JSON.parse(userData) : null;
    } catch (e) {
      console.error('\ud83d\udd10 ProtectedRoute - Error parsing localStorage userData fallback:', e);
      return null;
    }
  }, [storeUser]);

  const effectiveRole = storeUserRole || (parsedUser && parsedUser.role) || null;

  // Defensive one-shot fallback: if parsedUser is null but the store finished loading,
  // wait a tiny tick and re-check localStorage once. This avoids redirecting to login
  // when AuthProvider is still finishing restoring state.
  const [fallbackChecked, setFallbackChecked] = useState(false);
  const [fallbackUser, setFallbackUser] = useState(null);

  useEffect(() => {
    if (!parsedUser && !storeLoading && !fallbackChecked) {
      console.log('\ud83d\udd10 ProtectedRoute - Performing one-shot fallback localStorage re-check');
      const t = setTimeout(() => {
        try {
          const raw = localStorage.getItem('userData');
          const reParsed = raw ? JSON.parse(raw) : null;
          if (reParsed) {
            console.log('\ud83d\udd10 ProtectedRoute - Fallback found user in localStorage:', reParsed);
            setFallbackUser(reParsed);
          } else {
            console.log('\ud83d\udd10 ProtectedRoute - Fallback found no user in localStorage');
          }
        } catch (e) {
          console.error('\ud83d\udd10 ProtectedRoute - Fallback parse error:', e);
        }
        setFallbackChecked(true);
      }, 120); // short delay to allow AuthProvider to finish
      return () => clearTimeout(t);
    }
  }, [parsedUser, storeLoading, fallbackChecked]);

  const finalUser = parsedUser || fallbackUser;
  const finalRole = storeUserRole || (finalUser && finalUser.role) || null;

  // While the auth system is initializing, show a loader
  if (storeLoading) {
    console.log('\ud83d\udd10 ProtectedRoute - Auth store loading, showing loading screen');
    return <div style={{ textAlign: "center", marginTop: "2rem" }}>Loading...</div>;
  }

  // Not authenticated -> redirect to login
  if (!finalUser) {
    console.log('\ud83d\udd10 ProtectedRoute - No user found after fallback, redirecting to login', { parsedUser, fallbackUser, storeUser });
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Role-based restriction
  if (allowedRoles && finalRole && !allowedRoles.includes(finalRole)) {
    console.log('\ud83d\udd10 ProtectedRoute - Role mismatch, redirecting to appropriate dashboard', { finalRole });
    if (finalRole === "doctor") return <Navigate to="/doctor-dashboard" replace />;
    if (finalRole === "patient") return <Navigate to="/patient-dashboard" replace />;
    if (finalRole === "admin") return <Navigate to="/admin-dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
 