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
  const [upcomingAppointments, setUpcomingAppointments] = useState([])
  const [pastAppointments, setPastAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [patientBackendId, setPatientBackendId] = useState(null)

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) {
        setUpcomingAppointments([])
        setPastAppointments([])
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

        // Split upcoming vs past
        const upcoming = appointments.filter(
          (a) => a.type === "in-person" || a.status === "booked"
        )
        const past = appointments.filter(
          (a) => a.type === "online" || a.status === "cancelled"||a.type ==="video"
        )

        setUpcomingAppointments(upcoming)
        setPastAppointments(past)
      } catch (err) {
        console.error("Failed to load appointments:", err)
        setUpcomingAppointments([])
        setPastAppointments([])
      } finally {
        setLoading(false)
      }
    }

    fetchAppointments()
  }, [user])

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
        <Link to="/" className="inline-flex items-center text-primary hover:underline">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Doctors
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
          {upcomingAppointments.length > 0 ? (
            <div className="grid gap-4">
              {upcomingAppointments.map((appointment , index) => (
                <AppointmentCard
                  key={index+1}
                  appointment={appointment}
                  type="in-person"
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No upcoming appointments</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="online" className="space-y-6">
          {pastAppointments.length > 0 ? (
            <div className="grid gap-4">
              {pastAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment._id}
                  appointment={appointment}
                  type="past"
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No past appointments</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </main>
  )
}
