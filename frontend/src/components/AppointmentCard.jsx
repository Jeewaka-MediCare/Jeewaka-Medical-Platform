import { useState } from "react"
import { Link } from "react-router-dom"
import { Calendar, Clock, MapPin, Globe, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format, isAfter } from "date-fns"
import MedicalRecordsModal from "./MedicalRecordsModal"
import useAuthStore from "../store/authStore"

export default function AppointmentCard({ appointment }) {
  const { userRole } = useAuthStore()
  const isDoctor = userRole === 'doctor'
  const [isMedicalRecordsOpen, setIsMedicalRecordsOpen] = useState(false)

  // Function to convert 24-hour time to 12-hour format with AM/PM
  const formatTime = (time24) => {
    if (!time24) return "TBD"
    
    const [hours, minutes] = time24.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const hours12 = hours % 12 || 12
    
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  // Function to format time range
  const formatTimeRange = (startTime, endTime) => {
    if (!startTime || !endTime) return "TBD"
    return `${formatTime(startTime)} - ${formatTime(endTime)}`
  }

  // Determine status based on current date/time
  const now = new Date()
  const appointmentDateTime = appointment.date
    ? new Date(`${appointment.date}T${appointment.startTime}`)
    : null

  const isUpcoming = appointmentDateTime ? isAfter(appointmentDateTime, now) : false
  const statusLabel = isUpcoming ? "Upcoming" : "Past"
  const badgeClass = isUpcoming
    ? "bg-green-100 text-green-800 border-green-200"
    : "bg-muted/30 text-muted-foreground border-muted/40"

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-primary/5">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{appointment.doctor.name}</CardTitle>
          <Badge variant="outline" className={badgeClass}>
            {statusLabel}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{appointment.doctor.specialization}</p>
      </CardHeader>

      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span>
                {appointment.date
                  ? format(new Date(appointment.date), "EEEE, MMMM d, yyyy")
                  : "Date TBD"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>
                {formatTimeRange(appointment.startTime, appointment.endTime)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {appointment.type === "video" || appointment.type === "online" ? (
                <>
                  <Globe className="h-4 w-4 text-primary" />
                  <span>Video Consultation</span>
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{appointment?.hospital.name}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 justify-end items-start md:items-end">
            {appointment.type === "video" && appointment.meetingLink && (
              <a
                href={appointment.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-white px-4 py-2 rounded-md text-sm hover:bg-primary/90"
              >
                Join Session
              </a>
            )}
            
            {/* Medical Records Button - Doctor Only */}
            {isDoctor && appointment.patient && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMedicalRecordsOpen(true)}
                className="w-full md:w-auto"
              >
                <FileText className="h-4 w-4 mr-2" />
                Medical Records
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      {/* Medical Records Modal */}
      {isDoctor && appointment.patient && (
        <MedicalRecordsModal
          isOpen={isMedicalRecordsOpen}
          onClose={() => setIsMedicalRecordsOpen(false)}
          patientId={appointment.patient._id || appointment.patient.id}
        />
      )}
    </Card>
  )
}
