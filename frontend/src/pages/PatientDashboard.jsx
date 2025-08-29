import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";

export default function PatientDashboard() {
  const [patient, setPatient] = useState({
    name: "Loading...",
    email: "",
    avatar: "https://via.placeholder.com/120x120.png?text=Profile",
    healthScore: 85 // Default health score
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Fetch patient profile data
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        // Get patient ID from localStorage
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const patientId = userData.id;

        if (patientId) {
          const response = await api.get(`/api/patient/${patientId}`);
          if (response.data) {
            setPatient({
              name: response.data.name || "Patient",
              email: response.data.email || "",
              avatar: response.data.profile || "https://via.placeholder.com/120x120.png?text=Profile",
              healthScore: 85 // Default health score since it's not in the model
            });
          }
        } else {
          // If no patient ID, try to get by UUID
          const patientUuid = userData.uuid;
          if (patientUuid) {
            const response = await api.get(`/api/patient/uuid/${patientUuid}`);
            if (response.data) {
              setPatient({
                name: response.data.name || "Patient",
                email: response.data.email || "",
                avatar: response.data.profile || "https://via.placeholder.com/120x120.png?text=Profile",
                healthScore: 85
              });
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch patient data:", err);
        setError("Failed to load patient data");
        // Set default data if API fails
        setPatient({
          name: "John Doe",
          email: "john.doe@email.com",
          avatar: "https://via.placeholder.com/120x120.png?text=Profile",
          healthScore: 85
        });
      }
    };

    fetchPatientData();
  }, []);

  // Fetch appointments data
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await api.get('/api/session');
        if (response.data && Array.isArray(response.data)) {
          const userData = JSON.parse(localStorage.getItem('userData') || '{}');
          const patientId = userData.id;

          // Filter appointments for current patient
          const patientAppointments = response.data.filter(session =>
            session.timeSlots?.some(slot => slot.patientId === patientId)
          );

          const now = new Date();
          const upcoming = [];
          const past = [];

          patientAppointments.forEach(session => {
            const sessionDate = new Date(session.date);
            const patientSlot = session.timeSlots?.find(slot => slot.patientId === patientId);

            if (patientSlot) {
              const appointmentData = {
                id: session._id,
                doctorName: session.doctorName || "Doctor",
                date: session.date,
                time: patientSlot.startTime,
                specialization: session.type || "Specialization",
                status: patientSlot.appointmentStatus || "upcoming",
                hospital: session.hospital
              };

              if (sessionDate >= now) {
                upcoming.push(appointmentData);
              } else {
                past.push(appointmentData);
              }
            }
          });

          setUpcomingAppointments(upcoming);
          setPastAppointments(past);
        }
      } catch (err) {
        console.error("Failed to fetch appointments:", err);
        setError("Failed to load appointments");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // Fetch medical records (placeholder - would need a medical records API)
  useEffect(() => {
    const fetchMedicalRecords = async () => {
      try {
        // This would be replaced with actual medical records API
        // For now, we'll simulate some sample data
        const sampleRecords = [
          {
            id: 1,
            title: "Annual Physical Examination",
            date: "2024-08-15",
            description: "Routine checkup - All vitals normal",
            doctor: "Dr. Smith"
          },
          {
            id: 2,
            title: "Blood Test Results",
            date: "2024-07-20",
            description: "Complete blood count - Within normal ranges",
            doctor: "Dr. Johnson"
          }
        ];

        // Simulate API delay
        setTimeout(() => {
          setMedicalRecords(sampleRecords);
        }, 500);
      } catch (err) {
        console.error("Failed to fetch medical records:", err);
      }
    };

    fetchMedicalRecords();
  }, []);

  // Handler to navigate to doctor list view
  const goToDoctorList = () => {
    navigate("/doctor-list");
  };

  // Refresh data function
  const refreshData = () => {
    setLoading(true);
    setError(null);
    // Reset patient data to trigger re-fetch
    setPatient({
      name: "Loading...",
      email: "",
      avatar: "https://via.placeholder.com/120x120.png?text=Profile",
      healthScore: 85
    });
    setUpcomingAppointments([]);
    setPastAppointments([]);
    setMedicalRecords([]);
    // The useEffect hooks will automatically re-run
  };

  return (
    <main className="container mx-auto py-8 px-4">
      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-red-700">{error}</p>
              <Button variant="outline" size="sm" onClick={refreshData}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patient Profile Section */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <Avatar className="w-32 h-32">
              <AvatarImage src={patient.avatar} alt="Profile" />
              <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold mb-2">{patient.name}</h2>
              <p className="text-muted-foreground mb-2">{patient.email}</p>
              <div className="mb-4">
                <span className="font-semibold">Health Score:</span>
                <span className="ml-2 text-lg text-green-600 font-bold">{patient.healthScore}</span>
              </div>
              <div className="flex gap-2">
                <Button onClick={goToDoctorList}>
                  Access Doctors
                </Button>
                <Button variant="outline" onClick={refreshData}>
                  Refresh Data
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Appointments */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading appointments...</p>
          ) : upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAppointments.map((appointment, index) => (
                <div key={index} className="border rounded-lg p-4 bg-white">
                  <p className="font-semibold">{appointment.doctorName || "Doctor"}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(appointment.date).toLocaleDateString()} at {appointment.time || "TBD"}
                  </p>
                  <p className="text-sm">{appointment.specialization || "Specialization"}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No upcoming appointments.</p>
          )}
        </CardContent>
      </Card>

      {/* Past Appointments */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Past Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading appointments...</p>
          ) : pastAppointments.length > 0 ? (
            <div className="space-y-3">
              {pastAppointments.map((appointment, index) => (
                <div key={index} className="border rounded-lg p-4 bg-white">
                  <p className="font-semibold">{appointment.doctorName || "Doctor"}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(appointment.date).toLocaleDateString()} at {appointment.time || "TBD"}
                  </p>
                  <p className="text-sm">{appointment.specialization || "Specialization"}</p>
                  <p className="text-xs text-green-600 font-medium">Completed</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No past appointments.</p>
          )}
        </CardContent>
      </Card>

      {/* Medical Record */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Record</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading medical records...</p>
          ) : medicalRecords.length > 0 ? (
            <div className="space-y-3">
              {medicalRecords.map((record, index) => (
                <div key={index} className="border rounded-lg p-4 bg-white">
                  <p className="font-semibold">{record.title || "Medical Record"}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(record.date).toLocaleDateString()}
                  </p>
                  <p className="text-sm">{record.description || "Record details"}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No medical records available.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}