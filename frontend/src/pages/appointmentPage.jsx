import { Link } from "react-router-dom"
import { format } from "date-fns"
import { ChevronLeft, Calendar, Clock, MapPin, Globe, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

// Mock data for past appointments
const pastAppointments = [
  {
    id: "apt1",
    doctorName: "Dr. Jane Doe",
    doctorSpecialization: "Cardiologist",
    doctorImage: "/placeholder.svg?height=100&width=100",
    date: "2025-07-10",
    startTime: "09:00",
    endTime: "09:15",
    type: "online",
    status: "completed",
    hospital: {
      name: "City Hospital",
      location: "Colombo",
    },
    notes: "Regular checkup. Blood pressure normal. Follow-up in 3 months.",
  },
  {
    id: "apt2",
    doctorName: "Dr. John Smith",
    doctorSpecialization: "Neurologist",
    doctorImage: "/placeholder.svg?height=100&width=100",
    date: "2025-06-25",
    startTime: "14:30",
    endTime: "14:45",
    type: "in-person",
    status: "completed",
    hospital: {
      name: "General Hospital",
      location: "Kandy",
    },
    notes: "Headache assessment. Prescribed medication for migraines.",
  },
  {
    id: "apt3",
    doctorName: "Dr. Sarah Johnson",
    doctorSpecialization: "Pediatrician",
    doctorImage: "/placeholder.svg?height=100&width=100",
    date: "2025-06-15",
    startTime: "10:00",
    endTime: "10:15",
    type: "online",
    status: "cancelled",
    hospital: {
      name: "Children's Hospital",
      location: "Colombo",
    },
    notes: null,
  },
]

// Mock data for upcoming appointments
const upcomingAppointments = [
  {
    id: "apt4",
    doctorName: "Dr. Jane Doe",
    doctorSpecialization: "Cardiologist",
    doctorImage: "/placeholder.svg?height=100&width=100",
    date: "2025-07-25",
    startTime: "09:00",
    endTime: "09:15",
    type: "online",
    status: "upcoming",
    hospital: {
      name: "City Hospital",
      location: "Colombo",
    },
  },
]

export default function AppointmentsPage() {
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
                        Upcoming
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{appointment.doctorSpecialization}</p>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span>{format(new Date(appointment.date), "EEEE, MMMM d, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <span>
                            {appointment.startTime} - {appointment.endTime}
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
                        <Link href={`/appointments/${appointment.id}`} className="text-primary hover:underline text-sm">
                          View Details
                        </Link>
                        {appointment.type === "online" && (
                          <Link
                            href="#"
                            className="bg-primary text-white px-4 py-2 rounded-md text-sm hover:bg-primary/90"
                          >
                            Join Video Call
                          </Link>
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
                            {format(new Date(appointment.date), "EEEE, MMMM d, yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {appointment.startTime} - {appointment.endTime}
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
                        <Link href={`/appointments/${appointment.id}`} className="text-primary hover:underline text-sm">
                          View Details
                        </Link>
                        {appointment.status === "completed" && (
                          <Link
                            href="#"
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
