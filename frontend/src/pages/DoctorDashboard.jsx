"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calendar, 
  Video, 
  Building2, 
  MapPin, 
  Globe, 
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Grid3X3,
  List,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import '../styles/dialogWide.css';

// Import components
import { SessionCard } from "../components/SessionCard";
import { CreateSessionDialog } from "../components/CreateSessionDialog";
import { TimeSlotCard } from "../components/TimeSlotCard";
import { PatientReportsDialog } from "../components/PatientReportsDialog";
import MedicalRecordsModal from "../components/MedicalRecordsModal";
import api from "../services/api.js";
import { toast } from "sonner";
import useAuthStore from "../store/authStore.js";

export default function DoctorSessionManager() {
  const user = useAuthStore((state) => state.user);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedView, setSelectedView] = useState("grid");

  // Dialog states
  const [isSessionDetailsOpen, setIsSessionDetailsOpen] = useState(false);
  const [selectedPatientForReports, setSelectedPatientForReports] = useState(null);
  const [selectedPatientForMedicalRecords, setSelectedPatientForMedicalRecords] = useState(null);
  const [isMedicalRecordsOpen, setIsMedicalRecordsOpen] = useState(false);
  const [isAddObservationOpen, setIsAddObservationOpen] = useState(false);
  const [isAddPrescriptionOpen, setIsAddPrescriptionOpen] = useState(false);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [currentPatientForAdd, setCurrentPatientForAdd] = useState(null);

  // Data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch hospitals
        const hospitalsResponse = await api.get("/api/hospital");
        setHospitals(hospitalsResponse.data);
        
        // Fetch sessions for the doctor
        if (user?._id) {
          console.log('🔍 Fetching sessions for doctor:', user._id);
          const sessionsResponse = await api.get(`/api/session/doctor/${user._id}`);
          console.log('🔍 Sessions response:', sessionsResponse.data);
          console.log('🏥 First session hospital data:', sessionsResponse.data[0]?.hospital);
          setSessions(sessionsResponse.data || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        console.error("Error details:", error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Function to handle opening session details modal
  const handleSessionClick = (session) => {
    setSelectedSession(session);
    setIsSessionDetailsOpen(true);
  };

  // Categorize and sort sessions
  const { upcomingSessions, pastSessions } = useMemo(() => {
    const now = new Date();
    
    // First apply existing filters
    const filtered = sessions.filter(session => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          session.hospital?.name?.toLowerCase().includes(searchLower) ||
          session.date?.toLowerCase().includes(searchLower) ||
          session.sessionType?.toLowerCase().includes(searchLower) ||
          session.type?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== "all" && session.status !== statusFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== "all" && session.sessionType !== typeFilter && session.type !== typeFilter) {
        return false;
      }

      return true;
    });

    // Helper function to get session's earliest time
    const getSessionDateTime = (session) => {
      const sessionDate = new Date(session.date);
      
      if (session.timeSlots && session.timeSlots.length > 0) {
        // Find the earliest time slot
        const earliestSlot = session.timeSlots.reduce((earliest, current) => {
          return earliest.startTime <= current.startTime ? earliest : current;
        });
        
        // Parse the time (assuming format like "09:00 AM")
        const timeMatch = earliestSlot.startTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2]);
          const period = timeMatch[3].toUpperCase();
          
          if (period === 'PM' && hours !== 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;
          
          sessionDate.setHours(hours, minutes, 0, 0);
        }
      }
      
      return sessionDate;
    };

    // Sort all sessions by date and time
    const sortedSessions = filtered.sort((a, b) => {
      const dateTimeA = getSessionDateTime(a);
      const dateTimeB = getSessionDateTime(b);
      return dateTimeA - dateTimeB;
    });

    // Categorize into past and upcoming
    const upcoming = sortedSessions.filter(session => {
      const sessionDateTime = getSessionDateTime(session);
      return sessionDateTime >= now;
    });

    const past = sortedSessions.filter(session => {
      const sessionDateTime = getSessionDateTime(session);
      return sessionDateTime < now;
    }).reverse(); // Show most recent past sessions first

    return { upcomingSessions: upcoming, pastSessions: past };
  }, [sessions, searchTerm, statusFilter, typeFilter]);

  // Legacy filtered sessions for compatibility (now returns all sessions)
  const filteredSessions = useMemo(() => {
    return [...upcomingSessions, ...pastSessions];
  }, [upcomingSessions, pastSessions]);

  // Event handlers
  const handleCreateSession = (newSession) => {
    setSessions(prev => [...prev, newSession]);
  };

  const handleEditSession = (session) => {
    // TODO: Implement edit functionality
    console.log("Edit session:", session);
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      const response = await api.delete(`/api/session/${sessionId}`);
      
      if (response.data.message) {
        toast.success("Session deleted successfully");
        setSessions(prev => prev.filter(s => s._id !== sessionId));
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      
      if (error.response?.data?.error) {
        toast.error("Cannot delete session", {
          description: error.response.data.error
        });
      } else {
        toast.error("Failed to delete session", {
          description: "Please try again later"
        });
      }
    }
  };

  const handleUpdateAppointmentStatus = (sessionId, slotId, newStatus) => {
    setSessions(prev => prev.map(session => {
      if (session._id === sessionId) {
        return {
          ...session,
          timeSlots: session.timeSlots.map(slot => 
            slot._id === slotId ? { ...slot, appointmentStatus: newStatus } : slot
          )
        };
      }
      return session;
    }));
  };

  const handleViewReports = (patient) => {
    setSelectedPatientForReports(patient);
  };

  const handleViewMedicalRecords = (patient) => {
    setSelectedPatientForMedicalRecords(patient);
    setIsMedicalRecordsOpen(true);
  };

  const handleAddNote = (patient) => {
    setCurrentPatientForAdd(patient);
    setIsAddNoteOpen(true);
  };

  const refreshData = () => {
    window.location.reload(); // Simple refresh for now
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading session data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Session Manager</h1>
            <p className="text-gray-600 mt-1">
              Manage your appointments, time slots, and patient sessions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refreshData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <CreateSessionDialog
              hospitals={hospitals}
              onCreateSession={handleCreateSession}
            />
          </div>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search sessions, hospitals, or dates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="physical">In-Person</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center border rounded-md">
                  <Button
                    variant={selectedView === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedView("grid")}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={selectedView === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedView("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div>
          
          {/* Sessions List with Tabs */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Sessions</CardTitle>
                  <CardDescription>
                    {upcomingSessions.length} upcoming, {pastSessions.length} past sessions
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  {sessions.length} total
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="upcoming" className="flex items-center space-x-2">
                    <span>Upcoming</span>
                    <Badge variant="secondary" className="ml-1">
                      {upcomingSessions.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="past" className="flex items-center space-x-2">
                    <span>Past</span>
                    <Badge variant="secondary" className="ml-1">
                      {pastSessions.length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming">
                  {upcomingSessions.length > 0 ? (
                    <div className={
                      selectedView === "grid" 
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                        : "space-y-4"
                    }>
                      {upcomingSessions.map((session) => (
                        <div 
                          key={session._id} 
                          className={selectedView === "list" ? "w-full" : ""}
                        >
                          <SessionCard
                            session={session}
                            isSelected={selectedSession?._id === session._id}
                            onSelect={handleSessionClick}
                            onEdit={handleEditSession}
                            onDelete={handleDeleteSession}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming sessions</h3>
                      <p className="text-gray-500 mb-4">
                        {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                          ? "Try adjusting your filters or search terms"
                          : "Create your first session to get started"
                        }
                      </p>
                      {(!searchTerm && statusFilter === "all" && typeFilter === "all") && (
                        <CreateSessionDialog
                          hospitals={hospitals}
                          onCreateSession={handleCreateSession}
                        />
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="past">
                  {pastSessions.length > 0 ? (
                    <div className={
                      selectedView === "grid" 
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                        : "space-y-4"
                    }>
                      {pastSessions.map((session) => (
                        <div 
                          key={session._id} 
                          className={selectedView === "list" ? "w-full" : ""}
                        >
                          <SessionCard
                            session={session}
                            isSelected={selectedSession?._id === session._id}
                            onSelect={handleSessionClick}
                            onEdit={handleEditSession}
                            onDelete={handleDeleteSession}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No past sessions</h3>
                      <p className="text-gray-500">
                        {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                          ? "Try adjusting your filters or search terms"
                          : "Your completed sessions will appear here"
                        }
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Dialogs */}
        {/* Session Details Modal */}
        <Dialog open={isSessionDetailsOpen} onOpenChange={setIsSessionDetailsOpen}>
          <DialogContent className="dialog-wide w-full max-w-[70vw] max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <span>Session Details</span>
                {(selectedSession?.sessionType === "online" || selectedSession?.type === "online") ? (
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 font-medium">
                    <Video className="h-3 w-3 mr-1" />
                    Online
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 font-medium">
                    <Building2 className="h-3 w-3 mr-1" />
                    {selectedSession?.sessionType || selectedSession?.type || "In-Person"}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                {selectedSession && new Date(selectedSession.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </DialogDescription>
            </DialogHeader>
            
            {selectedSession && (
              <div className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Time Slots</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditSession(selectedSession)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Session
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteSession(selectedSession._id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Session
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="space-y-3">
                    {selectedSession.timeSlots?.map((slot) => (
                      <TimeSlotCard
                        key={slot._id}
                        slot={slot}
                        session={selectedSession}
                        onUpdateStatus={handleUpdateAppointmentStatus}
                        onViewReports={handleViewReports}
                        onViewMedicalRecords={handleViewMedicalRecords}
                        onAddNote={handleAddNote}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <PatientReportsDialog
          patient={selectedPatientForReports}
          isOpen={!!selectedPatientForReports}
          onClose={() => setSelectedPatientForReports(null)}
        />

        <MedicalRecordsModal
          isOpen={isMedicalRecordsOpen}
          onClose={() => {
            setIsMedicalRecordsOpen(false);
            setSelectedPatientForMedicalRecords(null);
          }}
          patientId={selectedPatientForMedicalRecords?.id}
          initialView="list"
        />
      </div>
    </div>
  );
}