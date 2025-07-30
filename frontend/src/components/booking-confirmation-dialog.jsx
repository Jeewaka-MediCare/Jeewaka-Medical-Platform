"use client"

import { Calendar, Clock, MapPin, Video, Users, DollarSign } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"


export function BookingConfirmationDialog({ open, onOpenChange, booking, onConfirm }) {
  if (!booking) return null

  const { session, timeSlot, doctor } = booking

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">Confirm Appointment</DialogTitle>
          <DialogDescription className="text-gray-600">
            Please review your appointment details before confirming.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Doctor Info */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <img
              src={doctor.profile || "/placeholder.svg"}
              alt={doctor.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h3 className="font-semibold text-gray-900">{doctor.name}</h3>
              <p className="text-sm text-blue-600">{doctor.specialization}</p>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="space-y-3 p-3 border rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="font-medium">{formatDate(session.date)}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>
                {timeSlot.startTime} - {timeSlot.endTime}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span>
                {session.hospital.name}, {session.hospital.location}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {session.type === "online" ? (
                <Video className="h-4 w-4 text-green-600" />
              ) : (
                <Users className="h-4 w-4 text-blue-600" />
              )}
              <Badge variant={session.type === "online" ? "default" : "secondary"} className="text-xs">
                {session.type === "online" ? "Online Consultation" : "In-Person Visit"}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-sm pt-2 border-t">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-semibold text-green-700">Consultation Fee: ${doctor.consultationFee}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} className="bg-blue-600 hover:bg-blue-700">
            Confirm Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
