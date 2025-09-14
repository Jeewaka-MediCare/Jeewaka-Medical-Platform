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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, Building2, Video, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import api from "../services/api"
import useAuthStore from "../store/authStore"

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

  // Get logged-in user from localStorage or Zustand store
  const loggedInUser =  user
  console.log("logged in user: ", loggedInUser)

  if (!loggedInUser || !loggedInUser._id) {
    // Optionally, you can show a message or disable session creation
    console.error("No logged-in user found. Please log in to create a session.");
  }
  

  const createSession = async() => {
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
          <div>
            <Label htmlFor="date">Session Date</Label>
            <Input id="date" type="date" value={newSessionDate} onChange={(e) => setNewSessionDate(e.target.value)} />
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
                    className="w-full justify-between bg-transparent"
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
                onChange={(e) => setMeetingLink(e.target.value)}
              />
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
              onChange={(e) => setNewSessionSlots(Number.parseInt(e.target.value))}
            />
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

          <Button onClick={createSession} className="w-full">
            Create Session
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
