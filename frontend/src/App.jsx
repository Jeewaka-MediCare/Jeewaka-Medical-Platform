import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import SignupPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorOverviewPage from "./pages/DoctorOverviewPage";
import ProtectedRoute from "./components/protectedRoute";
import SideBarApp from "./Layout.jsx/mainLayout";
import DoctorLayout from "./Layout.jsx/doctorLayout"; // Import DoctorLayout
import DoctorProfileSetting from "./pages/DoctorProfileSetting";
import DoctorDetailsPage from "./pages/DoctorViewPage";

import AppointmentsPage from "./pages/appointmentPage";
import AppointmentDetails from "./pages/AppointmentDetails";
import AdminDashboard from "./pages/AdminDashBoard";
import MedicalRecordsPage from "./pages/MedicalRecordsPage";
import PaymentsPage from "./pages/PaymentsPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCheckout from "./pages/PaymentCheckout";
import { Navbar } from "./components/navBar";
import PatientLayout from "./Layout.jsx/patientLayout";
import LandingPage from "./pages/LandingPage";
import AdminFinancePage from "./pages/AdminFinancePage";
import { AdminLayout } from "./Layout.jsx/adminLayOut";
import DoctorFinance from "./pages/DoctorFinance";
import { AuthProvider } from "./components/AuthProvider";
import { Toaster } from "./components/ui/sonner";
import MedicalChatWidget from "./components/MedicalChatWidget";
import useAuthStore from "./store/authStore";
import AdminVerificationPending from "./pages/AdminVerificationPending";
import UserManualPage from "./pages/UserManualPage";
function App() {
  useEffect(() => {
    console.log("🔐 App - Component mounted");
    console.log("🔐 App - Initial localStorage state:", {
      userData: localStorage.getItem("userData"),
      userRole: localStorage.getItem("userRole"),
    });

    // Listen for localStorage changes (for debugging)
    const handleStorageChange = (e) => {
      if (e.key === "userData" || e.key === "userRole") {
        console.log("🔐 App - localStorage changed:", {
          key: e.key,
          oldValue: e.oldValue,
          newValue: e.newValue,
        });
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Enhanced localStorage monitoring (only in development)
    if (process.env.NODE_ENV === "development") {
      const originalSetItem = localStorage.setItem;
      const originalRemoveItem = localStorage.removeItem;
      const originalGetItem = localStorage.getItem;

      localStorage.setItem = function (key, value) {
        console.log(`🔐 localStorage - setItem [${key}]:`, value);
        console.log(
          `🔐 localStorage - setItem [${key}] length:`,
          value ? value.length : 0
        );
        try {
          const parsed = JSON.parse(value);
          console.log(
            `🔐 localStorage - setItem [${key}] parsed keys:`,
            Object.keys(parsed)
          );
        } catch (e) {
          console.log(`🔐 localStorage - setItem [${key}] raw value:`, value);
        }
        originalSetItem.apply(this, arguments);
      };

      localStorage.removeItem = function (key) {
        console.log(`🔐 localStorage - removeItem [${key}]`);
        originalRemoveItem.apply(this, arguments);
      };

      localStorage.getItem = function (key) {
        const value = originalGetItem.apply(this, arguments);
        console.log(
          `🔐 localStorage - getItem [${key}]:`,
          value ? `${value.length} chars` : "null"
        );
        return value;
      };
    }

    return () => {
      console.log("🔐 App - Component unmounting");
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  console.log("🔐 App - Rendering App component");
  // Read auth at top-level of the component (Rules of Hooks)
  const { user } = useAuthStore();
  const widgetUser = user
    ? { ...user, token: user?.stsTokenManager?.accessToken || user?.accessToken || user?.token }
    : null;

  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/sign-up" element={<SignupPage />} />
          <Route path="/user-manual" element={<UserManualPage />} />

          {/* Doctor routes */}
          <Route element={<DoctorLayout />}>
            <Route element={<ProtectedRoute allowedRoles={["doctor"]} />}>
              <Route path="/doctor-overview" element={<DoctorOverviewPage />} />
              <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
              <Route path="/doctor-profile-setting" element={<DoctorProfileSetting />} />
              <Route path="/doctor-finance" element={<DoctorFinance />} />
            </Route>
          </Route>

          {/* Doctor pending verification page - protected but no DoctorLayout */}
          <Route element={<ProtectedRoute allowedRoles={["doctor"]} />}>
            <Route path="/admin-verification-pending" element={<AdminVerificationPending />} />
          </Route>

          {/* Patient routes */}
          <Route element={<PatientLayout />}>
            <Route element={<ProtectedRoute allowedRoles={["patient"]} />}>
              <Route path="/patient-dashboard" element={<PatientDashboard />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/appointments/:id" element={<AppointmentDetails />} />
              <Route path="/medical-records" element={<MedicalRecordsPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/doctors/review/:id" element={<DoctorDetailsPage />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-checkout" element={<PaymentCheckout />} />
            </Route>
          </Route>

          {/* Admin routes */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/admin-finance" element={<AdminFinancePage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
      {/* Global medical assistant chat widget - show only to patients */}
      {user?.role === "patient" && (
        <MedicalChatWidget user={widgetUser} apiBaseUrl="/api/agent" />
      )}
      <Toaster />
    </Router>
  );
}

export default App;
