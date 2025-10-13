"use client"

import { useState, useEffect } from "react"
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"




export function SearchFilters({ onSearch, onFilter, specializations }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filters, setFilters] = useState({ minRating: "", sortBy: "" })
  const [activeFilters, setActiveFilters] = useState([])

  // Fee range for the slider
  const minPossibleFee = 0
  const maxPossibleFee = 5000

  useEffect(() => {
    // Update active filters display
    const active= []

    if (filters.minFee !== undefined || filters.maxFee !== undefined) {
      active.push(`Fee: LKR ${filters.minFee || 0} - LKR ${filters.maxFee || maxPossibleFee}`)
    }

    if (filters.minRating !== "") {
      active.push(`Rating: ${filters.minRating}+`)
    }

    if (filters.specialization) {
      active.push(`Specialization: ${filters.specialization}`)
    }

    if (filters.sortBy) {
      const sortLabels = {
        "fee-asc": "Fee: Low to High",
        "fee-desc": "Fee: High to Low",
        "rating-asc": "Rating: Low to High",
        "rating-desc": "Rating: High to Low",
        "name-asc": "Name: A to Z",
        "name-desc": "Name: Z to A",
      }
      active.push(`Sort: ${sortLabels[filters.sortBy]}`)
    }

    setActiveFilters(active)
  }, [filters, maxPossibleFee])

  const handleSearch = () => {
    onSearch(searchQuery)
  }

  const handleFilterChange = (newFilters) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    onFilter(updatedFilters)
  }

  const clearFilter = (filterType) => {
    const updatedFilters = { ...filters }

    if (filterType.startsWith("Fee")) {
      delete updatedFilters.minFee
      delete updatedFilters.maxFee
    } else if (filterType.startsWith("Rating")) {
      delete updatedFilters.minRating
    } else if (filterType.startsWith("Specialization")) {
      delete updatedFilters.specialization
    } else if (filterType.startsWith("Sort")) {
      delete updatedFilters.sortBy
    }

    setFilters(updatedFilters)
    onFilter(updatedFilters)
  }

  const clearAllFilters = () => {
    setFilters({ minRating: "", sortBy: "" })
    onFilter({ minRating: "", sortBy: "" })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search doctors by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSearch} className="flex-shrink-0">
            Search
          </Button>
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex-shrink-0 bg-transparent">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Filter Doctors</SheetTitle>
              </SheetHeader>
              <div className="py-6 space-y-6">
                <Collapsible defaultOpen className="border-b pb-4">
                  <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <h3 className="text-sm font-medium">Consultation Fee</h3>
                    <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4">
                    <div className="space-y-4">
                      <Slider
                        defaultValue={[filters.minFee || minPossibleFee, filters.maxFee || maxPossibleFee]}
                        min={minPossibleFee}
                        max={maxPossibleFee}
                        step={100}
                        onValueChange={(values) => {
                          handleFilterChange({
                            minFee: values[0],
                            maxFee: values[1],
                          })
                        }}
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-sm">LKR {filters.minFee || minPossibleFee}</p>
                        <p className="text-sm">LKR {filters.maxFee || maxPossibleFee}</p>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible defaultOpen className="border-b pb-4">
                  <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <h3 className="text-sm font-medium">Rating</h3>
                    <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4">
                    <Select
                      value={filters.minRating || "Any Rating"}
                      onValueChange={(value) => handleFilterChange({ minRating: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select minimum rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Any Rating">Any Rating</SelectItem>
                        <SelectItem value="4">4+ Stars</SelectItem>
                        <SelectItem value="3">3+ Stars</SelectItem>
                        <SelectItem value="2">2+ Stars</SelectItem>
                      </SelectContent>
                    </Select>
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible defaultOpen className="border-b pb-4">
                  <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <h3 className="text-sm font-medium">Specialization</h3>
                    <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4">
                    <Select
                      value={filters.specialization || "All Specializations"}
                      onValueChange={(value) => handleFilterChange({ specialization: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select specialization" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All Specializations">All Specializations</SelectItem>
                        {specializations.map((spec) => (
                          <SelectItem key={spec} value={spec}>
                            {spec}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <h3 className="text-sm font-medium">Sort By</h3>
                    <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4">
                    <Select
                      value={filters.sortBy || "Default"}
                      onValueChange={(value) =>
                        handleFilterChange({
                          sortBy: value
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select sorting option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Default">Default</SelectItem>
                        <SelectItem value="fee-asc">Fee: Low to High</SelectItem>
                        <SelectItem value="fee-desc">Fee: High to Low</SelectItem>
                        <SelectItem value="rating-desc">Rating: High to Low</SelectItem>
                        <SelectItem value="rating-asc">Rating: Low to High</SelectItem>
                        <SelectItem value="name-asc">Name: A to Z</SelectItem>
                        <SelectItem value="name-desc">Name: Z to A</SelectItem>
                      </SelectContent>
                    </Select>
                  </CollapsibleContent>
                </Collapsible>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={clearAllFilters}>
                    Clear All
                  </Button>
                  <Button onClick={() => setIsFilterOpen(false)}>Apply Filters</Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <Badge key={filter} variant="secondary" className="px-3 py-1">
              {filter}
              <button onClick={() => clearFilter(filter)} className="ml-2 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {activeFilters.length > 1 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-7 text-xs">
              Clear All
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
