"use client"

import { useState, useEffect } from "react"
import { DoctorCard } from "@/components/doctor-card"
import { SearchFilters } from "@/components/search-filters"





export function DoctorCardList({ initialDoctors }) {
  const [doctors, setDoctors] = useState(initialDoctors)
  const [filteredDoctors, setFilteredDoctors] = useState(initialDoctors)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterOptions, setFilterOptions] = useState({})

  // Extract unique specializations for the filter dropdown
  const specializations = Array.from(new Set(initialDoctors.map((doctor) => doctor.specialization)))

  useEffect(() => {
    let result = [...initialDoctors]

    // Apply search filter
    if (searchQuery) {
      result = result.filter((doctor) => doctor.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    // Apply fee filter
    if (filterOptions.minFee !== undefined) {
      result = result.filter((doctor) => doctor.consultationFee >= filterOptions.minFee)
    }

    if (filterOptions.maxFee !== undefined) {
      result = result.filter((doctor) => doctor.consultationFee <= filterOptions.maxFee)
    }

    // Apply rating filter
    if (filterOptions.minRating !== undefined) {
      result = result.filter((doctor) => doctor.avgRating >= filterOptions.minRating)
    }

    // Apply specialization filter
    if (filterOptions.specialization) {
      result = result.filter((doctor) => doctor.specialization === filterOptions.specialization)
    }

    // Apply sorting
    if (filterOptions.sortBy) {
      result = [...result].sort((a, b) => {
        switch (filterOptions.sortBy) {
          case "fee-asc":
            return a.consultationFee - b.consultationFee
          case "fee-desc":
            return b.consultationFee - a.consultationFee
          case "rating-asc":
            return a.avgRating - b.avgRating
          case "rating-desc":
            return b.avgRating - a.avgRating
          case "name-asc":
            return a.name.localeCompare(b.name)
          case "name-desc":
            return b.name.localeCompare(a.name)
          default:
            return 0
        }
      })
    }

    setFilteredDoctors(result)
  }, [searchQuery, filterOptions, initialDoctors])

  const handleSearch = (query) => {
    setSearchQuery(query)
  }

  const handleFilter = (options) => {
    setFilterOptions(options)
  }

  return (
    <div className="space-y-8">
      <SearchFilters onSearch={handleSearch} onFilter={handleFilter} specializations={specializations} />

      {filteredDoctors.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No doctors found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDoctors.map((doctor) => (
            <DoctorCard
              key={doctor.doctor._id}
              id={doctor.doctor._id}
              name={doctor.doctor.name}
              specialization={doctor.doctor.specialization}
              profile={doctor.doctor.profile}
              consultationFee={doctor.doctor.consultationFee}
              avgRating={doctor.ratingSummary.avgRating}
              totalReviews={doctor.ratingSummary.totalReviews}
              education={doctor.doctor.qualifications}
              sessions = {doctor.sessions}
              doctor = {doctor.doctor}
              ratingSummary ={doctor.ratingSummary}
           
            />
          ))}
        </div>
      )}
    </div>
  )
}
