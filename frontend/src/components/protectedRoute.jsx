import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { auth } from "./firebase";

export default function ProtectedRoute({ allowedRoles }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Get user data from localStorage
  const userData = localStorage.getItem("userData");
  const parsedUser = userData ? JSON.parse(userData) : null;

  if (loading) {
    return <div style={{ textAlign: "center", marginTop: "2rem" }}>Loading...</div>;
  }

  // Not logged in → redirect to login
  if (!parsedUser || !user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check role if restriction is set
  if (allowedRoles && !allowedRoles.includes(parsedUser.role)) {
    // Redirect user to their dashboard instead of blocking completely
    if (parsedUser.role === "doctor") return <Navigate to="/doctor-dashboard" replace />;
    if (parsedUser.role === "patient") return <Navigate to="/patient-dashboard" replace />;
    if (parsedUser.role === "admin") return <Navigate to="/admin-dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
