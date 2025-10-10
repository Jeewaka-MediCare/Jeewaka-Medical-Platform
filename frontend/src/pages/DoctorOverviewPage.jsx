import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar as CalendarIcon, 
  Edit, 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  Users, 
  Clock,
  TrendingUp,
  Award
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import useAuthStore from "../store/authStore";
import api from "../services/api";

const DoctorOverviewPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [doctorData, setDoctorData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [statistics, setStatistics] = useState({
    totalPatients: 0,
    appointmentsToday: 0,
    avgRating: 0,
    totalRatings: 0,
    completedSessions: 0
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointmentDates, setAppointmentDates] = useState(new Set());
  const [highTrafficDates, setHighTrafficDates] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔍 Component state updated:', {
      appointmentDates: Array.from(appointmentDates),
      highTrafficDates: Array.from(highTrafficDates),
      appointmentsCount: appointments.length
    });
  }, [appointmentDates, highTrafficDates, appointments]);

  useEffect(() => {
    if (user?._id) {
      fetchDoctorData();
      fetchAppointments();
      fetchStatistics();
    }
  }, [user]);

  const fetchDoctorData = async () => {
    try {
      const response = await api.get(`/api/doctor/${user._id}`);
      setDoctorData(response.data);
    } catch (error) {
      console.error('Error fetching doctor data:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      console.log('🔍 Fetching appointments for doctor:', user._id);
      const response = await api.get(`/api/session/doctor/${user._id}`);
      const sessions = response.data || [];
      console.log('🔍 Found sessions:', sessions.length);
      
      // Process appointments for calendar
      const dates = new Set();
      const trafficCount = {};
      let processedSlots = 0;
      
      sessions.forEach((session, sessionIndex) => {
        console.log(`🔍 Processing session ${sessionIndex}:`, {
          date: session.date,
          timeSlots: session.timeSlots?.length
        });
        if (session.timeSlots) {
          console.log('🔍 Session has', session.timeSlots.length, 'time slots');
          session.timeSlots.forEach((slot, index) => {
            console.log(`🔍 Slot ${index}:`, {
              appointmentStatus: slot.appointmentStatus,
              patientId: slot.patientId,
              startTime: slot.startTime,
              sessionDate: session.date,
              hasPatientId: !!slot.patientId,
              statusCheck: slot.appointmentStatus === 'confirmed',
              bothChecks: slot.appointmentStatus === 'confirmed' && slot.patientId
            });
            
            if (slot.appointmentStatus === 'confirmed' && slot.patientId) {
              processedSlots++;
              // Combine session date with slot time
              const sessionDate = new Date(session.date);
              const dateString = sessionDate.toDateString();
              console.log(`🔍 Found confirmed slot ${processedSlots}:`, {
                sessionDate: session.date,
                startTime: slot.startTime,
                combinedDateString: dateString,
                status: slot.appointmentStatus
              });
              dates.add(dateString);
              trafficCount[dateString] = (trafficCount[dateString] || 0) + 1;
            }
          });
        } else {
          console.log('🔍 Session has no timeSlots');
        }
      });

      console.log('🔍 Final processed data:', {
        totalBookedSlots: processedSlots,
        uniqueDates: Array.from(dates),
        trafficCount: trafficCount
      });

      // Identify high traffic dates (more than 3 appointments)
      const highTraffic = new Set();
      Object.entries(trafficCount).forEach(([date, count]) => {
        if (count >= 3) {
          highTraffic.add(date);
        }
      });
      
      setAppointments(sessions);
      setAppointmentDates(dates);
      setHighTrafficDates(highTraffic);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      console.log('🔍 Fetching statistics for doctor:', user._id);
      console.log('🔍 Statistics API URL:', `/api/session/doctor/${user._id}/statistics`);
      
      // Fetch statistics from backend
      const statsResponse = await api.get(`/api/session/doctor/${user._id}/statistics`);
      console.log('✅ Statistics response:', statsResponse.data);
      const backendStats = statsResponse.data || {};

      // Fetch ratings
      console.log('🔍 Fetching ratings for doctor:', user._id);
      console.log('🔍 Ratings API URL:', `/api/ratings/doctor/${user._id}`);
      const ratingsResponse = await api.get(`/api/ratings/doctor/${user._id}`);
      console.log('✅ Ratings response:', ratingsResponse.data);
      const ratings = ratingsResponse.data || [];
      
      const avgRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length 
        : 0;

      const finalStats = {
        totalPatients: backendStats.totalPatients || 0,
        appointmentsToday: backendStats.appointmentsToday || 0,
        avgRating: Number(avgRating.toFixed(1)),
        totalRatings: ratings.length,
        completedSessions: backendStats.completedAppointments || 0 // Updated field name
      };
      
      console.log('✅ Final calculated statistics:', finalStats);
      setStatistics(finalStats);
    } catch (error) {
      console.error('❌ Error fetching statistics:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method
      });
      
      // Fallback to default values if API fails
      const fallbackStats = {
        totalPatients: 0,
        appointmentsToday: 0,
        avgRating: 0,
        totalRatings: 0,
        completedSessions: 0
      };
      console.log('🔄 Using fallback statistics:', fallbackStats);
      setStatistics(fallbackStats);
    }
  };

  const getAppointmentsForDate = (date) => {
    const dateString = date.toDateString();
    return appointments.filter(session => {
      const sessionDateString = new Date(session.date).toDateString();
      return sessionDateString === dateString && 
             session.timeSlots?.some(slot => 
               slot.appointmentStatus === 'confirmed' && slot.patientId
             );
    });
  };

  const handleEditProfile = () => {
    navigate('/doctor-profile-setting');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-4">
            <Avatar className="w-20 h-20 border-4 border-green-200 shadow-lg">
              <AvatarImage 
                src={doctorData?.profile} 
                alt={`Dr. ${doctorData?.name || user?.name}`}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-r from-green-600 to-green-700 text-white text-2xl font-bold">
                {(doctorData?.name || user?.name)?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dr. {doctorData?.name || user?.name}</h1>
              <p className="text-gray-600">{doctorData?.specialization}</p>
              <p className="text-sm text-gray-500">Welcome back to your dashboard</p>
            </div>
          </div>
          <Button onClick={handleEditProfile} className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Edit Profile
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalPatients}</div>
              <p className="text-xs text-muted-foreground">
                Unique patients served
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.appointmentsToday}</div>
              <p className="text-xs text-muted-foreground">
                Scheduled for today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-1">
                {statistics.avgRating}
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              </div>
              <p className="text-xs text-muted-foreground">
                From {statistics.totalRatings} reviews
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Appointments</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.completedSessions}</div>
              <p className="text-xs text-muted-foreground">
                Appointments completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Doctor Details */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Doctor Profile
                </CardTitle>
                <CardDescription>Your professional information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16 border-2 border-green-200 shadow-sm">
                    <AvatarImage 
                      src={doctorData?.profile} 
                      alt={`Dr. ${doctorData?.name || user?.name}`}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-r from-green-600 to-green-700 text-white text-xl font-bold">
                      {(doctorData?.name || user?.name)?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">Dr. {doctorData?.name || user?.name}</h3>
                    <p className="text-sm text-gray-600">{doctorData?.specialization}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{doctorData?.email || user?.email}</span>
                  </div>
                  
                  {doctorData?.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{doctorData.phone}</span>
                    </div>
                  )}
                  
                  {doctorData?.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{doctorData.location}</span>
                    </div>
                  )}
                </div>

                {doctorData?.experience && (
                  <div className="pt-3 border-t">
                    <p className="text-sm font-medium text-gray-700">Experience</p>
                    <p className="text-sm text-gray-600">{doctorData.experience} years</p>
                  </div>
                )}

                {doctorData?.bio && (
                  <div className="pt-3 border-t">
                    <p className="text-sm font-medium text-gray-700">About</p>
                    <p className="text-sm text-gray-600">{doctorData.bio}</p>
                  </div>
                )}

                <Button 
                  onClick={handleEditProfile} 
                  variant="outline" 
                  className="w-full mt-4"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Calendar and Appointments */}
          <div className="lg:col-span-2 space-y-6">
            {/* Calendar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Appointment Calendar
                </CardTitle>
                <CardDescription>
                  View your upcoming appointments. 
                  <span className="ml-2">
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        console.log('🔍 Calendar: Date selected:', date);
                        setSelectedDate(date);
                        if (date) {
                          const appointmentsForDate = getAppointmentsForDate(date);
                          console.log('🔍 Calendar: Appointments for selected date:', appointmentsForDate);
                        }
                      }}
                      className="rounded-md border"
                      modifiers={{
                        booked: (date) => {
                          const dateString = date.toDateString();
                          const hasAppointment = appointmentDates.has(dateString);
                          if (hasAppointment) {
                            console.log('🔍 Calendar: Date has appointment:', dateString);
                          }
                          return hasAppointment;
                        },
                        highTraffic: (date) => {
                          const dateString = date.toDateString();
                          const isHighTraffic = highTrafficDates.has(dateString);
                          if (isHighTraffic) {
                            console.log('🔍 Calendar: High traffic date:', dateString);
                          }
                          return isHighTraffic;
                        }
                      }}
                      modifiersStyles={{
                        booked: { 
                          backgroundColor: 'rgba(34, 197, 94, 0.2)', 
                          color: '#059669',
                          fontWeight: 'bold'
                        },
                        highTraffic: { 
                          backgroundColor: 'rgba(239, 68, 68, 0.2)', 
                          color: '#dc2626',
                          fontWeight: 'bold'
                        }
                      }}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium mb-3">
                      Appointments for {selectedDate?.toLocaleDateString()}
                    </h4>
                    {(() => {
                      const appointmentsForDate = selectedDate ? getAppointmentsForDate(selectedDate) : [];
                      console.log('🔍 Rendering appointments for date:', selectedDate?.toDateString());
                      console.log('🔍 Found appointments:', appointmentsForDate);
                      
                      // Collect all time slots for the date
                      const allSlots = [];
                      const totalBooked = appointmentsForDate.reduce((total, session) => {
                        session.timeSlots?.forEach(slot => {
                          allSlots.push({
                            ...slot,
                            sessionType: session.sessionType,
                            hospitalName: session.hospital?.name
                          });
                        });
                        return total + (session.timeSlots?.filter(slot => 
                          slot.appointmentStatus === 'confirmed' && slot.patientId
                        ).length || 0);
                      }, 0);
                      
                      // Sort slots by time
                      allSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
                      
                      return (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {appointmentsForDate.length > 0 ? (
                            <>
                              {/* Summary */}
                              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <h5 className="font-medium text-sm text-blue-900 mb-1">
                                  Day Summary
                                </h5>
                                <p className="text-xs text-blue-700">
                                  <span className="font-medium">{totalBooked}</span> appointments booked 
                                  out of <span className="font-medium">{allSlots.length}</span> available slots
                                </p>
                              </div>
                              
                              {/* All Time Slots */}
                              <div className="space-y-1">
                                <h5 className="font-medium text-sm text-gray-700 mb-2">Time Slots</h5>
                                {allSlots.map((slot, slotIdx) => (
                                  <div 
                                    key={slotIdx} 
                                    className={`flex justify-between items-center p-2 rounded text-sm ${
                                      slot.appointmentStatus === 'confirmed' && slot.patientId
                                        ? 'bg-green-100 text-green-800 border border-green-300' 
                                        : 'bg-gray-50 text-gray-600 border border-gray-200'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{slot.startTime}</span>
                                      <span className="text-xs text-gray-500">
                                        {slot.sessionType === 'online' ? 'Online' : slot.hospitalName}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge 
                                        variant={slot.appointmentStatus === 'confirmed' && slot.patientId ? 'default' : 'outline'}
                                        className="text-xs"
                                      >
                                        {slot.appointmentStatus === 'confirmed' && slot.patientId ? 'Booked' : 'Available'}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : (
                            <p className="text-sm text-gray-500 text-center py-4">
                              No appointments scheduled for this date
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Legend:</p>
                  <div className="flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-green-200 border border-green-600"></div>
                      <span>Has Appointments</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-red-200 border border-red-600"></div>
                      <span>High Traffic (3+ appointments)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorOverviewPage;