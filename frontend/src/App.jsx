import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

import SignupPage from './pages/SignUpPage'
import LoginPage from './pages/LoginPage'
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import ProtectedRoute from './components/protectedRoute';
import SideBarApp from './Layout.jsx/mainLayout';
import DoctorProfileSetting from './pages/DoctorProfileSetting';
import DoctorDetailsPage from './pages/DoctorViewPage';
import AppointmentsPage from './pages/appointmentPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/sign-up" element={<SignupPage />} />
        <Route element={<SideBarApp />}>
          <Route element={<ProtectedRoute />}>
            <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
            <Route path="/setting" element={<DoctorProfileSetting />} />
            {/* Add more protected dashboard routes here */}
          </Route>
        </Route>
        <Route path="/patient-dashboard" element={<PatientDashboard />} />
        <Route path="/doctors/review/:id" element={<DoctorDetailsPage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
      </Routes>
    </Router>
  )
}

export default App
