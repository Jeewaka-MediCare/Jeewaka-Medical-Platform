"use client";

import { Star, GraduationCap } from "lucide-react";

import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

export function DoctorCard({
  id,
  name,
  specialization,
  profile,
  consultationFee,
  avgRating,
  totalReviews,
  education,
  sessions,
  doctor,
  ratingSummary

}) {
  return (
    <Link
      to={`/doctors/review/${id}`}
      state={{
        doctor:doctor,
        ratingSummary:ratingSummary,
        sessions:sessions
      }}
      className="block"
    >
      <Card className="overflow-hidden transition-all hover:shadow-lg border-2 border-transparent hover:border-primary/20 h-full">
        <CardContent className="p-0 h-full">
          <div className="relative h-48 w-full overflow-hidden">
            <img
              src={
                profile || "/placeholder.svg?height=400&width=400&query=doctor"
              }
              alt={name}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div className="absolute bottom-0 right-0 bg-primary text-white px-3 py-1 text-sm font-medium">
              LKR {consultationFee.toLocaleString()}
            </div>
          </div>
          <div className="p-5 space-y-3">
            <div>
              <h3 className="font-bold text-lg truncate">{name}</h3>
              <p className="text-muted-foreground text-sm">{specialization}</p>
            </div>

            <div className="flex items-center gap-1">
              <div className="bg-yellow-50 px-2 py-1 rounded-md flex items-center">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500 mr-1" />
                <span className="text-sm font-medium text-yellow-700">
                  {avgRating.toFixed(1)}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                ({totalReviews} reviews)
              </span>
            </div>

            {education && education.length > 0 && (
              <div className="flex items-start gap-2">
                <GraduationCap className="h-4 w-4 mt-0.5 text-primary" />
                <div className="flex-1">
                  <p className="text-xs font-medium">Education</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {education.map((ed) => ed).join(", ")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
