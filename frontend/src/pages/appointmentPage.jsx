import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { ChevronLeft } from "lucide-react"
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
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-semibold">Loading your appointments…</h1>
      </main>
    )
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link to="/patient-dashboard" className="inline-flex items-center text-primary hover:underline">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Appointments</h1>
        <p className="text-muted-foreground">View and manage your appointments</p>
      </div>

      <Tabs defaultValue="in-person" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="in-person" className="text-base py-3">
            Inperson
          </TabsTrigger>
          <TabsTrigger value="online" className="text-base py-3">
            Online
          </TabsTrigger>
        </TabsList>

        <TabsContent value="in-person" className="space-y-6">
          {/* Upcoming In-Person Appointments */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-green-600">Upcoming Appointments</h3>
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
              <Card className="mb-6">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No upcoming in-person appointments</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Past In-Person Appointments */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-600">Past Appointments</h3>
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
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No past in-person appointments</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="online" className="space-y-6">
          {/* Upcoming Online Appointments */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-green-600">Upcoming Appointments</h3>
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
              <Card className="mb-6">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No upcoming online appointments</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Past Online Appointments */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-600">Past Appointments</h3>
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
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No past online appointments</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </main>
  )
}
