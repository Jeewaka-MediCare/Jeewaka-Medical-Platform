"use client"



import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import {
  CalendarIcon,
  Check,
  ChevronsUpDown,
  Plus,
  X,
  Upload,
  User,
  Edit3,
  Save,
  XCircle,
  Camera,
  Stethoscope,
  Award,
  Globe,
} from "lucide-react"
import { format } from "date-fns"
import api from "../services/api"
import useAuthStore from "../store/authStore"

// Predefined data to avoid typing conflicts
const SPECIALIZATIONS = [
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "General Medicine",
  "Gynecology",
  "Neurology",
  "Oncology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Radiology",
  "Surgery",
  "Urology",
  "Ophthalmology",
  "ENT",
]

const SUB_SPECIALIZATIONS = {
  Cardiology: ["Interventional Cardiology", "Electrophysiology", "Heart Failure", "Preventive Cardiology"],
  Dermatology: ["Dermatopathology", "Pediatric Dermatology", "Cosmetic Dermatology", "Dermatologic Surgery"],
  Endocrinology: ["Diabetes", "Thyroid Disorders", "Reproductive Endocrinology", "Pediatric Endocrinology"],
  Gastroenterology: ["Hepatology", "Inflammatory Bowel Disease", "Endoscopy", "Pediatric Gastroenterology"],
  "General Medicine": ["Internal Medicine", "Family Medicine", "Geriatrics", "Preventive Medicine"],
  Gynecology: ["Obstetrics", "Reproductive Medicine", "Gynecologic Oncology", "Maternal-Fetal Medicine"],
  Neurology: ["Stroke", "Epilepsy", "Movement Disorders", "Neuromuscular Disorders"],
  Oncology: ["Medical Oncology", "Radiation Oncology", "Surgical Oncology", "Pediatric Oncology"],
  Orthopedics: ["Sports Medicine", "Spine Surgery", "Joint Replacement", "Pediatric Orthopedics"],
  Pediatrics: ["Neonatology", "Pediatric Cardiology", "Pediatric Neurology", "Adolescent Medicine"],
  Psychiatry: ["Child Psychiatry", "Addiction Medicine", "Geriatric Psychiatry", "Forensic Psychiatry"],
  Surgery: ["General Surgery", "Cardiac Surgery", "Neurosurgery", "Plastic Surgery"],
  Urology: ["Pediatric Urology", "Urologic Oncology", "Female Urology", "Male Infertility"],
  Ophthalmology: ["Retina", "Cornea", "Glaucoma", "Pediatric Ophthalmology"],
  ENT: ["Head and Neck Surgery", "Pediatric ENT", "Rhinology", "Otology"],
}

const LANGUAGES = [
  "Sinhala",
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Hindi",
  "Mandarin",
  "Arabic",
  "Russian",
  "Japanese",
  "Korean",
]

const QUALIFICATIONS = ["MBBS", "MD", "MS", "DNB", "DM", "MCh", "FRCS", "MRCP", "FACC", "FACS", "PhD", "Fellowship"]

const initialData = {
  name: "Dr. Sarah Johnson",
  email: "sarah.johnson@hospital.com",
  phone: "+1-555-0123",
  gender: "Female",
  profile: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face",
  dob: new Date("1985-03-15"),
  specialization: "", // Empty initially
  subSpecializations: [], // Empty array
  regNo: "MED123456",
  qualifications: [], // Empty array
  yearsOfExperience: 0, // Zero initially
  languagesSpoken: [], // Empty array
  bio: "",
  consultationFee: 0, // Zero initially
}

const getIncompleteFields = (data) => {
  const incomplete = []

  if (!data.specialization) incomplete.push("Primary Specialization")
  if (data.subSpecializations.length === 0) incomplete.push("Sub-specializations")
  if (data.qualifications.length === 0) incomplete.push("Qualifications")
  if (data.yearsOfExperience === 0) incomplete.push("Years of Experience")
  if (data.consultationFee === 0||data.consultationFee==null) incomplete.push("Consultation Fee")
  if (!(data.bio||"").trim()) incomplete.push("Professional Bio")
  if (data.languagesSpoken.length === 0) incomplete.push("Languages Spoken")

  return incomplete
}

export default function DoctorProfileUpdate() {
  const { user } = useAuthStore();
  
  const [formData, setFormData] = useState(initialData)
  const [originalData, setOriginalData] = useState(initialData)
  const [isEditMode, setIsEditMode] = useState(false)
  const [openSpecialization, setOpenSpecialization] = useState(false)
  const [openSubSpec, setOpenSubSpec] = useState(false)
  const [openLanguages, setOpenLanguages] = useState(false)
  const [openQualifications, setOpenQualifications] = useState(false)
  const [incompleteFields, setIncompleteFields] = useState([])
  const [isloading ,setIsLoading]= useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const incomplete = getIncompleteFields(formData)
    setIncompleteFields(incomplete)
  }, [formData])

  useEffect(() =>{
    console.log('DoctorProfileSetting - Current user from authStore:', user);
    if (user) {
      setFormData(user)
      setOriginalData(user)
    }
  } , [user])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addItem = (field, item) => {
    if (!formData[field ]?.includes(item)) {
      handleInputChange(field, [...(formData[field]), item])
    }
  }

  const removeItem = (field, item) => {
    handleInputChange(
      field,
      (formData[field ] ).filter((i) => i !== item),
    )
  }

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result
        handleInputChange("profile", result)
      }
      reader.readAsDataURL(file)
    }
  }

  const getChangedFields = () => {
    const changes = {}

    Object.keys(formData).forEach((key) => {
      const originalValue = originalData[key]
      const currentValue = formData[key]

      // Deep comparison for arrays
      if (Array.isArray(originalValue) && Array.isArray(currentValue)) {
        if (JSON.stringify(originalValue.sort()) !== JSON.stringify(currentValue.sort())) {
          changes[key] = { old: originalValue, new: currentValue }
        }
      }
      // Date comparison
      else if (originalValue instanceof Date && currentValue instanceof Date) {
        if (originalValue.getTime() !== currentValue.getTime()) {
          changes[key] = { old: originalValue, new: currentValue }
        }
      }
      // Regular comparison
      else if (originalValue !== currentValue) {
        changes[key] = { old: originalValue, new: currentValue }
      }
    })

    return changes
  }

  const handleSave = async() => {
    setIsLoading(true)
    const changedFields = getChangedFields()

    if (Object.keys(changedFields).length > 0) {
      console.log("🔄 Changed Fields:", changedFields)
      const { sessions, uuid, _id ,...payload } = formData
      try{

        const res= await api.put(`api/doctor/${formData._id}`, payload)
      if(res.data.success){

        setIsLoading(false)
        console.log(res.data.doctor)
      }else{
        setIsLoading(false)
        console.log("Error updating doctor profile:", res.data.message)
      }


      }catch(err){
        console.log(err)
      }
      


    console.log("📋 Complete Updated Data (without sessions/uuid):", payload)
      
    } else {
      console.log("ℹ️ No changes detected")
    }

    setOriginalData({ ...formData })
    setIsEditMode(false)
  }

  const handleCancel = () => {
    setFormData({ ...originalData })
    setIsEditMode(false)
  }

  const handleEdit = () => {
    setIsEditMode(true)
  }

  const availableSubSpecs = SUB_SPECIALIZATIONS[formData.specialization] || []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full mb-4">
            <Stethoscope className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Doctor Profile Management</h1>
          <p className="text-gray-600 mt-2 text-lg">Manage your professional information and credentials</p>
        </div>

        {/* Action Button */}
        <div className="flex justify-end mb-6">
          {!isEditMode ? (
            <Button onClick={handleEdit} className="bg-gray-800 hover:bg-gray-900 text-white shadow-lg">
              <Edit3 className="h-4 w-4 mr-2" />
              {isloading?"Saving...":"Edit Profile"}
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="border-gray-300 hover:bg-gray-50 bg-transparent"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-gray-800 hover:bg-gray-900 text-white shadow-lg">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}
        </div>

        {/* Profile Completion Banner */}
        {incompleteFields.length > 0 && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-amber-800 mb-2">
                    Complete Your Profile (
                    {Math.round(
                      ((Object.keys(initialData).length - incompleteFields.length) / Object.keys(initialData).length) *
                        100,
                    )}
                    % Complete)
                  </h3>
                  <p className="text-amber-700 mb-3">
                    Please complete the following fields to have a fully optimized profile:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {incompleteFields.map((field) => (
                      <Badge key={field} variant="outline" className="border-amber-300 text-amber-700 bg-amber-100">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-8">
          {/* Personal Information */}
          <Card className="shadow-lg border border-gray-200">
            <CardHeader className="bg-gray-800 text-white">
              <CardTitle className="flex items-center gap-3 text-xl">
                <User className="h-6 w-6" />
                Personal Information
              </CardTitle>
              <CardDescription className="text-gray-300">
                Basic personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* Profile Picture */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24 ring-4 ring-gray-200 shadow-lg">
                    <AvatarImage src={formData.profile || "/placeholder.svg"} alt={formData.name} />
                    <AvatarFallback className="bg-gray-800 text-white text-lg">
                      {formData?.name||"DR"
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {isEditMode && (
                    <div className="absolute -bottom-2 -right-2 bg-gray-800 rounded-full p-2 shadow-lg">
                      <Camera className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!isEditMode}
                    className="shadow-md hover:shadow-lg transition-shadow"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Change Photo
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">JPG, PNG up to 2MB</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter full name"
                    disabled={!isEditMode}
                    className="h-12 shadow-sm border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter email address"
                    disabled={!isEditMode}
                    className="h-12 shadow-sm border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                    Phone Number *
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Enter phone number"
                    disabled={!isEditMode}
                    className="h-12 shadow-sm border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="gender" className="text-sm font-semibold text-gray-700">
                    Gender
                  </Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => handleInputChange("gender", value)}
                    disabled={!isEditMode}
                  >
                    <SelectTrigger className="h-12 shadow-sm border-gray-300 focus:border-gray-500 focus:ring-gray-500">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Date of Birth</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full h-12 justify-start text-left font-normal shadow-sm border-gray-300 focus:border-gray-500 focus:ring-gray-500 bg-transparent"
                        disabled={!isEditMode}
                      >
                        <CalendarIcon className="mr-3 h-4 w-4 text-gray-500" />
                        {formData.dob ? format(formData.dob, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.dob}
                        onSelect={(date) => date && handleInputChange("dob", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="regNo" className="text-sm font-semibold text-gray-700">
                    Registration Number *
                  </Label>
                  <Input
                    id="regNo"
                    value={formData.regNo}
                    onChange={(e) => handleInputChange("regNo", e.target.value)}
                    placeholder="Enter registration number"
                    disabled={!isEditMode}
                    className="h-12 shadow-sm border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card className="shadow-lg border border-gray-200">
            <CardHeader className="bg-gray-800 text-white">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Award className="h-6 w-6" />
                Professional Information
              </CardTitle>
              <CardDescription className="text-gray-300">
                Specialization, qualifications, and experience details
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* Specialization */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700">Primary Specialization *</Label>
                <Popover open={openSpecialization} onOpenChange={setOpenSpecialization}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={`w-full h-12 justify-between shadow-sm border-gray-300 focus:border-gray-500 focus:ring-gray-500 bg-transparent ${
                        !formData.specialization ? "border-amber-300 bg-amber-50" : ""
                      }`}
                      disabled={!isEditMode}
                    >
                      {formData.specialization || "Complete your profile - Select specialization..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search specialization..." />
                      <CommandList>
                        <CommandEmpty>No specialization found.</CommandEmpty>
                        <CommandGroup>
                          {SPECIALIZATIONS.map((spec) => (
                            <CommandItem
                              key={spec}
                              value={spec}
                              onSelect={() => {
                                handleInputChange("specialization", spec)
                                handleInputChange("subSpecializations", [])
                                setOpenSpecialization(false)
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  formData.specialization === spec ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              {spec}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Sub-specializations */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700">Sub-specializations</Label>
                {isEditMode && (
                  <Popover open={openSubSpec} onOpenChange={setOpenSubSpec}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full h-12 justify-between shadow-sm border-gray-300 bg-transparent"
                      >
                        Add sub-specialization...
                        <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search sub-specialization..." />
                        <CommandList>
                          <CommandEmpty>No sub-specialization found.</CommandEmpty>
                          <CommandGroup>
                            {availableSubSpecs.map((subSpec) => (
                              <CommandItem
                                key={subSpec}
                                value={subSpec}
                                onSelect={() => {
                                  addItem("subSpecializations", subSpec)
                                  setOpenSubSpec(false)
                                }}
                              >
                                {subSpec}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.subSpecializations.map((subSpec) => (
                    <Badge
                      key={subSpec}
                      variant="secondary"
                      className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-800 hover:bg-gray-200"
                    >
                      {subSpec}
                      {isEditMode && (
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-red-600"
                          onClick={() => removeItem("subSpecializations", subSpec)}
                        />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Qualifications */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700">Qualifications *</Label>
                {isEditMode && (
                  <Popover open={openQualifications} onOpenChange={setOpenQualifications}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full h-12 justify-between shadow-sm border-gray-300 bg-transparent"
                      >
                        Add qualification...
                        <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search qualification..." />
                        <CommandList>
                          <CommandEmpty>No qualification found.</CommandEmpty>
                          <CommandGroup>
                            {QUALIFICATIONS.map((qual) => (
                              <CommandItem
                                key={qual}
                                value={qual}
                                onSelect={() => {
                                  addItem("qualifications", qual)
                                  setOpenQualifications(false)
                                }}
                              >
                                {qual}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.qualifications.map((qual) => (
                    <Badge
                      key={qual}
                      variant="secondary"
                      className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-800 hover:bg-gray-200"
                    >
                      {qual}
                      {isEditMode && (
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-red-600"
                          onClick={() => removeItem("qualifications", qual)}
                        />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Languages Spoken
                </Label>
                {isEditMode && (
                  <Popover open={openLanguages} onOpenChange={setOpenLanguages}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full h-12 justify-between shadow-sm border-gray-300 bg-transparent"
                      >
                        Add language...
                        <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search language..." />
                        <CommandList>
                          <CommandEmpty>No language found.</CommandEmpty>
                          <CommandGroup>
                            {LANGUAGES.map((lang) => (
                              <CommandItem
                                key={lang}
                                value={lang}
                                onSelect={() => {
                                  addItem("languagesSpoken", lang)
                                  setOpenLanguages(false)
                                }}
                              >
                                {lang}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.languagesSpoken.map((lang) => (
                    <Badge
                      key={lang}
                      variant="secondary"
                      className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-800 hover:bg-gray-200"
                    >
                      {lang}
                      {isEditMode && (
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-red-600"
                          onClick={() => removeItem("languagesSpoken", lang)}
                        />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="experience" className="text-sm font-semibold text-gray-700">
                    Years of Experience
                  </Label>
                  <Input
                    id="experience"
                    type="number"
                    value={formData.yearsOfExperience || ""}
                    onChange={(e) => handleInputChange("yearsOfExperience", Number.parseInt(e.target.value) || 0)}
                    placeholder={
                      formData.yearsOfExperience === 0
                        ? "Complete your profile - Enter years of experience"
                        : "Enter years of experience"
                    }
                    disabled={!isEditMode}
                    className={`h-12 shadow-sm border-gray-300 focus:border-gray-500 focus:ring-gray-500 ${
                      formData.yearsOfExperience === 0 ? "border-amber-300 bg-amber-50" : ""
                    }`}
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="fee" className="text-sm font-semibold text-gray-700">
                    Consultation Fee (LKR)
                  </Label>
                  <Input
                    id="fee"
                    type="number"
                    value={formData.consultationFee || ""}
                    onChange={(e) => handleInputChange("consultationFee", Number.parseInt(e.target.value) || 0)}
                    placeholder={
                      formData.consultationFee === 0
                        ? "Complete your profile - Enter consultation fee"
                        : "Enter consultation fee"
                    }
                    disabled={!isEditMode}
                    className={`h-12 shadow-sm border-gray-300 focus:border-gray-500 focus:ring-gray-500 ${
                      formData.consultationFee === 0 ? "border-amber-300 bg-amber-50" : ""
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="bio" className="text-sm font-semibold text-gray-700">
                  Professional Bio
                </Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder={
                    !formData.bio?.trim()
                      ? "Complete your profile - Write a brief professional bio..."
                      : "Write a brief professional bio..."
                  }
                  className={`min-h-[120px] shadow-sm border-gray-300 focus:border-gray-500 focus:ring-gray-500 ${
                    !(formData.bio || "").trim().trim() ? "border-amber-300 bg-amber-50" : ""
                  }`}
                  disabled={!isEditMode}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
