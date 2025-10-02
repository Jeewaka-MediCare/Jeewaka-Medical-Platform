import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "../services/api.js";
import { DoctorCardList } from "@/components/doctor-card-list";

export default function PatientDashBoard() {
  const[defaultDoctors,setDefaultDoctors]=useState([]);
  const [initialDoctors, setInitialDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(""); // AI or symptom query
  const [nameSearch, setNameSearch] = useState(""); // Name search
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("desc");

  // Fetch all doctors initially
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await api.get("/api/doctorCard");
        if (response.data) {
          setInitialDoctors(response.data);
          setFilteredDoctors(response.data);
          setDefaultDoctors(response.data);
        }
      } catch (error) {
        console.error("Error fetching doctors:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  // AI search
  const searchAI = async (query) => {
    if (!query) return;
    setLoading(true);
    try {
      const response = await api.get("/api/doctor/ai-search", { params: { query } });
      if (response.data && response.data.doctorCards) {
        setInitialDoctors(response.data.doctorCards);
        setFilteredDoctors(response.data.doctorCards);
      }
    } catch (error) {
      console.error("AI Search Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sort function
  const sortDoctors = (field) => {
    let direction = "desc";
    if (sortField === field && sortDirection === "desc") direction = "asc";
    setSortField(field);
    setSortDirection(direction);

    const sorted = [...filteredDoctors].sort((a, b) => {
      let aValue, bValue;
      switch (field) {
        case "experience":
          aValue = a.doctor.yearsOfExperience;
          bValue = b.doctor.yearsOfExperience;
          break;
        case "rating":
          aValue = a.ratingSummary.avgRating;
          bValue = b.ratingSummary.avgRating;
          break;
        case "fee":
          aValue = a.doctor.consultationFee;
          bValue = b.doctor.consultationFee;
          break;
        default:
          aValue = 0; bValue = 0;
      }
      return direction === "asc" ? aValue - bValue : bValue - aValue;
    });
    setFilteredDoctors(sorted);
  };

  // Filter by name dynamically
  useEffect(() => {
    const filtered = initialDoctors.filter((d) =>
      d.doctor.name.toLowerCase().includes(nameSearch.toLowerCase())
    );
    setFilteredDoctors(filtered);
  }, [nameSearch, initialDoctors]);

  // Clear search
  const clearSearch = () => {
    setQuery("");
    setNameSearch("");
    setFilteredDoctors(defaultDoctors);
  };

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Find Your Doctor</h1>

      {/* Search Inputs */}
      <div className="flex gap-2 mb-4">
        <Input
          type="text"
          placeholder="Input symptoms or query..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button onClick={() => searchAI(query)}>AI Search</Button>

        <Input
          type="text"
          placeholder="Search by doctor name..."
          value={nameSearch}
          onChange={(e) => setNameSearch(e.target.value)}
        />
        <Button onClick={clearSearch}>Clear</Button>
      </div>

      {/* Sorting Buttons */}
      <div className="flex gap-2 mb-4">
        <Button onClick={() => sortDoctors("experience")}>Sort by Experience</Button>
        <Button onClick={() => sortDoctors("rating")}>Sort by Rating</Button>
        <Button onClick={() => sortDoctors("fee")}>Sort by Consultation Fee</Button>
      </div>

      {/* Doctor Cards */}
      <DoctorCardList
        initialDoctors={filteredDoctors}
        loading={loading}
      />
    </main>
  );
}
