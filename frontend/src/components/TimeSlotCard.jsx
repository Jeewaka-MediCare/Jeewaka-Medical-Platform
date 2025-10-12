"use client"


import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Clock, Eye, Plus, Video, FileText } from "lucide-react"
import { getStatusColor, getAppointmentStatusColor } from "../utils/helpers"
import '../styles/dialogWide.css';

export function TimeSlotCard({
  slot,
  session,
  onUpdateStatus,
  onViewReports,
  onViewMedicalRecords,
  onAddObservation,
  onAddPrescription,
  onAddNote,
}) {

  return (
    <div
  className={`p-6 border rounded-lg w-full max-w-full transition-all ${
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

      {slot.status === "booked" && (slot.patientName || slot.patientId) ? (
        <div className="space-y-4">
          {/* Patient Header */}
          <div className="flex items-center p-4 bg-white rounded-lg border">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {(slot.patientId?.name || slot.patientName || 'Patient')
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 truncate">
                  {slot.patientId?.name || slot.patientName || 'Patient'}
                </h3>
                {slot.patientId?.email && (
                  <p className="text-sm text-gray-500 truncate">📧 {slot.patientId.email}</p>
                )}
                {slot.patientId?.phone && (
                  <p className="text-sm text-gray-500 truncate">📞 {slot.patientId.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Payment Information */}
          {(slot.paymentIntentId || slot.paymentAmount || slot.paymentDate) && (
            <div className="p-4 bg-white rounded-lg border">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">💳</span>Payment Information
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {slot.paymentIntentId && (
                  <div className="min-w-0">
                    <Label className="text-sm text-gray-500">Payment ID</Label>
                    <p className="font-medium text-sm font-mono truncate">
                      {slot.paymentIntentId.substring(0, 20)}...
                    </p>
                  </div>
                )}
                {slot.paymentAmount && (
                  <div>
                    <Label className="text-sm text-gray-500">Amount</Label>
                    <p className="font-medium text-lg text-green-600">
                      LKR {slot.paymentAmount}
                    </p>
                  </div>
                )}
                {slot.paymentDate && (
                  <div>
                    <Label className="text-sm text-gray-500">Payment Date</Label>
                    <p className="font-medium text-sm">
                      {new Date(slot.paymentDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                      // If this component uses a DialogContent or modal, add the dialog-wide class to it.
                      // If not, and this is a card, you can apply the class to the root div for a wide layout.

                      // Example for a card layout:
                      // <div className="dialog-wide ...otherClasses"> ... </div>

                      // If you want to make this optional, add a prop like `wide` and apply the class conditionally.

                )}
              </div>
              {(slot.paymentStatus || slot.paymentIntentId) && (
                <div className="mt-3">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                    ✅ Payment {slot.paymentStatus || 'Confirmed'}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Patient Additional Info (if available) */}
          {slot.patientId && typeof slot.patientId === 'object' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {slot.patientId.dateOfBirth && (
                <div className="p-3 bg-white rounded-lg border min-w-0">
                  <Label className="text-sm text-gray-500">Age</Label>
                  <p className="font-medium">
                    {new Date().getFullYear() - new Date(slot.patientId.dateOfBirth).getFullYear()} years
                  </p>
                </div>
              )}
              {slot.patientId.gender && (
                <div className="p-3 bg-white rounded-lg border min-w-0">
                  <Label className="text-sm text-gray-500">Gender</Label>
                  <p className="font-medium truncate">{slot.patientId.gender}</p>
                </div>
              )}
              {slot.patientId.bloodType && (
                <div className="p-3 bg-white rounded-lg border min-w-0">
                  <Label className="text-sm text-gray-500">Blood Type</Label>
                  <p className="font-medium text-red-600">{slot.patientId.bloodType}</p>
                </div>
              )}
            </div>
          )}

          {/* Patient Actions */}
          <div className="flex flex-col sm:flex-row gap-2 p-4 bg-white rounded-lg border">
            <Button size="sm" variant="outline" className="flex-1" onClick={() => onViewReports({ 
              name: slot.patientId?.name || slot.patientName, 
              id: slot.patientId?._id || slot.patientId 
            })}>
              <Eye className="h-4 w-4 mr-2" />
              View Reports
            </Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={() => onViewMedicalRecords({ 
              name: slot.patientId?.name || slot.patientName, 
              id: slot.patientId?._id || slot.patientId 
            })}>
              <FileText className="h-4 w-4 mr-2" />
              Medical Records
            </Button>
          </div>

          {/* Appointment Notes */}
          {slot.notes && (
            <div className="p-4 bg-white rounded-lg border">
              <Label className="text-sm text-gray-500">Appointment Notes</Label>
              <p className="font-medium text-sm mt-1">{slot.notes}</p>
            </div>
          )}

          {/* Status Management */}
          <div className="flex space-x-2 p-4 bg-white rounded-lg border">
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
                Start Video Call with {slot.patientId?.name || slot.patientName}
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
