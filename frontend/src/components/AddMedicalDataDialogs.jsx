

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Pill , Zap } from "lucide-react"


export function AddObservationDialog({ patient, isOpen, onClose }) {
  const [observation, setObservation] = useState("")
  const [severity, setSeverity] = useState("medium")

  const handleSave = () => {
    if (!observation.trim()) return

    // Here you would typically save the observation to your backend
    console.log("Saving observation:", {
      patientId: patient?.id,
      observation,
      severity,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().slice(0, 5),
      doctorName: "Dr. Sarah Johnson",
    })

    // Reset form and close
    setObservation("")
    setSeverity("medium")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Observation</DialogTitle>
          <DialogDescription>Record a new clinical observation for {patient?.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="severity">Severity Level</Label>
            <Select value={severity} onValueChange={(value) => setSeverity(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="observation">Clinical Observation</Label>
            <textarea
              id="observation"
              className="w-full p-3 border rounded-lg resize-none"
              rows={4}
              placeholder="Enter your clinical observation..."
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!observation.trim()}>
              Save Observation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}



export function AddPrescriptionDialog({ patient, isOpen, onClose }) {
 //const [searchTerm, setSearchTerm] = useState("")
  const [selectedMeds, setSelectedMeds] = useState([])
  const [customMed, setCustomMed] = useState({ name: "", dosage: "", frequency: "" })

  //const filteredMeds = COMMON_MEDICATIONS.filter((med) => med.name.toLowerCase().includes(searchTerm.toLowerCase()))

  // const addCommonMed = (med) => {
  //   if (!selectedMeds.find((m) => m.name === med.name)) {
  //     setSelectedMeds([...selectedMeds, { ...med, id: Date.now() }])
  //   }
  // }

  const addCustomMed = () => {
    if (customMed.name && customMed.dosage && customMed.frequency) {
      setSelectedMeds([...selectedMeds, { ...customMed, id: Date.now() }])
      setCustomMed({ name: "", dosage: "", frequency: "" })
    }
  }

  const removeMed = (id) => {
    setSelectedMeds(selectedMeds.filter((med) => med.id !== id))
  }

  const handleSave = () => {
    if (selectedMeds.length === 0) return

    console.log("Saving prescriptions:", {
      patientId: patient?.id,
      prescriptions: selectedMeds,
      timestamp: new Date().toISOString(),
    })

    setSelectedMeds([])
    setSearchTerm("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Quick Prescriptions - {patient?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Common Medications */}
          {/* <div>
            <Label className="text-sm font-medium">Search Common Medications</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search medications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {searchTerm && (
              <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg">
                {filteredMeds.map((med, index) => (
                  <button
                    key={index}
                    onClick={() => addCommonMed(med)}
                    className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                  >
                    <div className="font-medium">{med.name}</div>
                    <div className="text-sm text-gray-600">
                      {med.dosage} - {med.frequency}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div> */}

          {/* Quick Add Custom */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <Label className="text-sm font-medium">Add Custom Medication</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Input
                placeholder="Medication name"
                value={customMed.name}
                onChange={(e) => setCustomMed({ ...customMed, name: e.target.value })}
              />
              <Input
                placeholder="Dosage"
                value={customMed.dosage}
                onChange={(e) => setCustomMed({ ...customMed, dosage: e.target.value })}
              />
              <div className="flex gap-1">
                <Input
                  placeholder="Frequency"
                  value={customMed.frequency}
                  onChange={(e) => setCustomMed({ ...customMed, frequency: e.target.value })}
                />
                <Button
                  size="sm"
                  onClick={addCustomMed}
                  disabled={!customMed.name || !customMed.dosage || !customMed.frequency}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Selected Medications */}
          {selectedMeds.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Selected Medications ({selectedMeds.length})</Label>
              <div className="space-y-2 mt-2">
                {selectedMeds.map((med) => (
                  <div key={med.id} className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                    <div>
                      <div className="font-medium">{med.name}</div>
                      <div className="text-sm text-gray-600">
                        {med.dosage} - {med.frequency}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeMed(med.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={selectedMeds.length === 0}>
              <Zap className="h-4 w-4 mr-1" />
              Prescribe All ({selectedMeds.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
  
}



export function AddNoteDialog({ patient, isOpen, onClose }) {
  const [note, setNote] = useState("")
  const [noteType, setNoteType] = useState("general")

  const handleSave = () => {
    if (!note.trim()) return

    // Here you would typically save the note to your backend
    console.log("Saving note:", {
      patientId: patient?.id,
      note,
      type: noteType,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().slice(0, 5),
      doctorName: "Dr. Sarah Johnson",
    })

    // Reset form and close
    setNote("")
    setNoteType("general")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Clinical Note</DialogTitle>
          <DialogDescription>Add a clinical note for {patient?.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Note Type</Label>
            <Select
              value={noteType}
              onValueChange={(value) => setNoteType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="follow-up">Follow-up</SelectItem>
                <SelectItem value="important">Important</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="note">Clinical Note</Label>
            <textarea
              id="note"
              className="w-full p-3 border rounded-lg resize-none"
              rows={4}
              placeholder="Enter your clinical note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!note.trim()}>
              Save Note
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
