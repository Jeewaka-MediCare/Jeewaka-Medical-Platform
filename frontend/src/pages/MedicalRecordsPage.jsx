import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ChevronLeft, FileText, Calendar, User, Clock, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import api from "@/services/api.js"
import useAuthStore from "@/store/authStore"
import { format } from "date-fns"
import MedicalRecordViewer from "@/components/MedicalRecordViewer"

export default function MedicalRecordsPage() {
  const user = useAuthStore((state) => state.user)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [patientBackendId, setPatientBackendId] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [viewerOpen, setViewerOpen] = useState(false)

  useEffect(() => {
    const fetchMedicalRecords = async () => {
      if (!user) {
        setRecords([])
        setLoading(false)
        return
      }

      try {
        let backendPatientId = patientBackendId
        
        // Get backend patient ID
        if (!backendPatientId) {
          if (user._id) {
            backendPatientId = user._id
          } else if (user.uid) {
            try {
              const pRes = await api.get(`/api/patient/uuid/${user.uid}`)
              if (pRes.data && pRes.data._id) {
                backendPatientId = pRes.data._id
                setPatientBackendId(backendPatientId)
              }
            } catch {
              console.warn("No backend patient record found for uid", user.uid)
            }
          }
        }

        if (!backendPatientId) {
          console.warn("No patient ID available")
          setRecords([])
          setLoading(false)
          return
        }

        // Fetch medical records
        const res = await api.get(`/api/patients/${backendPatientId}/records`)
        console.log("Medical Records:", res.data)
        setRecords(res.data.records || [])
      } catch (err) {
        console.error("Failed to load medical records:", err)
        setRecords([])
      } finally {
        setLoading(false)
      }
    }

    fetchMedicalRecords()
  }, [user, patientBackendId])

  const handleViewRecord = (record) => {
    setSelectedRecord(record)
    setViewerOpen(true)
  }

  if (loading) {
    return (
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-semibold">Loading your medical records…</h1>
      </main>
    )
  }

  return (
    <main className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-6">
        <Link
          to="/patient-dashboard"
          className="inline-flex items-center text-primary hover:underline"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8 text-primary" />
          My Medical Records
        </h1>
        <p className="text-muted-foreground mt-2">
          View your medical history and consultation notes
        </p>
      </div>

      {records.length > 0 ? (
        <div className="grid gap-4">
          {records.map((record) => (
            <Card key={record._id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 bg-primary/5">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {record.title}
                      {!record.isDeleted && (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                          Active
                        </Badge>
                      )}
                    </CardTitle>
                    {record.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {record.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewRecord(record)}
                    className="ml-4"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="font-medium">
                        {format(new Date(record.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Doctor</p>
                      <p className="font-medium">
                        {record.createdBy?.name || "Unknown"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Last Updated</p>
                      <p className="font-medium">
                        {format(new Date(record.updatedAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                </div>

                {record.tags && record.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {record.tags.map((tag, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No Medical Records Yet</p>
            <p className="text-muted-foreground">
              Your medical records from consultations will appear here
            </p>
          </CardContent>
        </Card>
      )}

      {/* Medical Record Viewer Modal */}
      {selectedRecord && (
        <MedicalRecordViewer
          isOpen={viewerOpen}
          onClose={() => {
            setViewerOpen(false)
            setSelectedRecord(null)
          }}
          record={selectedRecord}
          readOnly={true}
        />
      )}
    </main>
  )
}
