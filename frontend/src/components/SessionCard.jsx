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
} from "lucide-react";

export function SessionCard({
  session,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}) {
  return (
    <div
      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
        isSelected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-gray-300"
      }`}
      onClick={() => onSelect(session)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="font-medium">
            {new Date(session.date).toLocaleString()}
          </span>
        </div>
        <div className="flex space-x-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(session);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(session.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2 mb-2">
        {session.type === "online" ? (
          <>
            <Video className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-blue-600 font-medium">
              Online Session
            </span>
          </>
        ) : (
          <>
            <Building2 className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600 font-medium">
              In-Person
            </span>
          </>
        )}
      </div>

      {session.hospital && (
        <div className="flex items-center space-x-2 mb-2">
          <MapPin className="h-4 w-4 text-gray-400" />
          <div className="text-sm text-gray-600">
            <div className="font-medium">{session.hospital.name}</div>
            <div className="text-xs">{session.hospital.location}</div>
          </div>
        </div>
      )}

      {session.meetingLink && (
        <div className="flex items-center space-x-2 mb-2">
          <Link className="h-4 w-4 text-gray-400" />
          <div className="text-sm text-gray-600 truncate">
            Meeting Link Available
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {session.bookedSlots}/{session.totalSlots} slots booked
        </span>
        <Badge variant="outline">{session.bookedSlots} patients</Badge>
      </div>
    </div>
  );
}
