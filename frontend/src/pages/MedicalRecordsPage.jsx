import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ChevronLeft, FileText, Calendar, User, Clock, Eye, FolderOpen, Stethoscope } from 'lucide-react'
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
        const res = await api.get(`/api/medical-records/patients/${backendPatientId}/records`)
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
      <main className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50">
        <div className="container mx-auto py-12 px-4">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 animate-pulse shadow-lg">
                <FileText className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-2xl font-semibold text-gray-800">Loading your medical records...</h1>
              <p className="text-gray-600">Please wait while we fetch your health information</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link
            to="/patient-dashboard"
            className="inline-flex items-center text-teal-700 hover:text-teal-800 font-medium transition-colors group"
          >
            <ChevronLeft className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-700 to-emerald-700 bg-clip-text text-transparent">
                My Medical Records
              </h1>
              <p className="text-gray-600 mt-1">View your medical history and consultation notes</p>
            </div>
          </div>
        </div>

        {records.length > 0 ? (
          <div className="grid gap-5">
            {records.map((record) => (
              <Card key={record._id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-teal-100 bg-white/80 backdrop-blur-sm group">
                <CardHeader className="pb-4 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-100">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl flex items-center gap-3 text-teal-800 group-hover:text-teal-900 transition-colors">
                        <div className="p-2 rounded-lg bg-white shadow-sm">
                          <Stethoscope className="h-5 w-5 text-teal-600" />
                        </div>
                        Medical Record
                      </CardTitle>
                      {record.description && (
                        <p className="text-sm text-gray-700 mt-2 ml-11 leading-relaxed">
                          {record.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewRecord(record)}
                      className="ml-4 border-teal-300 text-teal-700 hover:bg-teal-600 hover:text-white hover:border-teal-600 font-medium transition-all shadow-sm hover:shadow-md"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-teal-50/50 border border-teal-100">
                      <div className="p-2 rounded-lg bg-white shadow-sm">
                        <Calendar className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-teal-700 mb-1">Created</p>
                        <p className="font-bold text-gray-900">
                          {format(new Date(record.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                      <div className="p-2 rounded-lg bg-white shadow-sm">
                        <User className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-emerald-700 mb-1">Doctor</p>
                        <p className="font-bold text-gray-900">
                          {record.createdBy?.name || "Unknown"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-teal-50/50 border border-teal-100">
                      <div className="p-2 rounded-lg bg-white shadow-sm">
                        <Clock className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-teal-700 mb-1">Last Updated</p>
                        <p className="font-bold text-gray-900">
                          {format(new Date(record.updatedAt), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {record.tags && record.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-teal-100">
                      {record.tags.map((tag, idx) => (
                        <Badge
                          key={idx}
                          className="bg-gradient-to-r from-teal-100 to-emerald-100 text-teal-800 border-teal-200 hover:from-teal-200 hover:to-emerald-200 font-medium px-3 py-1"
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
          <Card className="border-teal-100 bg-white/80 backdrop-blur-sm shadow-md">
            <CardContent className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-teal-50 to-emerald-50 mb-6 border-4 border-teal-100">
                <FolderOpen className="h-12 w-12 text-teal-400" />
              </div>
              <p className="text-xl font-bold text-gray-800 mb-3">No Medical Records Yet</p>
              <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                Your medical records from consultations will appear here. After your appointments, doctors will add detailed notes about your health.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Medical Record Viewer Modal */}
        {selectedRecord && (
          <Dialog open={viewerOpen} onOpenChange={(open) => {
            if (!open) {
              setViewerOpen(false);
              setSelectedRecord(null);
            }
          }}>
            <DialogContent
              className="w-full max-w-5xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl h-[90vh] p-0 flex flex-col bg-white border-teal-100"
              style={{ maxHeight: '90vh', minWidth: '320px' }}
            >
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <MedicalRecordViewer
                  recordId={selectedRecord.recordId || selectedRecord._id}
                  onBack={() => {
                    setViewerOpen(false);
                    setSelectedRecord(null);
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </main>
  )
}