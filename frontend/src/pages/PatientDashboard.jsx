import { DoctorCardList } from "@/components/doctor-card-list"
import { useEffect , useState } from "react"
import api from "../services/api.js"



// Sample data for demonstration
// const sampleDoctors = [
//   {
//     id: "doc123",
//     name: "Dr. Jane Doe",
//     specialization: "Cardiologist",
//     profile: "/placeholder.svg?height=400&width=400",
//     consultationFee: 2500,
//     avgRating: 4.7,
//     totalReviews: 15,
//     education: [
//       { degree: "MD", institution: "Harvard Medical School", year: 2010 },
//       { degree: "MBBS", institution: "Johns Hopkins University", year: 2005 },
//     ],
//   },
//   {
//     id: "doc124",
//     name: "Dr. John Smith",
//     specialization: "Neurologist",
//     profile: "/placeholder.svg?height=400&width=400",
//     consultationFee: 3000,
//     avgRating: 4.5,
//     totalReviews: 23,
//     education: [
//       { degree: "MD", institution: "Stanford University", year: 2008 },
//       { degree: "PhD", institution: "Yale University", year: 2012 },
//     ],
//   },
//   {
//     id: "doc125",
//     name: "Dr. Sarah Johnson",
//     specialization: "Pediatrician",
//     profile: "/placeholder.svg?height=400&width=400",
//     consultationFee: 2000,
//     avgRating: 4.9,
//     totalReviews: 42,
//     education: [
//       { degree: "MD", institution: "University of California", year: 2011 },
//       { degree: "MBBS", institution: "Columbia University", year: 2007 },
//     ],
//   },
//   {
//     id: "doc126",
//     name: "Dr. Michael Chen",
//     specialization: "Dermatologist",
//     profile: "/placeholder.svg?height=400&width=400",
//     consultationFee: 2800,
//     avgRating: 4.6,
//     totalReviews: 31,
//     education: [
//       { degree: "MD", institution: "University of Chicago", year: 2009 },
//       { degree: "PhD", institution: "Northwestern University", year: 2013 },
//     ],
//   },
//   {
//     id: "doc127",
//     name: "Dr. Emily Wilson",
//     specialization: "Psychiatrist",
//     profile: "/placeholder.svg?height=400&width=400",
//     consultationFee: 3200,
//     avgRating: 4.8,
//     totalReviews: 27,
//     education: [
//       { degree: "MD", institution: "Duke University", year: 2010 },
//       { degree: "MSc", institution: "University of Pennsylvania", year: 2007 },
//     ],
//   },
//   {
//     id: "doc128",
//     name: "Dr. Robert Lee",
//     specialization: "Orthopedic Surgeon",
//     profile: "/placeholder.svg?height=400&width=400",
//     consultationFee: 3500,
//     avgRating: 4.4,
//     totalReviews: 19,
//     education: [
//       { degree: "MD", institution: "Mayo Medical School", year: 2006 },
//       { degree: "MBBS", institution: "Washington University", year: 2001 },
//     ],
//   },
//   {
//     id: "doc129",
//     name: "Dr. Lisa Martinez",
//     specialization: "Gynecologist",
//     profile: "/placeholder.svg?height=400&width=400",
//     consultationFee: 2700,
//     avgRating: 4.9,
//     totalReviews: 38,
//     education: [
//       { degree: "MD", institution: "UCLA Medical School", year: 2008 },
//       { degree: "MBBS", institution: "University of Michigan", year: 2003 },
//     ],
//   },
//   {
//     id: "doc130",
//     name: "Dr. David Kim",
//     specialization: "Cardiologist",
//     profile: "/placeholder.svg?height=400&width=400",
//     consultationFee: 2900,
//     avgRating: 4.3,
//     totalReviews: 21,
//     education: [
//       { degree: "MD", institution: "Cornell University", year: 2009 },
//       { degree: "PhD", institution: "University of Toronto", year: 2014 },
//     ],
//   },
// ]

export default function PatientDashBoard() {
  const [doctors ,  setDoctors] = useState([])
  useEffect(() =>{
  const fetchDoctors = async() =>{
    const res  = await api.get("/api/doctorCard")
    console.log(res.data)
    setDoctors(res.data)


  }
  fetchDoctors()

  } , [])
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2 text-primary">Find Your Doctor</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Browse our extensive network of qualified healthcare professionals and book your appointment today
        </p>
      </div>
      <DoctorCardList initialDoctors={doctors} />
    </main>
  )
}
