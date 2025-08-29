export default function DoctorListView() {
  // State and logic from previous PatientDashboard.jsx
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    specialization: "all",
    subSpecialization: "all",
    minExperience: "all",
    maxExperience: "",
    language: "all",
    minFee: "",
    maxFee: "",
    gender: "all"
  });
  const [filterOptions, setFilterOptions] = useState({
    specializations: [],
    subSpecializations: [],
    languages: [],
    genders: [],
    experienceRange: { minExperience: 0, maxExperience: 40 },
    feeRange: { minFee: 0, maxFee: 10000 }
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalDoctors: 0,
    totalPages: 1
  });

  useEffect(() => {
    async function fetchFilterOptions() {
      try {
        const response = await api.get("/api/doctor/filter-options");
        setFilterOptions(response.data);
      } catch (error) {
        console.error("Failed to fetch filter options:", error)
      }
    }
    fetchFilterOptions()
  }, [])

  // Fetch doctors based on search and filters
  const searchDoctors = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery.trim()) params.append('name', searchQuery.trim())
      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value && value !== 'all') params.append(key, value)
      })
      params.append('page', page.toString())
      params.append('limit', pagination.limit.toString())
      params.append('sortBy', 'name')
      params.append('sortOrder', 'asc')
      const response = await api.get(`/api/doctor/search?${params}`)
      if (response.data.success) {
        setFilteredDoctors(response.data.data.doctors)
        setPagination(response.data.data.pagination)
      }
    } catch (error) {
      console.error("Search failed:", error)
      // Fallback to doctorCard endpoint if search fails
      const fallbackResponse = await api.get("/api/doctorCard")
      setFilteredDoctors(fallbackResponse.data)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    searchDoctors()
  }, [])

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault()
    searchDoctors(1)
  }

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // Apply filters
  const applyFilters = () => {
    searchDoctors(1)
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("")
    setActiveFilters({
      specialization: "all",
      subSpecialization: "all",
      minExperience: "all",
      maxExperience: "",
      language: "all",
      minFee: "",
      maxFee: "",
      gender: "all"
    })
    searchDoctors(1)
  }

  // Get active filter count
  const getActiveFilterCount = () => {
    return Object.values(activeFilters).filter(value => value !== "" && value !== "all").length + (searchQuery ? 1 : 0)
  }

  // Handle pagination
  const handlePageChange = (newPage) => {
    searchDoctors(newPage)
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2 text-primary">Find Your Doctor</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Browse our extensive network of qualified healthcare professionals and book your appointment today
        </p>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search doctors by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </Button>
        </form>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {/* Specialization Filter */}
            <Select value={activeFilters.specialization} onValueChange={(value) => handleFilterChange('specialization', value === 'all' ? '' : value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Specialization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specializations</SelectItem>
                {filterOptions.specializations.map((spec) => (
                  <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Language Filter */}
            <Select value={activeFilters.language} onValueChange={(value) => handleFilterChange('language', value === 'all' ? '' : value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                {filterOptions.languages.map((lang) => (
                  <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Experience Filter */}
            <Select value={activeFilters.minExperience} onValueChange={(value) => handleFilterChange('minExperience', value === 'all' ? '' : value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Experience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Experience</SelectItem>
                <SelectItem value="5">5+ years</SelectItem>
                <SelectItem value="10">10+ years</SelectItem>
                <SelectItem value="15">15+ years</SelectItem>
                <SelectItem value="20">20+ years</SelectItem>
              </SelectContent>
            </Select>

            {/* Advanced Filters Toggle */}
            <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="default">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                  {getActiveFilterCount() > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                      {getActiveFilterCount()}
                    </Badge>
                  )}
                  {showAdvancedFilters ? 
                    <ChevronUp className="h-4 w-4 ml-2" /> : 
                    <ChevronDown className="h-4 w-4 ml-2" />
                  }
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>

          {/* Apply/Clear Buttons */}
          <div className="flex gap-2">
            <Button onClick={applyFilters} size="sm">
              Apply
            </Button>
            {getActiveFilterCount() > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear ({getActiveFilterCount()})
              </Button>
            )}
          </div>
        </div>

        {/* Advanced Filters Card - Collapsible */}
        <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
          <CollapsibleContent>
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Advanced Filters</CardTitle>
              </CardHeader>
              <CardContent className="py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Sub-specialization */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold block">Sub-specialization</label>
                    <Select value={activeFilters.subSpecialization} onValueChange={(value) => handleFilterChange('subSpecialization', value === 'all' ? '' : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sub-specialization" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sub-specializations</SelectItem>
                        {filterOptions.subSpecializations.map((subSpec) => (
                          <SelectItem key={subSpec} value={subSpec}>{subSpec}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Gender */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold block">Gender</label>
                    <Select value={activeFilters.gender} onValueChange={(value) => handleFilterChange('gender', value === 'all' ? '' : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Gender</SelectItem>
                        {filterOptions.genders.map((gender) => (
                          <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Experience Range */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold block">Experience Range</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Input
                          type="number"
                          placeholder="Min years"
                          value={activeFilters.minExperience === 'all' ? '' : activeFilters.minExperience}
                          onChange={(e) => handleFilterChange('minExperience', e.target.value)}
                          min={filterOptions.experienceRange.minExperience}
                          max={filterOptions.experienceRange.maxExperience}
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          placeholder="Max years"
                          value={activeFilters.maxExperience}
                          onChange={(e) => handleFilterChange('maxExperience', e.target.value)}
                          min={filterOptions.experienceRange.minExperience}
                          max={filterOptions.experienceRange.maxExperience}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Fee Range */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold block">Consultation Fee Range</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Input
                          type="number"
                          placeholder="Min fee"
                          value={activeFilters.minFee}
                          onChange={(e) => handleFilterChange('minFee', e.target.value)}
                          min={filterOptions.feeRange.minFee}
                          max={filterOptions.feeRange.maxFee}
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          placeholder="Max fee"
                          value={activeFilters.maxFee}
                          onChange={(e) => handleFilterChange('maxFee', e.target.value)}
                          min={filterOptions.feeRange.minFee}
                          max={filterOptions.feeRange.maxFee}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 justify-end">
                  <Button onClick={applyFilters}>
                    Apply Filters
                  </Button>
                  <Button variant="outline" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Active Filters Display */}
        {getActiveFilterCount() > 0 && (
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: {searchQuery}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setSearchQuery("")}
                />
              </Badge>
            )}
            {Object.entries(activeFilters).map(([key, value]) => 
              value && value !== "all" && (
                <Badge key={key} variant="secondary" className="flex items-center gap-1">
                  {key}: {value}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleFilterChange(key, "all")}
                  />
                </Badge>
              )
            )}
          </div>
        )}

        {/* Results Summary */}
        <div className="text-sm text-muted-foreground">
          {loading ? (
            "Searching..."
          ) : (
            `Found ${pagination.totalDoctors} doctor${pagination.totalDoctors !== 1 ? 's' : ''}`
          )}
        </div>
      </div>

      {/* Doctor Cards */}
      <DoctorCardList 
        initialDoctors={filteredDoctors} 
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </main>
  )
}
