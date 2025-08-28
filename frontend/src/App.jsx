import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

import SignupPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import ProtectedRoute from "./components/protectedRoute";
import SideBarApp from "./Layout.jsx/mainLayout";
import DoctorProfileSetting from "./pages/DoctorProfileSetting";
import DoctorDetailsPage from "./pages/DoctorViewPage";
import AppointmentsPage from "./pages/appointmentPage";
import AdminDashboard from "./pages/AdminDashBoard";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/sign-up" element={<SignupPage />} />
        

        {/* Doctor routes */}
        <Route element={<SideBarApp />}>
          <Route element={<ProtectedRoute allowedRoles={["doctor"]} />}>
            <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
            <Route path="/setting" element={<DoctorProfileSetting />} />
          </Route>
        </Route>

        {/* Patient routes */}
        <Route element={<ProtectedRoute allowedRoles={["patient"]} />}>
          <Route path="/patient-dashboard" element={<PatientDashboard />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/doctors/review/:id" element={<DoctorDetailsPage />} />
        </Route>

        {/* Admin routes */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
