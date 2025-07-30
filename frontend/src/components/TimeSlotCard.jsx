"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Clock, Eye, Calendar, Plus, Video } from "lucide-react"

import { getStatusColor, getAppointmentStatusColor } from "../utils/helpers"



export function TimeSlotCard({
  slot,
  session,
  onUpdateStatus,
  onViewReports,
  onViewHistory,
  onAddObservation,
  onAddPrescription,
  onAddNote,
}) {
  // const patient = session.patients.find((p) => p._id === slot.patientId)

  return (
    <div
      className={`p-6 border rounded-lg transition-all ${
        slot.status === "booked" ? "border-blue-200 bg-blue-50" : "border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Clock className="h-5 w-5 text-gray-500" />
          <span className="text-lg font-semibold">
            {slot.startTime} - {slot.endTime}
          </span>
          <Badge className={getStatusColor(slot.status)}>{slot.status}</Badge>
        </div>
        {slot.appointmentStatus && (
          <Badge className={getAppointmentStatusColor(slot.appointmentStatus)}>{slot.appointmentStatus}</Badge>
        )}
      </div>

      {slot.status === "booked" && slot.patientName && patient ? (
        <div className="space-y-4">
          {/* Patient Header */}
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {slot.patientName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{slot.patientName}</h3>
                <p className="text-gray-600">
                  {patient.age} years • {patient.gender}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline" onClick={() => onViewReports(patient)}>
                <Eye className="h-4 w-4 mr-1" />
                View Reports
              </Button>
              <Button size="sm" variant="outline" onClick={() => onViewHistory(patient)}>
                <Calendar className="h-4 w-4 mr-1" />
                View History
              </Button>
            </div>
          </div>

          {/* Patient Quick Info */}
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-white rounded-lg border">
              <Label className="text-sm text-gray-500">Contact</Label>
              <p className="font-medium text-sm">{patient.email}</p>
              <p className="font-medium text-sm">{patient.phone}</p>
            </div>
            <div className="p-3 bg-white rounded-lg border">
              <Label className="text-sm text-gray-500">Blood Type</Label>
              <p className="font-medium">{patient.bloodType}</p>
            </div>
            <div className="p-3 bg-white rounded-lg border">
              <Label className="text-sm text-gray-500">Allergies</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {patient.allergies.map((allergy, index) => (
                  <Badge key={index} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                    {allergy}
                  </Badge>
                ))}
              </div>
            </div>
          </div> */}

          {/* Quick Actions */}
          {/* <div className="flex space-x-2 p-4 bg-white rounded-lg border">
            <Button size="sm" variant="outline" onClick={() => onAddObservation(patient)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Observation
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAddPrescription(patient)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Prescription
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAddNote(patient)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Note
            </Button>
          </div> */}

          {/* Status Management */}
          <div className="flex space-x-2 p-4 bg-white rounded-lg border">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => onUpdateStatus(slot.id, "upcoming")}
              disabled={slot.appointmentStatus === "upcoming"}
            >
              Mark Upcoming
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => onUpdateStatus(slot.id, "ongoing")}
              disabled={slot.appointmentStatus === "ongoing"}
            >
              Mark Ongoing
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => onUpdateStatus(slot.id, "reviewed")}
              disabled={slot.appointmentStatus === "reviewed"}
            >
              Mark Reviewed
            </Button>
          </div>

          {/* Online Session Actions */}
          {session.sessionType === "online" && (
            <div className="p-4 bg-white rounded-lg border">
              <Button variant="outline" size="sm" className="w-full bg-transparent">
                <Video className="h-4 w-4 mr-2" />
                Start Video Call with {slot.patientName}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Clock className="h-12 w-12 mx-auto mb-2 opacity-30" />
          <p className="font-medium">Available Time Slot</p>
          <p className="text-sm">This slot is available for booking</p>
        </div>
      )}
    </div>
  )
}
