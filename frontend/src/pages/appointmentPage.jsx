import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { ChevronLeft, Calendar, Clock, Video, Users } from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import api from "@/services/api.js"
import useAuthStore from "@/store/authStore"
import AppointmentCard from "@/components/AppointmentCard"

export default function AppointmentsPage() {
  const user = useAuthStore((state) => state.user)
  const [inPersonAppointments, setInPersonAppointments] = useState([])
  const [onlineAppointments, setOnlineAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [patientBackendId, setPatientBackendId] = useState(null)

  useEffect(() => {
    const fetchAppointments = async () => {
      // ProtectedRoute already ensures user is authenticated and hydrated
      if (!user) {
        setInPersonAppointments([])
        setOnlineAppointments([])
        setLoading(false)
        return
      }

      try {
        let backendPatientId = patientBackendId
        if (!backendPatientId) {
          if (user._id) backendPatientId = user._id
          else if (user.uid) {
            try {
              const pRes = await api.get(`/api/patient/uuid/${user.uid}`)
              if (pRes.data && pRes.data._id) {
                backendPatientId = pRes.data._id
                setPatientBackendId(backendPatientId)
              }
            } catch {
              console.warn("No backend patient record found for uid", user.uid)
            }
          }
        }

        const res = await api.get(`/api/patient/${backendPatientId}/appointments`)
        console.log("Appointments" , res.data)
        const appointments = res.data || []

        // Helper function to determine if appointment is upcoming or past
        const isUpcoming = (appointment) => {
          const appointmentDate = new Date(appointment.date)
          const currentDate = new Date()
          
          // If appointment is today, check the time
          if (appointmentDate.toDateString() === currentDate.toDateString()) {
            const [hours, minutes] = appointment.startTime.split(':').map(Number)
            const appointmentDateTime = new Date(appointmentDate)
            appointmentDateTime.setHours(hours, minutes, 0, 0)
            return appointmentDateTime > currentDate
          }
          
          return appointmentDate >= currentDate
        }

        // Add status info to each appointment
        const appointmentsWithStatus = appointments.map(appointment => ({
          ...appointment,
          isUpcoming: isUpcoming(appointment),
          timeStatus: isUpcoming(appointment) ? 'upcoming' : 'completed'
        }))

        // Split by appointment type (in-person vs online/video)
        const inPerson = appointmentsWithStatus.filter(
          (a) => a.type === "in-person"
        )
        const online = appointmentsWithStatus.filter(
          (a) => a.type === "online" || a.type === "video"
        )

        setInPersonAppointments(inPerson)
        setOnlineAppointments(online)
      } catch (err) {
        console.error("Failed to load appointments:", err)
        setInPersonAppointments([])
        setOnlineAppointments([])
      } finally {
        setLoading(false)
      }
    }

    fetchAppointments()
  }, [user, patientBackendId])

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50">
        <div className="container mx-auto py-12 px-4">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 animate-pulse">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-semibold text-gray-800">Loading your appointments...</h1>
              <p className="text-gray-600">Please wait while we fetch your schedule</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link 
            to="/patient-dashboard" 
            className="inline-flex items-center text-teal-700 hover:text-teal-800 font-medium transition-colors group"
          >
            <ChevronLeft className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg">
              <Calendar className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-700 to-emerald-700 bg-clip-text text-transparent">
                My Appointments
              </h1>
              <p className="text-gray-600 mt-1">View and manage your upcoming and past appointments</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="in-person" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/80 backdrop-blur-sm p-1.5 rounded-xl shadow-md border border-teal-100">
            <TabsTrigger 
              value="in-person" 
              className="text-base py-3.5 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-medium flex items-center justify-center gap-2"
            >
              <Users className="h-4 w-4" />
              In-Person
            </TabsTrigger>
            <TabsTrigger 
              value="online" 
              className="text-base py-3.5 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-medium flex items-center justify-center gap-2"
            >
              <Video className="h-4 w-4" />
              Online
            </TabsTrigger>
          </TabsList>

          <TabsContent value="in-person" className="space-y-8">
            {/* Upcoming In-Person Appointments */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Clock className="h-5 w-5 text-teal-600" />
                <h3 className="text-xl font-bold text-teal-700">Upcoming Appointments</h3>
              </div>
              {inPersonAppointments.filter(a => a.isUpcoming).length > 0 ? (
                <div className="grid gap-4 mb-6">
                  {inPersonAppointments.filter(a => a.isUpcoming).map((appointment, index) => (
                    <AppointmentCard
                      key={`upcoming-${index}`}
                      appointment={appointment}
                      type="upcoming"
                    />
                  ))}
                </div>
              ) : (
                <Card className="mb-6 border-teal-100 bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-50 mb-4">
                      <Calendar className="h-8 w-8 text-teal-400" />
                    </div>
                    <p className="text-gray-600 font-medium">No upcoming in-person appointments</p>
                    <p className="text-sm text-gray-500 mt-2">Your scheduled appointments will appear here</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Past In-Person Appointments */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Calendar className="h-5 w-5 text-gray-600" />
                <h3 className="text-xl font-bold text-gray-700">Past Appointments</h3>
              </div>
              {inPersonAppointments.filter(a => !a.isUpcoming).length > 0 ? (
                <div className="grid gap-4">
                  {inPersonAppointments.filter(a => !a.isUpcoming).map((appointment, index) => (
                    <AppointmentCard
                      key={`past-${index}`}
                      appointment={appointment}
                      type="completed"
                    />
                  ))}
                </div>
              ) : (
                <Card className="border-gray-200 bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                      <Calendar className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium">No past in-person appointments</p>
                    <p className="text-sm text-gray-500 mt-2">Your appointment history will appear here</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="online" className="space-y-8">
            {/* Upcoming Online Appointments */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Clock className="h-5 w-5 text-teal-600" />
                <h3 className="text-xl font-bold text-teal-700">Upcoming Appointments</h3>
              </div>
              {onlineAppointments.filter(a => a.isUpcoming).length > 0 ? (
                <div className="grid gap-4 mb-6">
                  {onlineAppointments.filter(a => a.isUpcoming).map((appointment, index) => (
                    <AppointmentCard
                      key={`upcoming-online-${index}`}
                      appointment={appointment}
                      type="upcoming"
                    />
                  ))}
                </div>
              ) : (
                <Card className="mb-6 border-teal-100 bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-50 mb-4">
                      <Video className="h-8 w-8 text-teal-400" />
                    </div>
                    <p className="text-gray-600 font-medium">No upcoming online appointments</p>
                    <p className="text-sm text-gray-500 mt-2">Your scheduled video consultations will appear here</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Past Online Appointments */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Calendar className="h-5 w-5 text-gray-600" />
                <h3 className="text-xl font-bold text-gray-700">Past Appointments</h3>
              </div>
              {onlineAppointments.filter(a => !a.isUpcoming).length > 0 ? (
                <div className="grid gap-4">
                  {onlineAppointments.filter(a => !a.isUpcoming).map((appointment, index) => (
                    <AppointmentCard
                      key={`past-online-${index}`}
                      appointment={appointment}
                      type="completed"
                    />
                  ))}
                </div>
              ) : (
                <Card className="border-gray-200 bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                      <Video className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium">No past online appointments</p>
                    <p className="text-sm text-gray-500 mt-2">Your consultation history will appear here</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}