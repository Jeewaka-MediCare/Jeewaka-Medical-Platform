"use client"

import { Calendar, Clock, MapPin, Video, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"




export function SessionItem({ session, onTimeSlotSelect }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleSlotClick = (timeSlotIndex, timeSlot) => {
    if (timeSlot.status === "available") {
      onTimeSlotSelect(session._id, timeSlotIndex, timeSlot, session)
    }
  }

  const slots = Array.isArray(session.timeSlots) ? session.timeSlots : []
  const availableSlots = slots.filter((slot) => slot.status === "available").length
  const totalSlots = slots.length

  const hospitalName = session && session.hospital && session.hospital.name ? session.hospital.name : 'Unknown hospital'
  const hospitalLocation = session && session.hospital && session.hospital.location ? session.hospital.location : 'Unknown location'

  return (
    <Card className="w-full shadow-lg border-0 bg-white hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <CardTitle className="text-xl font-bold text-gray-900">{hospitalName}</CardTitle>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{formatDate(session.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span>{hospitalLocation}</span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {availableSlots} of {totalSlots} slots available
            </div>
          </div>
          <Badge
            variant={session.type === "online" ? "default" : "secondary"}
            className={`flex items-center gap-2 px-3 py-1 text-sm font-medium ${
              session.type === "online"
                ? "bg-green-100 text-green-800 hover:bg-green-200"
                : "bg-blue-100 text-blue-800 hover:bg-blue-200"
            }`}
          >
            {session.type === "online" ? <Video className="h-4 w-4" /> : <Users className="h-4 w-4" />}
            {session.type === "online" ? "Online Consultation" : "In-Person Visit"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Clock className="h-4 w-4 text-blue-600" />
            Available Time Slots
          </div>

          <div className="flex flex-wrap gap-3">
            {session.timeSlots.map((timeSlot, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                aria-label={`Time slot ${timeSlot.startTime}–${timeSlot.endTime}`}
                className={`text-xs font-medium transition-all duration-150 px-2 py-1 flex items-center justify-center min-w-[4.5rem] md:min-w-[5.5rem] max-w-[7rem] overflow-hidden text-center ${
                  timeSlot.status === "available"
                    ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-400 hover:shadow-sm"
                    : "border-red-300 bg-red-50 text-red-700 cursor-not-allowed opacity-80"
                }`}
                disabled={timeSlot.status === "booked"}
                onClick={() => handleSlotClick(index, timeSlot)}
              >
                <span className="truncate block w-full text-xs leading-none">{`${timeSlot.startTime}–${timeSlot.endTime}`}</span>
              </Button>
            ))}
          </div>

          {availableSlots === 0 && (
            <div className="text-center py-6 bg-red-50 rounded-lg border border-red-200">
              <p className="text-red-600 font-medium">All time slots are fully booked</p>
              <p className="text-red-500 text-sm mt-1">Please check other sessions or try again later</p>
            </div>
          )}
        </div>
        </CardContent>
      </Card>
  )
}
