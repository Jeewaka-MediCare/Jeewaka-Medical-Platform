"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, Building2, Video, Check, ChevronsUpDown, AlertCircle, Loader2, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import api from "../services/api"
import useAuthStore from "../store/authStore"
import { toast } from "sonner"

// Mock hospitals data for demonstration
const mockHospitals = [
  { _id: "1", name: "City General Hospital", location: "Downtown, New York" },
  { _id: "2", name: "St. Mary's Medical Center", location: "Midtown, New York" },
  { _id: "3", name: "Metropolitan Health Institute", location: "Brooklyn, New York" },
  { _id: "4", name: "Riverside Community Hospital", location: "Queens, New York" },
  { _id: "5", name: "Central Park Medical", location: "Upper East Side, New York" },
]

export function CreateSessionDialog({ hospitals, onCreateSession }) {
  const user = useAuthStore((state) => state.user);
  console.log("user from auth sotre:" , user)

  const [isOpen, setIsOpen] = useState(false)
  const [newSessionDate, setNewSessionDate] = useState("")
  const [newSessionSlots, setNewSessionSlots] = useState(6)
  const [startTime, setStartTime] = useState("09:00")
  const [slotDuration, setSlotDuration] = useState(30)
  const [sessionType, setSessionType] = useState("in-person")
  const [selectedHospital, setSelectedHospital] = useState("")
  const [hospitalSearchOpen, setHospitalSearchOpen] = useState(false)
  const [meetingLink, setMeetingLink] = useState("")
  
  // Error handling and loading states
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [validationErrors, setValidationErrors] = useState({})
  const [overlapWarnings, setOverlapWarnings] = useState([])
  const [showOverlapWarning, setShowOverlapWarning] = useState(false)

  // Get logged-in user from localStorage or Zustand store
  const loggedInUser =  user
  console.log("logged in user: ", loggedInUser)

  if (!loggedInUser || !loggedInUser._id) {
    // Optionally, you can show a message or disable session creation
    console.error("No logged-in user found. Please log in to create a session.");
  }
  

  const validateForm = () => {
    const errors = {}
    
    if (!newSessionDate) {
      errors.date = "Session date is required"
    } else {
      // Ensure date is in YYYY-MM-DD format
      const normalizedDate = normalizeDateInput(newSessionDate)
      if (!normalizedDate) {
        errors.date = "Please enter a valid date"
      } else {
        // Update the date to normalized format if needed
        if (normalizedDate !== newSessionDate) {
          setNewSessionDate(normalizedDate)
        }
        
        const selectedDate = new Date(normalizedDate + 'T00:00:00') // Explicit local time
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        if (selectedDate < today) {
          errors.date = "Session date cannot be in the past"
        }
      }
    }
    
    if (!newSessionSlots || newSessionSlots < 1 || newSessionSlots > 20) {
      errors.slots = "Number of slots must be between 1 and 20"
    }
    
    if (sessionType === "in-person" && !selectedHospital) {
      errors.hospital = "Please select a hospital for in-person sessions"
    }
    
    if (sessionType === "online" && !meetingLink) {
      errors.meetingLink = "Meeting link is required for online sessions"
    } else if (sessionType === "online" && meetingLink && !isValidUrl(meetingLink)) {
      errors.meetingLink = "Please enter a valid meeting link"
    }
    
    setValidationErrors(errors)
    
    // Show toast for validation errors
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0]
      toast.error("Validation Error", {
        description: firstError
      })
    }
    
    return Object.keys(errors).length === 0
  }
  
  const isValidUrl = (string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  // Function to normalize date input to YYYY-MM-DD format
  const normalizeDateInput = (dateString) => {
    if (!dateString) return ""
    
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString
    }
    
    // Try to parse various manual input formats
    let parsedDate
    
    // Try MM/DD/YYYY format
    const mmddyyyy = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (mmddyyyy) {
      const [, month, day, year] = mmddyyyy
      parsedDate = new Date(year, month - 1, day) // month is 0-indexed
    }
    
    // Try DD/MM/YYYY format (less common in US but possible)
    else if (dateString.includes('/')) {
      // For ambiguous cases, assume MM/DD/YYYY (US standard)
      parsedDate = new Date(dateString)
    }
    
    // Try other formats
    else {
      parsedDate = new Date(dateString)
    }
    
    // Validate the parsed date
    if (isNaN(parsedDate.getTime())) {
      return "" // Invalid date
    }
    
    // Return in YYYY-MM-DD format
    const year = parsedDate.getFullYear()
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
    const day = String(parsedDate.getDate()).padStart(2, '0')
    
    return `${year}-${month}-${day}`
  }

  const checkForOverlaps = async (sessionDate, timeSlots) => {
    try {
      // Get the API response format correctly
      const response = await api.get(`/api/session/doctor/${loggedInUser._id}`)
      const existingSessions = response.data || [] // API returns array directly
      
      // Filter sessions for the same date
      const sameDateSessions = existingSessions.filter(session => {
        const existingDate = new Date(session.date).toDateString()
        const newDate = new Date(sessionDate).toDateString()
        return existingDate === newDate
      })
      
      if (sameDateSessions.length === 0) {
        return { hasOverlap: false, overlaps: [] }
      }
      
      // Calculate new session total time range
      const newStart = timeToMinutes(timeSlots[0].startTime)
      const newEnd = timeToMinutes(timeSlots[timeSlots.length - 1].endTime)
      
      const overlaps = []
      
      sameDateSessions.forEach(existingSession => {
        if (!existingSession.timeSlots?.length) return
        
        // Calculate existing session total time range  
        const existingStart = timeToMinutes(existingSession.timeSlots[0].startTime)
        const existingEnd = timeToMinutes(existingSession.timeSlots[existingSession.timeSlots.length - 1].endTime)
        
        // Check overlap: sessions overlap if one starts before the other ends
        if (newStart < existingEnd && newEnd > existingStart) {
          overlaps.push({
            newSessionTime: `${timeSlots[0].startTime} - ${timeSlots[timeSlots.length - 1].endTime}`,
            existingSessionTime: `${existingSession.timeSlots[0].startTime} - ${existingSession.timeSlots[existingSession.timeSlots.length - 1].endTime}`,
            existingSessionId: existingSession._id,
            sessionType: existingSession.type,
            hospital: existingSession.hospital?.name
          })
        }
      })
      
      return { hasOverlap: overlaps.length > 0, overlaps }
    } catch (error) {
      console.error("Error checking overlaps:", error)
      return { hasOverlap: false, overlaps: [] }
    }
  }
  
  const timeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  }

  const proceedWithOverlaps = async () => {
    setShowOverlapWarning(false)
    setOverlapWarnings([])
    
    // Continue with session creation ignoring overlaps
    await createSessionIgnoringOverlaps()
  }

  const resetForm = () => {
    setNewSessionDate("")
    setNewSessionSlots(6)
    setStartTime("09:00")
    setSlotDuration(30)
    setSessionType("in-person")
    setSelectedHospital("")
    setMeetingLink("")
    setError("")
    setValidationErrors({})
    setOverlapWarnings([])
    setShowOverlapWarning(false)
  }

  const createSessionIgnoringOverlaps = async () => {
    setIsLoading(true)
    
    try {
      const timeSlots = []
      const start = new Date(`2024-01-01 ${startTime}:00`)
      for (let i = 0; i < newSessionSlots; i++) {
        const slotStart = new Date(start.getTime() + i * slotDuration * 60000)
        const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000)
        timeSlots.push({
          startTime: slotStart.toTimeString().slice(0, 5),
          endTime: slotEnd.toTimeString().slice(0, 5),
          status: "available",
          appointmentStatus: "upcoming",
          patientId: null,
        })
      }
      
      const payload = {
        doctorId: loggedInUser._id,
        timeSlots: timeSlots,
        type: sessionType,
        hospital: sessionType === "in-person" ? selectedHospital : undefined,
        meetingLink: sessionType === "online" ? meetingLink : "",
        date: newSessionDate,
      }
      
      const res = await api.post("/api/session", payload)
      
      if (res.data.success) {
        console.log("Session created successfully:", res.data.session)
        onCreateSession?.(res.data.session)
        
        // Reset form
        setIsOpen(false)
        resetForm()
        
        // Show success toast
        toast.success("Session created successfully!", {
          description: `Created ${newSessionSlots} time slots despite overlaps`
        })
      } else {
        throw new Error(res.data.message || "Failed to create session")
      }
    } catch (error) {
      console.error("Error creating session:", error)
      let errorMessage = "An unexpected error occurred while creating the session"
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
      toast.error("Failed to create session", {
        description: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createSession = async() => {
    setError("")
    setValidationErrors({})
    
    if (!loggedInUser || !loggedInUser._id) {
      const errorMsg = "No logged-in user found. Please log in to create a session."
      setError(errorMsg)
      toast.error("Authentication required", {
        description: "Please log in to create a session"
      })
      return;
    }
    
    // Validate form
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)
    
    try {
      const timeSlots = []
      const start = new Date(`2024-01-01 ${startTime}:00`)
      for (let i = 0; i < newSessionSlots; i++) {
        const slotStart = new Date(start.getTime() + i * slotDuration * 60000)
        const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000)
        timeSlots.push({
          startTime: slotStart.toTimeString().slice(0, 5),
          endTime: slotEnd.toTimeString().slice(0, 5),
          status: "available",
          appointmentStatus: "upcoming",
          patientId: null,
        })
      }
      
      // Check for overlaps with existing sessions
      const overlapCheck = await checkForOverlaps(newSessionDate, timeSlots)
      
      if (overlapCheck.hasOverlap) {
        setOverlapWarnings(overlapCheck.overlaps)
        setShowOverlapWarning(true)
        setIsLoading(false)
        toast.warning("Time Overlap Detected", {
          description: `${overlapCheck.overlaps.length} time slot${overlapCheck.overlaps.length > 1 ? 's' : ''} conflict with existing sessions`
        })
        return
      }
      
      const selectedHospitalData = hospitals.find((h) => h._id === selectedHospital)
      
      const payload = {
        doctorId: loggedInUser._id,
        timeSlots: timeSlots,
        type: sessionType,
        hospital: sessionType === "in-person" ? selectedHospital : undefined,
        meetingLink: sessionType === "online" ? meetingLink : "",
        date: newSessionDate,
      }
      
      console.log("Creating session with payload:", payload)
      
      const res = await api.post("/api/session", payload)
      
      if (res.data.success) {
        console.log("Session created successfully:", res.data.session)
        
        // Create the session object for local state update
        const newSession = {
          ...res.data.session,
          doctorName: loggedInUser.name,
          hospital: selectedHospitalData,
          bookedSlots: 0,
        }
        
        onCreateSession?.(newSession)
        
        // Reset form and close dialog
        setIsOpen(false)
        resetForm()
        
        // Show success toast
        toast.success("Session created successfully!", {
          description: `Created ${newSessionSlots} time slots for ${newSessionDate}`
        })
        
      } else {
        const errorMsg = res.data.message || "Failed to create session"
        setError(errorMsg)
        toast.error("Failed to create session", {
          description: errorMsg
        })
      }
    } catch (err) {
      console.error("Error creating session:", err)
      
      let errorMessage = "An unexpected error occurred. Please try again."
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error
      } else if (err.response?.status === 404) {
        errorMessage = "Doctor not found. Please try logging in again."
      } else if (err.response?.status >= 500) {
        errorMessage = "Server error. Please try again later."
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        errorMessage = "Network error. Please check your internet connection."
      }
      
      setError(errorMessage)
      toast.error("Session creation failed", {
        description: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createSession_old = async() => {
    if (!loggedInUser || !loggedInUser._id) {
      alert("No logged-in user found. Please log in to create a session.");
      return;
    }
    if (!newSessionDate) return
    if (sessionType === "in-person" && !selectedHospital) return
    if (sessionType === "online" && !meetingLink) return

    const timeSlots = []
    const start = new Date(`2024-01-01 ${startTime}:00`)
    for (let i = 0; i < newSessionSlots; i++) {
      const slotStart = new Date(start.getTime() + i * slotDuration * 60000)
      const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000)
      timeSlots.push({
        startTime: slotStart.toTimeString().slice(0, 5),
        endTime: slotEnd.toTimeString().slice(0, 5),
        status: "available",
        appointmentStatus: "pending",
        patientId: null,
        
      })
    }
    const newSession = {
      id: `session-${Date.now()}`,
      doctorName: loggedInUser.name,
      date: newSessionDate,
      timeSlots,
      patients: [],
      totalSlots: newSessionSlots,
      bookedSlots: 0,
      sessionType,
      hospital: sessionType === "in-person" ? hospitals.find((h) => h._id === selectedHospital) : undefined,
      meetingLink: sessionType === "online" ? meetingLink : undefined,
    }

    

    const payload = {
      doctorId: loggedInUser._id,
      timeSlots: timeSlots,
      type: sessionType,
      hospital: newSession.hospital._id,
      meetingLink: newSession.meetingLink || "",
      date:newSessionDate,
    }
    console.log("new session object", payload)
    const res =  await api.post("/api/session", payload)
    if(res.data.success) {
      console.log("Session created successfully:", res.data.session)
      onCreateSession?.(newSession)
    } else {
      console.log("Failed to create session:", res.data.message)
    }

    

    
    

    

    

    // Reset form
    setIsOpen(false)
    setNewSessionDate("")
    setNewSessionSlots(6)
    setSessionType("in-person")
    setSelectedHospital("")
    setMeetingLink("")
  }

  const selectedHospitalData = hospitals.find((h) => h._id === selectedHospital)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Session
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Session</DialogTitle>
          <DialogDescription>Initialize a new session with time slots for patients</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Global Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div>
            <Label htmlFor="date">Session Date</Label>
            <Input 
              id="date" 
              type="date" 
              value={newSessionDate} 
              onChange={(e) => {
                const normalizedDate = normalizeDateInput(e.target.value)
                setNewSessionDate(normalizedDate)
                if (validationErrors.date) {
                  setValidationErrors(prev => ({ ...prev, date: "" }))
                }
              }}
              onBlur={(e) => {
                // Additional validation on blur for manual input
                const normalizedDate = normalizeDateInput(e.target.value)
                if (e.target.value && !normalizedDate) {
                  setValidationErrors(prev => ({ 
                    ...prev, 
                    date: "Please enter a valid date in MM/DD/YYYY or use the calendar picker" 
                  }))
                  toast.error("Invalid Date", {
                    description: "Please enter a valid date in MM/DD/YYYY format or use the calendar picker"
                  })
                } else if (normalizedDate && normalizedDate !== e.target.value) {
                  setNewSessionDate(normalizedDate)
                  toast.info("Date Formatted", {
                    description: `Date converted to ${normalizedDate}`
                  })
                }
              }}
              className={validationErrors.date ? "border-red-500" : ""}
              placeholder="MM/DD/YYYY or use calendar"
            />
            {validationErrors.date && (
              <p className="text-sm text-red-500 mt-1">{validationErrors.date}</p>
            )}
          </div>

          <div>
            <Label>Session Type</Label>
            <Select value={sessionType} onValueChange={(value) => setSessionType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in-person">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4" />
                    <span>In-Person</span>
                  </div>
                </SelectItem>
                <SelectItem value="online">
                  <div className="flex items-center space-x-2">
                    <Video className="h-4 w-4" />
                    <span>Online</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {sessionType === "in-person" && (
            <div>
              <Label>Hospital Location</Label>
              <Popover open={hospitalSearchOpen} onOpenChange={setHospitalSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={hospitalSearchOpen}
                    className={`w-full justify-between bg-transparent ${validationErrors.hospital ? "border-red-500" : ""}`}
                  >
                    {selectedHospitalData ? (
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{selectedHospitalData.name}</span>
                        <span className="text-sm text-muted-foreground">{selectedHospitalData.location}</span>
                      </div>
                    ) : (
                      "Select a hospital..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search hospitals..." />
                    <CommandList>
                      <CommandEmpty>No hospital found.</CommandEmpty>
                      <CommandGroup>
                        {hospitals.map((hospital) => (
                          <CommandItem
                            key={hospital._id}
                            value={`${hospital.name} ${hospital.location}`}
                            onSelect={() => {
                              setSelectedHospital(hospital._id)
                              setHospitalSearchOpen(false)
                              if (validationErrors.hospital) {
                                setValidationErrors(prev => ({ ...prev, hospital: "" }))
                              }
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedHospital === hospital._id ? "opacity-100" : "opacity-0",
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{hospital.name}</span>
                              <span className="text-sm text-muted-foreground">{hospital.location}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {validationErrors.hospital && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.hospital}</p>
              )}
            </div>
          )}

          {sessionType === "online" && (
            <div>
              <Label htmlFor="meetingLink">Meeting Link</Label>
              <Input
                id="meetingLink"
                type="url"
                placeholder="https://meet.google.com/..."
                value={meetingLink}
                onChange={(e) => {
                  setMeetingLink(e.target.value)
                  if (validationErrors.meetingLink) {
                    setValidationErrors(prev => ({ ...prev, meetingLink: "" }))
                  }
                }}
                className={validationErrors.meetingLink ? "border-red-500" : ""}
              />
              {validationErrors.meetingLink && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.meetingLink}</p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="startTime">Start Time</Label>
            <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="slots">Number of Time Slots</Label>
            <Input
              id="slots"
              type="number"
              min="1"
              max="20"
              value={newSessionSlots}
              onChange={(e) => {
                setNewSessionSlots(Number.parseInt(e.target.value))
                if (validationErrors.slots) {
                  setValidationErrors(prev => ({ ...prev, slots: "" }))
                }
              }}
              className={validationErrors.slots ? "border-red-500" : ""}
            />
            {validationErrors.slots && (
              <p className="text-sm text-red-500 mt-1">{validationErrors.slots}</p>
            )}
          </div>

          <div>
            <Label htmlFor="duration">Slot Duration (minutes)</Label>
            <Select value={slotDuration.toString()} onValueChange={(value) => setSlotDuration(Number.parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={createSession} 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Session...
              </>
            ) : (
              "Create Session"
            )}
          </Button>
        </div>
      </DialogContent>

      {/* Overlap Warning Dialog */}
      <Dialog open={showOverlapWarning} onOpenChange={setShowOverlapWarning}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Time Overlap Detected
            </DialogTitle>
            <DialogDescription>
              The following time slots conflict with your existing sessions:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            {overlapWarnings.map((overlap, index) => (
              <Alert key={index} className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-sm">
                  <div className="font-medium text-amber-800">
                    New Session: {overlap.newSessionTime}
                  </div>
                  <div className="text-amber-700">
                    Conflicts with existing {overlap.sessionType} session {overlap.existingSessionTime}
                    {overlap.hospital && (
                      <span className="text-amber-600"> at {overlap.hospital}</span>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowOverlapWarning(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={proceedWithOverlaps}
              className="flex-1 bg-amber-600 hover:bg-amber-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Anyway"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
