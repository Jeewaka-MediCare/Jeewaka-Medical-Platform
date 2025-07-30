import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Calendar } from "lucide-react"


export function PatientHistoryDialog({ patient, isOpen, onClose }) {
  if (!patient) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>{patient.name} - Patient History</span>
          </DialogTitle>
          <DialogDescription>Complete appointment history and medical timeline</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Patient Basic Info */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {patient.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{patient.name}</h2>
                <p className="text-gray-600">
                  {patient.age} years old • {patient.gender}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <Label className="text-gray-500">Email</Label>
                <p className="font-medium">{patient.email}</p>
              </div>
              <div>
                <Label className="text-gray-500">Phone</Label>
                <p className="font-medium">{patient.phone}</p>
              </div>
              <div>
                <Label className="text-gray-500">Blood Type</Label>
                <p className="font-medium">{patient.bloodType}</p>
              </div>
              <div>
                <Label className="text-gray-500">Allergies</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {patient.allergies.map((allergy, index) => (
                    <Badge key={index} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Appointment History */}
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Appointment History</span>
            </h3>
            <div className="space-y-4">
              {patient.appointmentHistory.map((appointment) => (
                <div key={appointment.id} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="font-semibold text-lg">
                        {appointment.date} at {appointment.time}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="capitalize">
                        {appointment.type}
                      </Badge>
                      <Badge
                        className={
                          appointment.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : appointment.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {appointment.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-2">{appointment.notes}</p>
                  <p className="text-sm text-gray-500">with {appointment.doctor}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
