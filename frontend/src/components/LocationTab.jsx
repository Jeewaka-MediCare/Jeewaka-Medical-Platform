import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Video, Building2, Globe, MapPin } from "lucide-react"


export function LocationTab({ session }) {
  return (
    <div className="space-y-4">
      {session.sessionType === "online" ? (
        <>
          <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
            <Video className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="font-medium text-blue-900">Online Video Consultation</h3>
              <p className="text-sm text-blue-700">This session will be conducted via video call</p>
            </div>
          </div>

          {session.meetingLink && (
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Meeting Link</Label>
                <Button variant="outline" size="sm" asChild>
                  <a href={session.meetingLink} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4 mr-2" />
                    Open Link
                  </a>
                </Button>
              </div>
              <p className="text-sm text-gray-600 break-all">{session.meetingLink}</p>
            </div>
          )}

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">Online Session Guidelines</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Ensure stable internet connection</li>
              <li>• Test camera and microphone beforehand</li>
              <li>• Join the meeting 5 minutes early</li>
              <li>• Have patient ID and documents ready</li>
            </ul>
          </div>
        </>
      ) : session.hospital ? (
        <>
          <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
            <Building2 className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="font-medium text-green-900">In-Person Consultation</h3>
              <p className="text-sm text-green-700">This session will be conducted at the hospital</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <Label className="text-sm font-medium">Hospital Name</Label>
              <p className="text-lg font-medium mt-1">{session.hospital.name}</p>
            </div>

            <div className="p-4 border rounded-lg">
              <Label className="text-sm font-medium">Phone</Label>
              <p className="text-lg font-medium mt-1">{session.hospital.phone}</p>
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <Label className="text-sm font-medium">Address</Label>
            </div>
            <p className="text-gray-700">{session.hospital.address}</p>
            <p className="text-gray-700">{session.hospital.city}</p>
            <Button variant="outline" size="sm" className="mt-2 bg-transparent" asChild>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(session.hospital.address + ", " + session.hospital.city)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPin className="h-4 w-4 mr-2" />
                View on Maps
              </a>
            </Button>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Visit Guidelines</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Arrive 15 minutes before appointment</li>
              <li>• Bring valid ID and insurance cards</li>
              <li>• Wear a mask in hospital premises</li>
              <li>• Follow hospital parking guidelines</li>
            </ul>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No location information available</p>
        </div>
      )}
    </div>
  )
}
