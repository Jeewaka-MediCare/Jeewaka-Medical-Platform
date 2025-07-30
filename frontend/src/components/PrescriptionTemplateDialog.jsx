"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, BookOpen, Pill } from "lucide-react"


const prescriptionTemplates= [
  {
    id: "hypertension",
    name: "Hypertension Management",
    category: "Cardiovascular",
    medications: [
      {
        medication: "Lisinopril",
        dosage: "10mg",
        frequency: "Once daily",
        duration: "30 days",
        instructions: "Take with food in the morning. Monitor blood pressure daily.",
      },
      {
        medication: "Amlodipine",
        dosage: "5mg",
        frequency: "Once daily",
        duration: "30 days",
        instructions: "Take at the same time each day. May cause ankle swelling.",
      },
    ],
  },
  {
    id: "diabetes",
    name: "Type 2 Diabetes",
    category: "Endocrine",
    medications: [
      {
        medication: "Metformin",
        dosage: "500mg",
        frequency: "Twice daily",
        duration: "90 days",
        instructions: "Take with meals to reduce stomach upset. Monitor blood glucose.",
      },
      {
        medication: "Glipizide",
        dosage: "5mg",
        frequency: "Once daily",
        duration: "90 days",
        instructions: "Take 30 minutes before breakfast. Watch for signs of hypoglycemia.",
      },
    ],
  },
  {
    id: "respiratory",
    name: "Upper Respiratory Infection",
    category: "Respiratory",
    medications: [
      {
        medication: "Amoxicillin",
        dosage: "500mg",
        frequency: "Three times daily",
        duration: "7 days",
        instructions: "Take with food. Complete the full course even if feeling better.",
      },
      {
        medication: "Dextromethorphan",
        dosage: "15mg",
        frequency: "Every 4 hours as needed",
        duration: "7 days",
        instructions: "For cough suppression. Do not exceed 6 doses per day.",
      },
    ],
  },
  {
    id: "pain",
    name: "Pain Management",
    category: "Pain Relief",
    medications: [
      {
        medication: "Ibuprofen",
        dosage: "400mg",
        frequency: "Every 6 hours as needed",
        duration: "10 days",
        instructions: "Take with food. Do not exceed 1200mg per day.",
      },
      {
        medication: "Acetaminophen",
        dosage: "500mg",
        frequency: "Every 6 hours as needed",
        duration: "10 days",
        instructions: "Do not exceed 3000mg per day. Avoid alcohol.",
      },
    ],
  },
]



export function PrescriptionTemplateDialog({ isOpen, onClose, onSelectTemplate }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const categories = ["all", ...Array.from(new Set(prescriptionTemplates.map((t) => t.category)))]

  const filteredTemplates = prescriptionTemplates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.medications.some((med) => med.medication.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleSelectTemplate = (template) => {
    onSelectTemplate(template)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5" />
            <span>Prescription Templates</span>
          </DialogTitle>
          <DialogDescription>Select from pre-configured prescription templates for common conditions</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Templates</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by condition or medication..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-5">
              {categories.map((category) => (
                <TabsTrigger key={category} value={category} className="capitalize">
                  {category === "all" ? "All" : category}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map((template) => (
                  <div key={template.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{template.name}</h3>
                        <Badge variant="outline" className="mt-1">
                          {template.category}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSelectTemplate(template)}
                        className="flex items-center space-x-1"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Use Template</span>
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Medications ({template.medications.length})</Label>
                      {template.medications.map((med, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm bg-gray-50 p-2 rounded">
                          <Pill className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">{med.medication}</span>
                          <span className="text-gray-600">{med.dosage}</span>
                          <span className="text-gray-600">•</span>
                          <span className="text-gray-600">{med.frequency}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No templates found</p>
                  <p className="text-sm">Try adjusting your search or category filter</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Enhanced Add Prescription Dialog with Template Support


export function EnhancedAddPrescriptionDialog({ patient, isOpen, onClose }) {
  const [prescriptions, setPrescriptions] = useState([
    {
      id: "1",
      medication: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
      status: "active",
    },
  ])
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)

  const handleTemplateSelect = (template) => {
    const templatePrescriptions = template.medications.map((med, index) => ({
      id: (Date.now() + index).toString(),
      ...med,
      status: "active",
    }))
    setPrescriptions(templatePrescriptions)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Pill className="h-5 w-5" />
                <span>Add Prescriptions for {patient?.name}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTemplateDialogOpen(true)}
                className="flex items-center space-x-2"
              >
                <BookOpen className="h-4 w-4" />
                <span>Use Template</span>
              </Button>
            </DialogTitle>
            <DialogDescription>Add multiple medications and prescriptions for this patient</DialogDescription>
          </DialogHeader>

          {/* Rest of the prescription dialog content remains the same */}
          <div className="space-y-6">{/* Prescription forms would go here - same as before */}</div>
        </DialogContent>
      </Dialog>

      <PrescriptionTemplateDialog
        isOpen={isTemplateDialogOpen}
        onClose={() => setIsTemplateDialogOpen(false)}
        onSelectTemplate={handleTemplateSelect}
      />
    </>
  )
}
