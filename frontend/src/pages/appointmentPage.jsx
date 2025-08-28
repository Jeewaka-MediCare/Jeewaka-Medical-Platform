import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { ChevronLeft, Calendar, Clock, MapPin, Globe, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import api from "@/services/api.js"
import useAuthStore from "@/store/authStore"

// We'll fetch sessions and derive appointments for the logged-in patient
// Keep a small fallback in case API is unavailable (empty arrays handled below)

export default function AppointmentsPage() {
  const { user } = useAuthStore()
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
        // Ensure we have the backend patient _id for matching
        let backendPatientId = patientBackendId
        if (!backendPatientId) {
          // Try common fields from stored user object
          if (user._id) backendPatientId = user._id
          // if not, try to resolve by Firebase uid
          else if (user.uid) {
            try {
              const pRes = await api.get(`/api/patient/uuid/${user.uid}`)
              if (pRes.data && pRes.data._id) {
                backendPatientId = pRes.data._id
                setPatientBackendId(backendPatientId)
              }
            } catch (pErr) {
              // no patient found for uid, continue without backend id
              console.warn('No backend patient record found for uid', user.uid)
            }
          }
        }

        const res = await api.get('/api/session')
        const sessions = res.data || []

        // Collect slots booked for this user across sessions
        const appointments = []
        sessions.forEach((session) => {
          const hospital = session.hospital || { name: 'Unknown hospital', location: '' }
          const doctorName = session.doctorId?.name || session.doctorId || 'Doctor'
          session.timeSlots?.forEach((slot, idx) => {
            // patientId might be stored as ObjectId string or as uuid; compare against backend id, uuid, or firebase uid
            const patientMatch = slot.patientId && (
              (backendPatientId && String(slot.patientId) === String(backendPatientId)) ||
              (user.uuid && String(slot.patientId) === String(user.uuid)) ||
              (user.uid && String(slot.patientId) === String(user.uid)) ||
              (user._id && String(slot.patientId) === String(user._id))
            )
            if (patientMatch) {
              appointments.push({
                id: `${session._id}:${idx}`,
                sessionId: session._id,
                slotIndex: idx,
                doctorName,
                doctorSpecialization: session.specialization || '',
                // Use the session date (ISO) for the appointment date when available.
                date: session.date || null,
                // time strings are stored as simple HH:mm in timeSlots; show them directly
                startTime: slot.startTime || session.startTime || null,
                endTime: slot.endTime || session.endTime || null,
                type: session.type || 'in-person',
                status: slot.appointmentStatus || slot.status || 'booked',
                hospital,
                notes: slot.notes || null,
                payment: {
                  intentId: slot.paymentIntentId,
                  amount: slot.paymentAmount,
                  currency: slot.paymentCurrency,
                  date: slot.paymentDate
                }
              })
            }
          })
        })

        // split upcoming vs past by date/status
        const now = new Date()
        const upcoming = appointments.filter(a => a.status !== 'completed' && a.status !== 'cancelled')
        const past = appointments.filter(a => a.status === 'completed' || a.status === 'cancelled')

        setUpcomingAppointments(upcoming)
        setPastAppointments(past)
      } catch (err) {
        console.error('Failed to load appointments:', err)
        setUpcomingAppointments([])
        setPastAppointments([])
      } finally {
        setLoading(false)
      }
    }

    // initial fetch
    fetchAppointments()

    // If a booking was just made, webhook processing can lag — retry once shortly after
    const retryTimer = setTimeout(async () => {
      try {
        const needRetry = upcomingAppointments.length === 0 && pastAppointments.length === 0
        if (needRetry) await fetchAppointments()
      } catch (e) {
        /* ignore */
      }
    }, 2000)

    return () => clearTimeout(retryTimer)
  }, [user])

  // While loading, show a placeholder message instead of immediate empty state
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
        <Link href="/" className="inline-flex items-center text-primary hover:underline">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Doctors
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Appointments</h1>
        <p className="text-muted-foreground">View and manage your appointments</p>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="upcoming" className="text-base py-3">
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="past" className="text-base py-3">
            Past
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-6">
          {upcomingAppointments.length > 0 ? (
            <div className="grid gap-4">
              {upcomingAppointments.map((appointment) => (
                <Card key={appointment.id} className="overflow-hidden">
                  <CardHeader className="bg-primary/5 pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">{appointment.doctorName}</CardTitle>
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                        {appointment.status === 'booked' ? 'Upcoming' : appointment.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{appointment.doctorSpecialization}</p>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span>{appointment.date && !isNaN(new Date(appointment.date)) ? format(new Date(appointment.date), "EEEE, MMMM d, yyyy") : 'Date TBD'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <span>
                            {appointment.startTime || 'TBD'} - {appointment.endTime || 'TBD'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {appointment.type === "online" ? (
                            <>
                              <Globe className="h-4 w-4 text-primary" />
                              <span>Online Consultation</span>
                            </>
                          ) : (
                            <>
                              <MapPin className="h-4 w-4 text-primary" />
                              <span>
                                {appointment.hospital.name}, {appointment.hospital.location}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 justify-end items-start md:items-end">
                        <div className="text-sm text-muted-foreground text-right">
                          <div>Session: <span className="font-mono text-xs">{appointment.sessionId}</span></div>
                          <div>Payment: <span className="font-mono text-xs">{appointment.payment?.intentId || '—'}</span></div>
                          <div>Status: <strong>{appointment.status}</strong></div>
                        </div>
                        <Link to={`/appointments/${appointment.id}?sessionId=${appointment.sessionId}&slotIndex=${appointment.slotIndex}`} className="text-primary hover:underline text-sm">
                          View Details
                        </Link>
                        {appointment.type === "online" && (
                          <a
                            href={appointment.meetingLink || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-primary text-white px-4 py-2 rounded-md text-sm hover:bg-primary/90"
                          >
                            Join session
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
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

        <TabsContent value="past" className="space-y-6">
          {pastAppointments.length > 0 ? (
            <div className="grid gap-4">
              {pastAppointments.map((appointment) => (
                <Card key={appointment.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/30 pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">{appointment.doctorName}</CardTitle>
                      <Badge
                        variant="outline"
                        className={
                          appointment.status === "completed"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : "bg-red-100 text-red-800 border-red-200"
                        }
                      >
                        {appointment.status === "completed" ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {appointment.status === "completed" ? "Completed" : "Cancelled"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{appointment.doctorSpecialization}</p>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {appointment.date && !isNaN(new Date(appointment.date)) ? format(new Date(appointment.date), "EEEE, MMMM d, yyyy") : 'Date TBD'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {appointment.startTime || 'TBD'} - {appointment.endTime || 'TBD'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {appointment.type === "online" ? (
                            <>
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Online Consultation</span>
                            </>
                          ) : (
                            <>
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {appointment.hospital.name}, {appointment.hospital.location}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 justify-end items-start md:items-end">
                        <div className="text-sm text-muted-foreground text-right">
                          <div>Session: <span className="font-mono text-xs">{appointment.sessionId}</span></div>
                          <div>Payment: <span className="font-mono text-xs">{appointment.payment?.intentId || '—'}</span></div>
                          <div>Status: <strong>{appointment.status}</strong></div>
                        </div>
                        <Link to={`/appointments/${appointment.id}?sessionId=${appointment.sessionId}&slotIndex=${appointment.slotIndex}`} className="text-primary hover:underline text-sm">
                          View Details
                        </Link>
                        {appointment.status === "completed" && (
                          <Link
                            to="#"
                            className="text-primary border border-primary px-4 py-2 rounded-md text-sm hover:bg-primary/5"
                          >
                            Book Again
                          </Link>
                        )}
                      </div>
                    </div>

                    {appointment.notes && appointment.status === "completed" && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium">Doctor's Notes</p>
                        <p className="text-sm text-muted-foreground mt-1">{appointment.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
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
