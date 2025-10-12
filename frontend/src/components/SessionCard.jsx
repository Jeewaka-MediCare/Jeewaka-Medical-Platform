"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Edit,
  Trash2,
  Video,
  Building2,
  MapPin,
  Link,
  Monitor,
  Camera,
} from "lucide-react";

export function SessionCard({
  session,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getSessionTime = (session) => {
    // Helper function to convert time string to minutes for comparison
    const timeToMinutes = (timeStr) => {
      const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!match) return 0;
      
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const period = match[3].toUpperCase();
      
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      
      return hours * 60 + minutes;
    };

    // Get the earliest time slot for this session
    if (session.timeSlots && session.timeSlots.length > 0) {
      console.log('🕐 Session timeSlots:', session.timeSlots);
      const earliestSlot = session.timeSlots.reduce((earliest, current) => {
        const earliestMinutes = timeToMinutes(earliest.startTime);
        const currentMinutes = timeToMinutes(current.startTime);
        return earliestMinutes <= currentMinutes ? earliest : current;
      });
      console.log('🕐 Earliest slot startTime:', earliestSlot.startTime);
      
      // Ensure AM/PM format
      const timeStr = earliestSlot.startTime;
      if (timeStr && !timeStr.includes('AM') && !timeStr.includes('PM')) {
        // If time doesn't have AM/PM, format it properly
        const time24 = timeStr.split(':');
        if (time24.length === 2) {
          let hours = parseInt(time24[0]);
          const minutes = time24[1];
          const ampm = hours >= 12 ? 'PM' : 'AM';
          hours = hours % 12;
          if (hours === 0) hours = 12;
          return `${hours}:${minutes} ${ampm}`;
        }
      }
      
      return timeStr;
    }
    
    // Fallback to session date if no time slots
    const date = new Date(session.date);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const isOnline = session.sessionType === "online" || session.type === "online" || 
                  session.sessionType === "video" || session.type === "video";

  console.log('🎯 Session type debug:', {
    sessionType: session.sessionType,
    type: session.type,
    isOnline: isOnline
  });

  return (
    <div
      className={`rounded-lg border-2 transition-all duration-200 ${
        isSelected
          ? isOnline 
            ? "border-slate-400 bg-slate-200 shadow-lg text-slate-800"
            : "border-green-300 bg-green-50 shadow-md"
          : isOnline
            ? "border-slate-300 bg-slate-100 hover:border-slate-400 hover:shadow-md hover:bg-slate-200 text-slate-700"
            : "border-green-200 bg-gray-50 hover:border-green-300 hover:shadow-sm hover:bg-green-50"
      }`}
    >
      {/* Main Session Info */}
      <div 
        className="p-4 cursor-pointer"
        onClick={() => onSelect(session)}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Calendar className={`h-4 w-4 ${isOnline ? 'text-slate-600' : 'text-gray-500'}`} />
            <div>
              <div className={`font-medium ${isOnline ? 'text-slate-800' : 'text-gray-900'}`}>
                {formatDate(session.date)}
              </div>
              <div className={`text-xs ${isOnline ? 'text-slate-600' : 'text-gray-500'}`}>
                {getSessionTime(session)}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(session);
              }}
              className={`h-8 w-8 p-0 ${isOnline ? 'text-slate-600 hover:text-slate-800 hover:bg-slate-300' : ''}`}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(session._id);
              }}
              className={`h-8 w-8 p-0 text-red-600 hover:text-red-700 ${isOnline ? 'text-red-500 hover:text-red-600 hover:bg-slate-300' : ''}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Booking Status */}
        <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                {session.timeSlots?.filter(slot => slot.status === 'booked').length || 0}/{session.timeSlots?.length || 0} slots booked
              </span>
            </div>
            {session.timeSlots?.filter(slot => slot.status === 'available').length > 0 && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600">
                  {session.timeSlots?.filter(slot => slot.status === 'available').length} available
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Session Type */}
        <div className="flex items-center space-x-2 mb-3">
          {isOnline ? (
            <>
              <Monitor className="h-5 w-5 text-slate-700" />
              <Badge variant="default" className="bg-slate-700 text-white border-slate-700 font-semibold px-3 py-1">
                💻 Video Consultation
              </Badge>
            </>
          ) : (
            <>
              <Building2 className="h-5 w-5 text-green-600" />
              <Badge variant="outline" className="bg-white text-green-700 border-green-300 font-semibold px-3 py-1">
                🏥 {session.sessionType || session.type || "In-Person"}
              </Badge>
            </>
          )}
        </div>

        {/* Location Info - Only show for in-person sessions */}
        {!isOnline && session.hospital && (
          <div className="flex items-center space-x-2 mb-3">
            <MapPin className="h-4 w-4 text-gray-400" />
            <div className="text-sm">
              <div className="font-medium text-gray-900">{session.hospital.name}</div>
              <div className="text-xs text-gray-500">{session.hospital.location}</div>
            </div>
          </div>
        )}
        
        {/* Debug: Show if hospital data is missing for in-person sessions only */}
        {!isOnline && !session.hospital && (
          <div className="flex items-center space-x-2 mb-3">
            <MapPin className="h-4 w-4 text-gray-400" />
            <div className="text-sm text-gray-500">
              Location data not available
            </div>
          </div>
        )}

        {/* Meeting Link Info - Only show for online sessions */}
        {session.meetingLink && isOnline && (
          <div className="flex items-center space-x-2 mb-3">
            <Link className="h-4 w-4 text-slate-600" />
            <div className="text-sm text-slate-600 font-medium">
              Meeting link ready
            </div>
          </div>
        )}



        {/* Online Session Indicator */}
        {isOnline && !session.meetingLink && (
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
            <div className="text-sm text-slate-600 font-medium">
              Video session scheduled
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
