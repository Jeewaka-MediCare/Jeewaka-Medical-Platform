import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText } from "lucide-react"

import { getReportTypeColor } from "../utils/helpers"


export function PatientReportsDialog({ patient, isOpen, onClose }) {
  if (!patient) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>{patient.name} - Medical Reports</span>
          </DialogTitle>
          <DialogDescription>Complete medical reports, observations, prescriptions, and notes</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="observations">Observations</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-4">
            <div className="space-y-3">
              {patient.reports.map((report) => (
                <div key={report.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{report.title}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge className={getReportTypeColor(report.type)}>{report.type}</Badge>
                      <span className="text-sm text-gray-500">{report.date}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{report.content}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="observations" className="space-y-4">
            <div className="space-y-3">
              {patient.observations?.map((observation) => (
                <div key={observation.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">
                      {observation.date} at {observation.time}
                    </span>
                    <span className="text-sm text-gray-500">by {observation.doctorName}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{observation.observation}</p>
                </div>
              )) || <p className="text-gray-500 text-center py-8">No observations recorded</p>}
            </div>
          </TabsContent>

          <TabsContent value="prescriptions" className="space-y-4">
            <div className="space-y-3">
              {patient.prescriptions?.map((prescription) => (
                <div key={prescription.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{prescription.medication}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{prescription.dosage}</Badge>
                      <span className="text-sm text-gray-500">{prescription.date}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-gray-500">Frequency</Label>
                      <p className="font-medium">{prescription.frequency}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Duration</Label>
                      <p className="font-medium">{prescription.duration}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Label className="text-gray-500">Instructions</Label>
                    <p className="text-sm text-gray-700">{prescription.instructions}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Prescribed by {prescription.doctorName}</p>
                </div>
              )) || <p className="text-gray-500 text-center py-8">No prescriptions recorded</p>}
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <div className="space-y-3">
              {patient.notes?.map((note) => (
                <div key={note.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {note.date} at {note.time}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          note.type === "important"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : note.type === "follow-up"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-gray-50 text-gray-700 border-gray-200"
                        }
                      >
                        {note.type}
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-500">by {note.doctorName}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{note.note}</p>
                </div>
              )) || <p className="text-gray-500 text-center py-8">No notes recorded</p>}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
