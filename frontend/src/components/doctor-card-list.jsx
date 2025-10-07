"use client"

import { useState, useEffect } from "react"
import { DoctorCard } from "@/components/doctor-card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

export function DoctorCardList({ 
  initialDoctors, 
  loading = false, 
  pagination = null, 
  onPageChange = null 
}) {
  const [doctors, setDoctors] = useState(initialDoctors || [])
  console.log("DoctorCardList doctors:", initialDoctors)

  // Update doctors when initialDoctors changes
  useEffect(() => {
    setDoctors(initialDoctors || [])
  }, [initialDoctors])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Searching for doctors...</p>
        </div>
      </div>
    )
  }

  if (!doctors || doctors.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold mb-2">No doctors found</h3>
        <p className="text-muted-foreground">
          Try adjusting your search criteria or clear the filters to see more results.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Doctor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {doctors.map((doctor) => {
          // Handle both new search API format and old doctorCard format
          const doctorData = doctor.doctor || doctor;
          const ratingData = doctor.ratingSummary || {};
          
          return (
            <DoctorCard 
              key={doctorData._id || doctorData.id} 
              id={doctorData._id || doctorData.id}
              name={doctorData.name}
              specialization={doctorData.specialization}
              profile={doctorData.profile}
              consultationFee={doctorData.consultationFee}
              avgRating={ratingData.avgRating || 4.5}
              totalReviews={ratingData.totalReviews || 0}
              education={doctorData.qualifications || []}
              sessions={doctor.sessions || []}
              doctor={doctorData}
              ratingSummary={ratingData}
            />
          )
        })}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(pagination.currentPage - 1)}
            disabled={!pagination.hasPrev}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <div className="flex items-center space-x-1">
            {/* Show page numbers */}
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNum = Math.max(1, pagination.currentPage - 2) + i
              if (pageNum > pagination.totalPages) return null
              
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === pagination.currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange?.(pageNum)}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(pagination.currentPage + 1)}
            disabled={!pagination.hasNext}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Pagination Info */}
      {pagination && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{" "}
          {Math.min(pagination.currentPage * pagination.limit, pagination.totalDoctors)} of{" "}
          {pagination.totalDoctors} doctors
        </div>
      )}
    </div>
  )
}
