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
import { CheckCircle, XCircle, Edit, Trash2, Plus, Eye, FileText, Users, Building2, UserCheck, X, Activity } from 'lucide-react'
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
    console.log('[DEBUG] handleVerifyDoctor called with doctorId:', doctorId, 'isVerified:', isVerified, 'verificationComment:', verificationComment);
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
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50">
      <div className="container mx-auto p-6 lg:p-8">
        {/* <CHANGE> Enhanced header with medical theme and icon */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-8 border-l-4 border-teal-500">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl shadow-md">
              <Activity className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-balance bg-gradient-to-r from-teal-700 to-emerald-700 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-teal-600 text-lg mt-1">Manage doctors, patients, hospitals, and admin users</p>
            </div>
          </div>
        </div>

        {/* <CHANGE> Enhanced tabs with medical theme styling */}
        <Tabs defaultValue="doctors" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-md rounded-xl p-2 border border-teal-100">
            <TabsTrigger 
              value="doctors" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
            >
              <UserCheck className="h-4 w-4" />
              <span className="font-semibold">Doctors</span>
            </TabsTrigger>
            <TabsTrigger 
              value="patients" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
            >
              <Users className="h-4 w-4" />
              <span className="font-semibold">Patients</span>
            </TabsTrigger>
            <TabsTrigger 
              value="hospitals" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
            >
              <Building2 className="h-4 w-4" />
              <span className="font-semibold">Hospitals</span>
            </TabsTrigger>
            <TabsTrigger 
              value="admins" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
            >
              <UserCheck className="h-4 w-4" />
              <span className="font-semibold">Admins</span>
            </TabsTrigger>
          </TabsList>

          {/* Doctors Management */}
          <TabsContent value="doctors">
            {/* <CHANGE> Enhanced card with medical theme */}
            <Card className="shadow-xl border-teal-100 bg-white rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white pb-8">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <UserCheck className="h-6 w-6" />
                  Doctor Verification & Management
                </CardTitle>
                <CardDescription className="text-teal-50 text-base">
                  Verify doctor certificates and manage doctor profiles
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {/* <CHANGE> Enhanced table with better spacing and hover effects */}
                <div className="rounded-xl border border-teal-100 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-teal-50 hover:bg-teal-50">
                        <TableHead className="font-bold text-teal-900">Doctor</TableHead>
                        <TableHead className="font-bold text-teal-900">Specialization</TableHead>
                        <TableHead className="font-bold text-teal-900">Registration</TableHead>
                        <TableHead className="font-bold text-teal-900">Certificates</TableHead>
                        <TableHead className="font-bold text-teal-900">Status</TableHead>
                        <TableHead className="font-bold text-teal-900">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {doctors.map((doctor) => (
                        <TableRow key={doctor._id} className="hover:bg-teal-50/50 transition-colors">
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
                                <p className="font-semibold text-teal-900">{doctor.name}</p>
                                <p className="text-sm text-teal-600">{doctor.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-teal-800">{doctor.specialization}</TableCell>
                          <TableCell className="font-medium text-teal-700">{doctor.regNo}</TableCell>
                          <TableCell>
                            {/* <CHANGE> Enhanced button with medical theme */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewCertificates(doctor.certificates, doctor.name)}
                              className="border-teal-300 text-teal-700 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-400 transition-all"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              View Certificates ({doctor.certificates.length})
                            </Button>
                          </TableCell>
                          <TableCell>
                            {/* <CHANGE> Enhanced badge with medical theme colors */}
                            <Badge 
                              variant={doctor.isVerified ? "default" : "secondary"}
                              className={doctor.isVerified 
                                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md" 
                                : "bg-amber-100 text-amber-800 border-amber-300"
                              }
                            >
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
                                  {/* <CHANGE> Enhanced action button */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedDoctor(doctor)
                                      setVerificationComment(doctor.commentFromAdmin || "")
                                    }}
                                    className="border-teal-300 text-teal-700 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-400 transition-all"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    Review
                                  </Button>
                                </DialogTrigger>
                                {/* <CHANGE> Enhanced dialog with medical theme */}
                                <DialogContent className="max-w-2xl border-teal-100 shadow-2xl">
                                  <DialogHeader className="border-b border-teal-100 pb-4">
                                    <DialogTitle className="text-2xl font-bold text-teal-900">Doctor Verification</DialogTitle>
                                    <DialogDescription className="text-teal-600 text-base">
                                      Review and verify {selectedDoctor?.name}'s profile and certificates
                                    </DialogDescription>
                                  </DialogHeader>

                                  {selectedDoctor && (
                                    <div className="space-y-6 py-4">
                                      <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                          <Label className="text-teal-900 font-semibold">Name</Label>
                                          <p className="text-base text-teal-700 bg-teal-50 p-3 rounded-lg">{selectedDoctor.name}</p>
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-teal-900 font-semibold">Email</Label>
                                          <p className="text-base text-teal-700 bg-teal-50 p-3 rounded-lg">{selectedDoctor.email}</p>
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-teal-900 font-semibold">Phone</Label>
                                          <p className="text-base text-teal-700 bg-teal-50 p-3 rounded-lg">{selectedDoctor.phone}</p>
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-teal-900 font-semibold">Registration No.</Label>
                                          <p className="text-base text-teal-700 bg-teal-50 p-3 rounded-lg">{selectedDoctor.regNo}</p>
                                        </div>
                                      </div>

                                      <div className="space-y-3">
                                        <Label className="text-teal-900 font-semibold">Certificates</Label>
                                        <div className="mt-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              handleViewCertificates(selectedDoctor.certificates, selectedDoctor.name)
                                            }
                                            className="border-teal-300 text-teal-700 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-400"
                                          >
                                            <FileText className="h-3 w-3 mr-1" />
                                            View All Certificates ({selectedDoctor.certificates.length})
                                          </Button>
                                        </div>
                                      </div>

                                      <div className="space-y-3">
                                        <Label htmlFor="comment" className="text-teal-900 font-semibold">Admin Comment</Label>
                                        <Textarea
                                          id="comment"
                                          placeholder="Add your verification comment..."
                                          value={verificationComment}
                                          onChange={(e) => setVerificationComment(e.target.value)}
                                          className="mt-2 border-teal-200 focus:border-teal-400 focus:ring-teal-400 min-h-[100px] text-base"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  <DialogFooter className="border-t border-teal-100 pt-4 gap-3">
                                    {/* <CHANGE> Enhanced action buttons with medical theme */}
                                    <Button
                                      variant="outline"
                                      onClick={() => handleVerifyDoctor(selectedDoctor?.doctorId, false)}
                                      className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800 hover:border-red-400"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject
                                    </Button>
                                    <Button 
                                      onClick={() => handleVerifyDoctor(selectedDoctor?.doctorId, true)}
                                      className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-md"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Verify
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>

                              {/* <CHANGE> Enhanced edit button */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // TODO: Navigate to edit doctor page
                                  console.log(`Editing doctor ${doctor._id}`)
                                }}
                                className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-400"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>

                              {/* <CHANGE> Enhanced delete button */}
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => handleDeleteDoctor(doctor._id)}
                                className="bg-red-500 hover:bg-red-600 shadow-sm"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                              <AddAdminButton uid ={doctor.uuid}/>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Patients Management */}
          <TabsContent value="patients">
            {/* <CHANGE> Enhanced card with medical theme */}
            <Card className="shadow-xl border-teal-100 bg-white rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white pb-8">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <Users className="h-6 w-6" />
                  Patient Management
                </CardTitle>
                <CardDescription className="text-teal-50 text-base">
                  View, edit, and manage patient profiles
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {/* <CHANGE> Enhanced table */}
                <div className="rounded-xl border border-teal-100 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-teal-50 hover:bg-teal-50">
                        <TableHead className="font-bold text-teal-900">Patient</TableHead>
                        <TableHead className="font-bold text-teal-900">UUID</TableHead>
                        <TableHead className="font-bold text-teal-900">Date of Birth</TableHead>
                        <TableHead className="font-bold text-teal-900">Gender</TableHead>
                        <TableHead className="font-bold text-teal-900">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockPatients.map((patient) => (
                        <TableRow key={patient._id} className="hover:bg-teal-50/50 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="border-2 border-teal-200">
                                <AvatarImage src={patient.profile || "/placeholder.svg"} />
                                <AvatarFallback className="bg-teal-100 text-teal-700 font-semibold">
                                  {patient.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-teal-900">{patient.name}</p>
                                <p className="text-sm text-teal-600">{patient.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-teal-700">{patient.uuid}</TableCell>
                          <TableCell className="font-medium text-teal-800">{new Date(patient.dob).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium text-teal-700">{patient.sex}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {/* <CHANGE> Enhanced action buttons */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // TODO: Navigate to edit patient page
                                  console.log(`Editing patient ${patient._id}`)
                                }}
                                className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-400"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => handleDeletePatient(patient._id)}
                                className="bg-red-500 hover:bg-red-600 shadow-sm"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                              <AddAdminButton uid ={patient.uuid}/>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Hospitals Management */}
          <TabsContent value="hospitals">
            {/* <CHANGE> Enhanced card with medical theme */}
            <Card className="shadow-xl border-teal-100 bg-white rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white pb-8">
                <div className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold flex items-center gap-3">
                      <Building2 className="h-6 w-6" />
                      Hospital Management
                    </CardTitle>
                    <CardDescription className="text-teal-50 text-base mt-2">
                      Manage hospital information and details
                    </CardDescription>
                  </div>
                  {/* <CHANGE> Enhanced add button */}
                  <Button
                    onClick={() => {
                      // TODO: Open create hospital dialog
                      console.log("Creating new hospital")
                    }}
                    className="bg-white text-teal-700 hover:bg-teal-50 shadow-md font-semibold"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Hospital
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* <CHANGE> Enhanced table */}
                <div className="rounded-xl border border-teal-100 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-teal-50 hover:bg-teal-50">
                        <TableHead className="font-bold text-teal-900">Hospital Name</TableHead>
                        <TableHead className="font-bold text-teal-900">Location</TableHead>
                        <TableHead className="font-bold text-teal-900">Created</TableHead>
                        <TableHead className="font-bold text-teal-900">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockHospitals.map((hospital) => (
                        <TableRow key={hospital._id} className="hover:bg-teal-50/50 transition-colors">
                          <TableCell className="font-semibold text-teal-900">{hospital.name}</TableCell>
                          <TableCell className="text-teal-700">{hospital.location}</TableCell>
                          <TableCell className="text-teal-700">{new Date(hospital.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {/* <CHANGE> Enhanced action buttons */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // TODO: Navigate to edit hospital page
                                  console.log(`Editing hospital ${hospital._id}`)
                                }}
                                className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-400"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => handleDeleteHospital(hospital._id)}
                                className="bg-red-500 hover:bg-red-600 shadow-sm"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admins Management */}
          <TabsContent value="admins">
            {/* <CHANGE> Enhanced card with medical theme */}
            <Card className="shadow-xl border-teal-100 bg-white rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white pb-8">
                <div className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold flex items-center gap-3">
                      <UserCheck className="h-6 w-6" />
                      Admin Management
                    </CardTitle>
                    <CardDescription className="text-teal-50 text-base mt-2">
                      Create and manage admin users
                    </CardDescription>
                  </div>
                  {/* <CHANGE> Enhanced add button */}
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-white text-teal-700 hover:bg-teal-50 shadow-md font-semibold"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Admin
                  </Button>
                  <AddAdminDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* <CHANGE> Enhanced table */}
                <div className="rounded-xl border border-teal-100 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-teal-50 hover:bg-teal-50">
                        <TableHead className="font-bold text-teal-900">Name</TableHead>
                        <TableHead className="font-bold text-teal-900">Email</TableHead>
                        <TableHead className="font-bold text-teal-900">Role</TableHead>
                        <TableHead className="font-bold text-teal-900">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockAdmins.map((admin) => (
                        <TableRow key={admin._id} className="hover:bg-teal-50/50 transition-colors">
                          <TableCell className="font-semibold text-teal-900">{admin.displayName||"admin"}</TableCell>
                          <TableCell className="text-teal-700">{admin.email}</TableCell>
                          <TableCell>
                            {/* <CHANGE> Enhanced role badge */}
                            <Badge className="bg-teal-100 text-teal-800 border-teal-300 font-medium">
                              {admin.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {/* <CHANGE> Enhanced action buttons */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // TODO: Navigate to edit admin page
                                  console.log(`Editing admin ${admin.uid}`)
                                }}
                                className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-400"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteAdmin(admin.uid)}
                                className="bg-red-500 hover:bg-red-600 shadow-sm"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Certificate Viewer Dialog */}
        {/* <CHANGE> Enhanced certificate dialog with medical theme */}
        <Dialog open={isCertificateDialogOpen} onOpenChange={setIsCertificateDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] border-teal-100 shadow-2xl">
            <DialogHeader className="border-b border-teal-100 pb-4">
              <DialogTitle className="flex items-center justify-between text-2xl font-bold text-teal-900">
                <span className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-teal-600" />
                  Certificates - {selectedDoctorName}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsCertificateDialogOpen(false)}
                  className="hover:bg-teal-50 text-teal-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
              <DialogDescription className="text-teal-600 text-base">
                View and verify doctor certificates ({selectedCertificates.length} total)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {selectedCertificates.map((certificate, index) => (
                <Card key={index} className="p-5 border-teal-100 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-teal-900 text-lg">Certificate {index + 1}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // TODO: Open certificate in new tab
                        // window.open(certificate, '_blank')
                        console.log(`Opening certificate: ${certificate}`)
                      }}
                      className="border-teal-300 text-teal-700 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-400"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Open in New Tab
                    </Button>
                  </div>

                  {/* Certificate preview area */}
                  <div className="border-2 border-teal-100 rounded-xl p-6 bg-gradient-to-br from-teal-50 to-emerald-50 min-h-[200px] flex items-center justify-center">
                    {certificate.toLowerCase().includes(".pdf") ? (
                      <div className="text-center space-y-3">
                        <div className="p-4 bg-white rounded-full inline-block shadow-md">
                          <FileText className="h-12 w-12 text-teal-600" />
                        </div>
                        <p className="text-base font-semibold text-teal-900">PDF Certificate</p>
                        <p className="text-sm text-teal-600 break-all max-w-md">{certificate}</p>
                      </div>
                    ) : (
                      <div className="w-full">
                        <img
                          src={certificate || "/placeholder.svg"}
                          alt={`Certificate ${index + 1}`}
                          className="max-w-full max-h-[300px] mx-auto rounded-lg border-2 border-teal-200 shadow-md"
                          onError={(e) => {
                            // Fallback for broken images
                            const target = e.target 
                            target.style.display = "none"
                            target.nextElementSibling?.classList.remove("hidden")
                          }}
                        />
                        <div className="hidden text-center space-y-3 py-8">
                          <div className="p-4 bg-white rounded-full inline-block shadow-md">
                            <FileText className="h-12 w-12 text-teal-600" />
                          </div>
                          <p className="text-base font-semibold text-teal-900">Certificate Image</p>
                          <p className="text-sm text-teal-600 break-all max-w-md">{certificate}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            <DialogFooter className="border-t border-teal-100 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsCertificateDialogOpen(false)}
                className="border-teal-300 text-teal-700 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-400"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}