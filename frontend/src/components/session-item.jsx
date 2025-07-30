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

  const availableSlots = session.timeSlots.filter((slot) => slot.status === "available").length
  const totalSlots = session.timeSlots.length

  return (
    <Card className="w-full shadow-lg border-0 bg-white hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <CardTitle className="text-xl font-bold text-gray-900">{session.hospital.name}</CardTitle>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{formatDate(session.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span>{session.hospital.location}</span>
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

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {session.timeSlots.map((timeSlot, index) => (
            
              <Button
                key={index}
                variant="outline"
                size="sm"
                className={`text-xs font-medium transition-all duration-200 ${
                  timeSlot.status === "available"
                    ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-400 hover:shadow-md"
                    : "border-red-300 bg-red-50 text-red-700 cursor-not-allowed opacity-75"
                }`}
                disabled={timeSlot.status === "booked"}
                onClick={() => handleSlotClick(index, timeSlot)}
              >
                <div className="flex flex-col items-center">
                  <span>{timeSlot.startTime}</span>
                  <span className="text-xs opacity-75">to</span>
                  <span>{timeSlot.endTime}</span>
                </div>
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
