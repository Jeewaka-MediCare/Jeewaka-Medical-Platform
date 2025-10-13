"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle, XCircle, Edit, Trash2, Plus, Eye, FileText, Users, Building2, UserCheck, X } from "lucide-react"
import api from "../services/api"
import { AddAdminDialog} from "../components/add-admin-dialog"
import AddAdminButton from "../components/AddAdminButton"
export default function AdminDashboard() {
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [verificationComment, setVerificationComment] = useState("")
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] = useState(false)
  const [isCertificateDialogOpen, setIsCertificateDialogOpen] = useState(false)
  const [selectedCertificates, setSelectedCertificates] = useState([])
  const [selectedDoctorName, setSelectedDoctorName] = useState("")
  const [doctorVerifications, setDoctorVerifications] = useState([])
  const [mockHospitals, setMockHospitals] = useState([])
  const [mockPatients, setMockPatients] = useState([])
  const [mockAdmins, setMockAdmins] = useState([])
   const [isDialogOpen, setIsDialogOpen] = useState(false)
 const [doctors, setDoctors] = useState([])
  useEffect(() => {
    const getDoctorVerifications = async () => {
      const res = await api.get('/api/admin-verification')
      console.log( "verfication requests", res.data)
      setDoctors(res.data)
    }
    getDoctorVerifications()


  }, [])
  useEffect(() => {
    const getHospitals = async () => {
      const res = await api.get('/api/hospital')
      console.log(res.data)
      setMockHospitals(res.data)
    }
    getHospitals()


  }, [])

  useEffect(() => {
    const getPatients = async () => {
      const res = await api.get('/api/patient')
      console.log(res.data)
      setMockPatients(res.data)
    }
    getPatients()


  }, [])

  useEffect(() => {
    const getAdmins = async () => {
      const res = await api.get('/api/admin')
      console.log(res.data)
      setMockAdmins(res.data.admins)
  
    }
    getAdmins()


  },[])

  const handleVerifyDoctor = async (doctorId, isVerified) => {
    if (!doctorId) {
      alert('Doctor ID is required to update verification status');
      return;
    }

    try {
      const payload = { isVerified, commentFromAdmin: verificationComment };
      const res = await api.put(`/api/admin-verification/${doctorId}`, payload);

      if (res && res.status === 200) {
        const message = res.data?.message || 'Verification status updated';
        alert(message);

        // Update local doctors list to reflect new status/comment
        setDoctors(prev => prev.map(d => {
          // match by either _id or doctorId field
          if (d._id === doctorId || d.doctorId === doctorId) {
            return {
              ...d,
              isVerified: !!isVerified,
              commentFromAdmin: verificationComment || d.commentFromAdmin
            };
          }
          return d;
        }));

        setIsVerificationDialogOpen(false);
        setVerificationComment("");
        setSelectedDoctor(null);
        console.log(`Verifying doctor ${doctorId}:`, { isVerified, comment: verificationComment });
      } else {
        alert('Failed to update verification status');
      }
    } catch (error) {
      console.error('Error updating verification status:', error);
      const msg = error?.response?.data?.message || error.message || 'Failed to update verification status';
      alert(msg);
    }
  }

  const handleDeletePatient = (patientId) => {
    // TODO: Call API to delete patient
    // API: DELETE /api/admin/patients/${patientId}
    const res = api.delete(`/api/patient/${patientId}`)
    console.log(`Deleting patient ${patientId}`)
  }

  const handleDeleteDoctor = (doctorId) => {
    // TODO: Call API to delete doctor
    // API: DELETE /api/admin/doctors/${doctorId}
    const res = api.delete(`/api/doctor/${doctorId}`)
    console.log(`Deleting doctor ${doctorId}`)
  }

  const handleDeleteHospital = (hospitalId) => {
    // TODO: Call API to delete hospital
    // API: DELETE /api/admin/hospitals/${hospitalId}
    const rest  = api.delete(`/api/hospital/${hospitalId}`)
    console.log(`Deleting hospital ${hospitalId}`)
  }

  const handleDeleteAdmin = (adminId) => {
    // TODO: Call API to delete admin
    // API: DELETE /api/admin/admins/${adminId}
    const res = api.delete(`/api/admin/${adminId}`)
    console.log(`Deleting admin ${adminId}`)
  }

  const handleViewCertificates = (certificates, doctorName) => {
    setSelectedCertificates(certificates)
    setSelectedDoctorName(doctorName)
    setIsCertificateDialogOpen(true)
  }

  // Mock data - replace with actual API calls
  const mockDoctors = [
    {
      _id: "1",
      name: "Dr. John Smith",
      email: "john.smith@example.com",
      phone: "+1234567890",
      specialization: "Cardiology",
      regNo: "REG001",
      profile: "/caring-doctor.png",
      certificates: ["https://example.com/cert1.pdf", "https://example.com/cert2.pdf"],
      commentFromAdmin: "All certificates verified",
      isVerified: true,
    },
    {
      _id: "2",
      name: "Dr. Sarah Johnson",
      email: "sarah.johnson@example.com",
      phone: "+1234567891",
      specialization: "Neurology",
      regNo: "REG002",
      profile: "/female-doctor.png",
      certificates: ["https://example.com/cert3.pdf"],
      commentFromAdmin: "",
      isVerified: false,
    },
  ]

  

  

  

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-balance">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage doctors, patients, hospitals, and admin users</p>
      </div>

      <Tabs defaultValue="doctors" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="doctors" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Doctors
          </TabsTrigger>
          <TabsTrigger value="patients" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Patients
          </TabsTrigger>
          <TabsTrigger value="hospitals" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Hospitals
          </TabsTrigger>
          <TabsTrigger value="admins" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Admins
          </TabsTrigger>
        </TabsList>

        {/* Doctors Management */}
        <TabsContent value="doctors">
          <Card>
            <CardHeader>
              <CardTitle>Doctor Verification & Management</CardTitle>
              <CardDescription>Verify doctor certificates and manage doctor profiles</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Registration</TableHead>
                    <TableHead>Certificates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doctors.map((doctor) => (
                    <TableRow key={doctor._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {/* <Avatar>
                            <AvatarImage src={doctor.profile || "/placeholder.svg"} />
                            <AvatarFallback>
                              {doctor.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar> */}
                          <div>
                            <p className="font-medium">{doctor.name}</p>
                            <p className="text-sm text-muted-foreground">{doctor.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{doctor.specialization}</TableCell>
                      <TableCell>{doctor.regNo}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewCertificates(doctor.certificates, doctor.name)}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          View Certificates ({doctor.certificates.length})
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Badge variant={doctor.isVerified ? "default" : "secondary"}>
                          {doctor.isVerified ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Pending
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog open={isVerificationDialogOpen} onOpenChange={setIsVerificationDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedDoctor(doctor)
                                  setVerificationComment(doctor.commentFromAdmin || "")
                                }}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Review
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Doctor Verification</DialogTitle>
                                <DialogDescription>
                                  Review and verify {selectedDoctor?.name}'s profile and certificates
                                </DialogDescription>
                              </DialogHeader>

                              {selectedDoctor && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Name</Label>
                                      <p className="text-sm">{selectedDoctor.name}</p>
                                    </div>
                                    <div>
                                      <Label>Email</Label>
                                      <p className="text-sm">{selectedDoctor.email}</p>
                                    </div>
                                    <div>
                                      <Label>Phone</Label>
                                      <p className="text-sm">{selectedDoctor.phone}</p>
                                    </div>
                                    <div>
                                      <Label>Registration No.</Label>
                                      <p className="text-sm">{selectedDoctor.regNo}</p>
                                    </div>
                                  </div>

                                  <div>
                                    <Label>Certificates</Label>
                                    <div className="mt-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleViewCertificates(selectedDoctor.certificates, selectedDoctor.name)
                                        }
                                      >
                                        <FileText className="h-3 w-3 mr-1" />
                                        View All Certificates ({selectedDoctor.certificates.length})
                                      </Button>
                                    </div>
                                  </div>

                                  <div>
                                    <Label htmlFor="comment">Admin Comment</Label>
                                    <Textarea
                                      id="comment"
                                      placeholder="Add your verification comment..."
                                      value={verificationComment}
                                      onChange={(e) => setVerificationComment(e.target.value)}
                                      className="mt-2"
                                    />
                                  </div>
                                </div>
                              )}

                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => handleVerifyDoctor(selectedDoctor?.doctorId, false)}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                                <Button onClick={() => handleVerifyDoctor(selectedDoctor?._id, true)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Verify
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // TODO: Navigate to edit doctor page
                              console.log(`Editing doctor ${doctor._id}`)
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>

                          <Button variant="destructive" size="sm" onClick={() => handleDeleteDoctor(doctor._id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <AddAdminButton uid ={doctor.uuid}/>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patients Management */}
        <TabsContent value="patients">
          <Card>
            <CardHeader>
              <CardTitle>Patient Management</CardTitle>
              <CardDescription>View, edit, and manage patient profiles</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>UUID</TableHead>
                    <TableHead>Date of Birth</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPatients.map((patient) => (
                    <TableRow key={patient._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={patient.profile || "/placeholder.svg"} />
                            <AvatarFallback>
                              {patient.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{patient.name}</p>
                            <p className="text-sm text-muted-foreground">{patient.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{patient.uuid}</TableCell>
                      <TableCell>{new Date(patient.dob).toLocaleDateString()}</TableCell>
                      <TableCell>{patient.sex}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // TODO: Navigate to edit patient page
                              console.log(`Editing patient ${patient._id}`)
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeletePatient(patient._id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <AddAdminButton uid ={patient.uuid}/>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hospitals Management */}
        <TabsContent value="hospitals">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Hospital Management</CardTitle>
                <CardDescription>Manage hospital information and details</CardDescription>
              </div>
              <Button
                onClick={() => {
                  // TODO: Open create hospital dialog
                  console.log("Creating new hospital")
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Hospital
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hospital Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockHospitals.map((hospital) => (
                    <TableRow key={hospital._id}>
                      <TableCell className="font-medium">{hospital.name}</TableCell>
                      <TableCell>{hospital.location}</TableCell>
                      <TableCell>{new Date(hospital.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // TODO: Navigate to edit hospital page
                              console.log(`Editing hospital ${hospital._id}`)
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteHospital(hospital._id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admins Management */}
        <TabsContent value="admins">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Admin Management</CardTitle>
                <CardDescription>Create and manage admin users</CardDescription>
              </div>
              <Button
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Admin
              </Button>
              <AddAdminDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAdmins.map((admin) => (
                    <TableRow key={admin._id}>
                      <TableCell className="font-medium">{admin.displayName||"admin"}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>{admin.role}</TableCell>
                      
                      
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // TODO: Navigate to edit admin page
                              console.log(`Editing admin ${admin.uid}`)
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteAdmin(admin.uid)}
                            
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Certificate Viewer Dialog */}
      <Dialog open={isCertificateDialogOpen} onOpenChange={setIsCertificateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Certificates - {selectedDoctorName}</span>
              <Button variant="ghost" size="sm" onClick={() => setIsCertificateDialogOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <DialogDescription>
              View and verify doctor certificates ({selectedCertificates.length} total)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {selectedCertificates.map((certificate, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Certificate {index + 1}</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // TODO: Open certificate in new tab
                      // window.open(certificate, '_blank')
                      console.log(`Opening certificate: ${certificate}`)
                    }}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Open in New Tab
                  </Button>
                </div>

                {/* Certificate preview area */}
                <div className="border rounded-lg p-4 bg-muted/50 min-h-[200px] flex items-center justify-center">
                  {certificate.toLowerCase().includes(".pdf") ? (
                    <div className="text-center space-y-2">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">PDF Certificate</p>
                      <p className="text-xs text-muted-foreground break-all">{certificate}</p>
                    </div>
                  ) : (
                    <div className="w-full">
                      <img
                        src={certificate || "/placeholder.svg"}
                        alt={`Certificate ${index + 1}`}
                        className="max-w-full max-h-[300px] mx-auto rounded border"
                        onError={(e) => {
                          // Fallback for broken images
                          const target = e.target 
                          target.style.display = "none"
                          target.nextElementSibling?.classList.remove("hidden")
                        }}
                      />
                      <div className="hidden text-center space-y-2 py-8">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Certificate Image</p>
                        <p className="text-xs text-muted-foreground break-all">{certificate}</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCertificateDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
