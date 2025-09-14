"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Video, Building2, MapPin, Globe } from "lucide-react";

// Import components
import { SessionCard } from "../components/SessionCard";
import { CreateSessionDialog } from "../components/CreateSessionDialog";
import { TimeSlotCard } from "../components/TimeSlotCard";
import { PatientReportsDialog } from "../components/PatientReportsDialog";
import { PatientHistoryDialog } from "../components/PatientHistoryDialog";
// import { AddObservationDialog, AddPrescriptionDialog, AddNoteDialog } from "../components/AddMedicalDataDialogs"
import { LocationTab } from "../components/LocationTab";
import api from "../services/api.js"; // Import the API service
import useAuthStore from "../store/authStore.js";

// Import data and types
import { mockSessions, mockHospitals } from "../data/mockData.js";
import { useEffect } from "react";

export default function DoctorSessionManager() {
  const user = useAuthStore((state) => state.user);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [hospitals, setHospitals] = useState([]);

  // Dialog states
  const [selectedPatientForReports, setSelectedPatientForReports] =
    useState(null);
  const [selectedPatientForHistory, setSelectedPatientForHistory] =
    useState(null);
  const [isAddObservationOpen, setIsAddObservationOpen] = useState(false);
  const [isAddPrescriptionOpen, setIsAddPrescriptionOpen] = useState(false);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [currentPatientForAdd, setCurrentPatientForAdd] = useState(null);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const response = await api.get("/api/hospital"); // Adjust the endpoint as needed
        const data = response.data;
        console.log("Fetched hospitals:", data);
        setHospitals(data);
      } catch (error) {
        console.error("Error fetching hospitals:", error);
      }
    };
    const fetchSessions = async () => {
      try {
        const response = await api.get(`/api/session/doctor/${ user._id}`); // Adjust the endpoint as needed
        const data = response.data;
        console.log("Fetched sessions:", data);

        console.log("Fetched sessions:", data);
        setSessions(data)
      } catch (error) {
        console.error("Error fetching sessions:", error);
      }
      
    };
    fetchHospitals();
    fetchSessions();
  }, []);

  const handleCreateSession = (newSession) => {
    setSessions([...sessions, newSession]);
  };

  const handleEditSession = (session) => {
    // TODO: Implement edit functionality
    console.log("Edit session:", session);
  };

  const handleDeleteSession = (sessionId) => {
    setSessions(sessions.filter((s) => s._id !== sessionId));
    if (selectedSession?._id === sessionId) {
      setSelectedSession(null);
    }
  };

  const handleUpdateAppointmentStatus = (slotId, status) => {
    setSessions(
      sessions.map((session) => ({
        ...session,
        timeSlots: session.timeSlots.map((slot) =>
          slot._id === slotId ? { ...slot, appointmentStatus: status } : slot
        ),
      }))
    );
  };

  const handleViewReports = (patient) => {
    setSelectedPatientForReports(patient);
  };

  const handleViewHistory = (patient) => {
    setSelectedPatientForHistory(patient);
  };

  const handleAddObservation = (patient) => {
    setCurrentPatientForAdd(patient);
    setIsAddObservationOpen(true);
  };

  const handleAddPrescription = (patient) => {
    setCurrentPatientForAdd(patient);
    setIsAddPrescriptionOpen(true);
  };

  const handleAddNote = (patient) => {
    setCurrentPatientForAdd(patient);
    setIsAddNoteOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Doctor Session Manager
          </h1>
          <p className="text-gray-600">
            Manage your patient sessions, time slots, and appointments
          </p>
        </div>

        {/* First Row - Sessions List (Horizontal Scroll) */}
        <div className="mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sessions</CardTitle>
                <CardDescription>Manage your upcoming sessions</CardDescription>
              </div>
              <CreateSessionDialog
                hospitals={hospitals}
                onCreateSession={handleCreateSession}
              />
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4 overflow-x-auto pb-4">
                {sessions.map((session) => (
                  <div key={session._id} className="flex-shrink-0 w-80">
                    <SessionCard
                      session={session}
                      isSelected={selectedSession?._id === session._id}
                      onSelect={setSelectedSession}
                      onEdit={handleEditSession}
                      onDelete={handleDeleteSession}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Second Row - Session Details */}
        <div>
          {selectedSession ? (
            <Tabs defaultValue="slots" className="space-y-4">
              <TabsList>
                <TabsTrigger value="slots">Time Slots</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
              </TabsList>

              <TabsContent value="slots">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <span>Time Slots - {selectedSession.date}</span>
                          {selectedSession.sessionType === "online" ? (
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200"
                            >
                              <Video className="h-3 w-3 mr-1" />
                              Online
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200"
                            >
                              <Building2 className="h-3 w-3 mr-1" />
                              In-Person
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {selectedSession.hospital ? (
                            <div className="flex items-center space-x-2 mt-1">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span>
                                {selectedSession.hospital.name} -{" "}
                                {selectedSession.hospital.location}
                              </span>
                            </div>
                          ) : selectedSession.meetingLink ? (
                            <div className="flex items-center space-x-2 mt-1">
                              <Globe className="h-4 w-4 text-gray-400" />
                              <span>Online consultation via video call</span>
                            </div>
                          ) : null}
                        </CardDescription>
                      </div>
                      {selectedSession.meetingLink && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={selectedSession.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Join Meeting
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4">
                      {selectedSession.timeSlots.map((slot) => (
                        <TimeSlotCard
                          key={slot._id}
                          slot={slot}
                          session={selectedSession}
                          onUpdateStatus={handleUpdateAppointmentStatus}
                          onViewReports={handleViewReports}
                          onViewHistory={handleViewHistory}
                          //onAddObservation={handleAddObservation}
                          //onAddPrescription={handleAddPrescription}
                          onAddNote={handleAddNote}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="location">
                <Card>
                  <CardHeader>
                    <CardTitle>Session Location Details</CardTitle>
                    <CardDescription>
                      Location and access information for this session
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LocationTab session={selectedSession} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a session to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Dialogs */}
        <PatientReportsDialog
          patient={selectedPatientForReports}
          isOpen={!!selectedPatientForReports}
          onClose={() => setSelectedPatientForReports(null)}
        />

        <PatientHistoryDialog
          patient={selectedPatientForHistory}
          isOpen={!!selectedPatientForHistory}
          onClose={() => setSelectedPatientForHistory(null)}
        />

        {/* <AddObservationDialog
          patient={currentPatientForAdd}
          isOpen={isAddObservationOpen}
          onClose={() => setIsAddObservationOpen(false)}
        />

        <AddPrescriptionDialog
          patient={currentPatientForAdd}
          isOpen={isAddPrescriptionOpen}
          onClose={() => setIsAddPrescriptionOpen(false)}
        />

        <AddNoteDialog patient={currentPatientForAdd} isOpen={isAddNoteOpen} onClose={() => setIsAddNoteOpen(false)} /> */}
      </div>
    </div>
  );
}
