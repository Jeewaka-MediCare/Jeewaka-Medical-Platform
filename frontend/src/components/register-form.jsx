"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { email, z } from "zod"
import { useState } from "react"
import { Eye, EyeOff, Loader2, UserCheck, Stethoscope, Heart, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react'
import { createUserWithEmailAndPassword } from "firebase/auth"
import { auth } from "../services/firebase"
import api from "../services/api"
import { useNavigate } from "react-router-dom"



export function SignupForm({ className, ...props }) {
  const navigate = useNavigate()
  // Validation schemas
  const doctorSchema = z
    .object({
      name: z
        .string()
        .min(3, { message: "Name must be at least 3 characters" })
        .max(60, { message: "Name must be at most 60 characters" })
        .regex(/^[A-Za-z ]+$/, { message: "Name can only contain letters and spaces" }),
      email: z.string().email({ message: "Invalid email address" }),
      phone: z
        .string()
        .regex(/^\+?\d+$/, { message: "Phone number can only contain numbers and an optional leading +" })
        .min(10, { message: "Phone number must be at least 10 digits" }),
      password: z.string().min(8, { message: "Password must be at least 8 characters" }),
      confirmPassword: z.string(),
      gender: z.enum(["Male", "Female", "Other"], { message: "Please select a gender" }),
      regNo: z.string().min(1, { message: "Registration number is required" }),
      dob: z.string().min(1, { message: "Date of birth is required" }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    })

  const patientSchema = z
    .object({
      name: z
        .string()
        .min(3, { message: "Name must be at least 3 characters" })
        .max(60, { message: "Name must be at most 60 characters" })
        .regex(/^[A-Za-z ]+$/, { message: "Name can only contain letters and spaces" }),
      email: z.string().email({ message: "Invalid email address" }),
      password: z.string().min(8, { message: "Password must be at least 8 characters" }),
      confirmPassword: z.string(),
      gender: z.enum(["Male", "Female", "Other"], { message: "Please select a gender" }),
      dob: z.string().min(1, { message: "Date of birth is required" }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    })

  const [userType, setUserType] = useState("patient")
  const [doctorForm, setDoctorForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    gender: "",
    regNo: "",
    dob: "",
  })
  const [patientForm, setPatientForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "",
    dob: "",
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleDoctorChange = (e) => {
    const { id, value } = e.target
    setDoctorForm({ ...doctorForm, [id]: value })

    // Real-time password matching validation
    if (id === "confirmPassword" || id === "password") {
      const updatedForm = { ...doctorForm, [id]: value }
      if (updatedForm.password && updatedForm.confirmPassword) {
        if (updatedForm.password !== updatedForm.confirmPassword) {
          setErrors({ ...errors, confirmPassword: "Passwords don't match" })
        } else {
          const newErrors = { ...errors }
          delete newErrors.confirmPassword
          setErrors(newErrors)
        }
      }
    } else if (errors[id]) {
      setErrors({ ...errors, [id]: "" })
    }
  }

  const handlePatientChange = (e) => {
    const { id, value } = e.target
    setPatientForm({ ...patientForm, [id]: value })

    // Real-time password matching validation
    if (id === "confirmPassword" || id === "password") {
      const updatedForm = { ...patientForm, [id]: value }
      if (updatedForm.password && updatedForm.confirmPassword) {
        if (updatedForm.password !== updatedForm.confirmPassword) {
          setErrors({ ...errors, confirmPassword: "Passwords don't match" })
        } else {
          const newErrors = { ...errors }
          delete newErrors.confirmPassword
          setErrors(newErrors)
        }
      }
    } else if (errors[id]) {
      setErrors({ ...errors, [id]: "" })
    }
  }

  const handleSelectChange = (field, value) => {
    if (userType === "doctor") {
      setDoctorForm({ ...doctorForm, [field]: value })
    } else {
      setPatientForm({ ...patientForm, [field]: value })
    }
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    const currentForm = userType === "doctor" ? doctorForm : patientForm
    const schema = userType === "doctor" ? doctorSchema : patientSchema

    // Check if gender is selected (required field)
    if (!currentForm.gender) {
      setErrors({ gender: "Please select a gender", submit: "Please fill in all required fields." })
      setIsLoading(false)
      return
    }

    // Extra password matching check before schema validation
    if (currentForm.password !== currentForm.confirmPassword) {
      setErrors({ confirmPassword: "Passwords don't match", submit: "Passwords don't match." })
      setIsLoading(false)
      return
    }

    const result = schema.safeParse(currentForm)

    if (!result.success) {
      const fieldErrors = {}
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0]] = err.message
      })
      fieldErrors.submit = "Please correct the errors below.";
      setErrors(fieldErrors)
      setIsLoading(false)
    } else {
      setErrors({})
      try {
        // Simulate API call
        //await new Promise((resolve) => setTimeout(resolve, 2000))

        if (userType === "doctor") {
          const firebaseUser = await createUserWithEmailAndPassword(auth, doctorForm.email, doctorForm.password);
          const uuid = firebaseUser.user.uid;

          // Set user role in Firebase custom claims
          await api.post("/api/auth/role", { uid: uuid, role: userType });

          const req = {
            name: doctorForm.name,
            email: doctorForm.email,
            uuid: uuid,
            dob: doctorForm.dob,
            gender: doctorForm.gender,
            regNo: doctorForm.regNo,
            phone:doctorForm.phone
            
          };

          const res = await api.post("/api/doctor", req);
          const saved_doctor = res.data.doctor;
          const doctorVerificationReq = {
            doctorId: saved_doctor._id,

          }
          const res2 = await api.post("/api/admin-verification", doctorVerificationReq);
        
        } else {
          await createUserWithEmailAndPassword(auth, patientForm.email, patientForm.password);
          //const uuid = firebaseUser.user.uid;
          const user = auth.currentUser
          const uuid =user.uid
          console.log("uuid" , uuid)

          // Set user role in Firebase custom claims
           await api.post("/api/auth/role", { uid: uuid, role: userType });

          const req = {
            name: patientForm.name,
            email: patientForm.email,
            uuid: uuid,
            dob: patientForm.dob,
            sex: patientForm.gender
            

          };

          console.log("req", req)

          const res = await api.post("/api/patient", req);
          console.log("✅ Patient profile created:", res.data);
        }

        // Success! Profile created in both Firebase and MongoDB
        // console.log("✅ Registration successful!");
        // console.log("User type:", userType);
        // console.log("Firebase UID:", userType === "doctor" ? doctorForm.email : patientForm.email);
        
        // // Show success message
        // alert(`✅ Registration successful! Your ${userType} account has been created. Please log in.`);
        
        // Redirect to login page so they can log in properly and load their profile
        navigate("/login")
      } catch (error) {
        console.error("Registration failed:", error)
        
        // Show user-friendly error messages
        let errorMessage = "Registration failed. Please try again.";
        
        if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.code === 'auth/email-already-in-use') {
          errorMessage = "This email is already registered. Please login instead.";
        } else if (error.code === 'auth/weak-password') {
          errorMessage = "Password is too weak. Please use a stronger password.";
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = "Invalid email address.";
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setErrors({ submit: errorMessage });
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleTabChange = (value) => {
    setUserType(value)
    setErrors({}) // Clear errors when switching tabs
  }

  return (
    <div className={cn("flex flex-col gap-8 max-w-lg mx-auto py-8 px-4", className)} {...props}>
      {/* Header Section with Medical Theme */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 mb-2 shadow-lg">
          <Heart className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-balance bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
          Join Our Healthcare Platform
        </h1>
        <p className="text-muted-foreground text-balance leading-relaxed">
          Create your account to access quality healthcare services
        </p>
      </div>

      <Card className="border-emerald-100 shadow-xl shadow-emerald-50">
        <CardHeader className="space-y-3 pb-6 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 border-b border-emerald-100">
          <CardTitle className="text-2xl font-semibold text-emerald-900">Create Account</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Register as a patient or healthcare provider
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs value={userType} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12 bg-emerald-50/50 p-1 rounded-lg">
              <TabsTrigger 
                value="patient" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-md transition-all"
              >
                <UserCheck className="h-4 w-4" />
                <span className="font-medium">Patient</span>
              </TabsTrigger>
              <TabsTrigger 
                value="doctor" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-md transition-all"
              >
                <Stethoscope className="h-4 w-4" />
                <span className="font-medium">Doctor</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="patient" className="mt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error Display */}
                {errors.submit && (
                  <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-md flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-red-800 text-sm leading-relaxed">{errors.submit}</p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    required
                    value={patientForm.name}
                    onChange={handlePatientChange}
                    aria-invalid={errors.name ? "true" : "false"}
                    className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                  {errors.name && (
                    <span className="text-red-600 text-xs flex items-center gap-1" role="alert">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    required
                    value={patientForm.email}
                    onChange={handlePatientChange}
                    aria-invalid={errors.email ? "true" : "false"}
                    className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                  {errors.email && (
                    <span className="text-red-600 text-xs flex items-center gap-1" role="alert">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm font-medium text-gray-700">
                    Gender <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    onValueChange={(value) => handleSelectChange("gender", value)}
                    required
                    value={patientForm.gender}
                  >
                    <SelectTrigger className={cn(
                      "h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500",
                      !patientForm.gender && "text-muted-foreground"
                    )}>
                      <SelectValue placeholder="Select your gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <span className="text-red-600 text-xs flex items-center gap-1" role="alert">
                      <AlertCircle className="h-3 w-3" />
                      {errors.gender}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob" className="text-sm font-medium text-gray-700">
                    Date of Birth <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dob"
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={patientForm.dob}
                    onChange={handlePatientChange}
                    aria-invalid={errors.dob ? "true" : "false"}
                    className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                  {errors.dob && (
                    <span className="text-red-600 text-xs flex items-center gap-1" role="alert">
                      <AlertCircle className="h-3 w-3" />
                      {errors.dob}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 font-normal ml-2">(minimum 8 characters)</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      required
                      minLength={8}
                      value={patientForm.password}
                      onChange={handlePatientChange}
                      aria-invalid={errors.password ? "true" : "false"}
                      className="h-11 pr-10 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="text-red-600 text-xs flex items-center gap-1" role="alert">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      required
                      value={patientForm.confirmPassword}
                      onChange={handlePatientChange}
                      aria-invalid={errors.confirmPassword ? "true" : "false"}
                      className={cn(
                        "h-11 pr-20 border-gray-200 focus:ring-emerald-500 transition-colors",
                        patientForm.password && patientForm.confirmPassword
                          ? patientForm.password === patientForm.confirmPassword
                            ? "border-emerald-500 focus:border-emerald-600"
                            : "border-red-500 focus:border-red-600"
                          : "focus:border-emerald-500"
                      )}
                    />
                    <button
                      type="button"
                      className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    {patientForm.password && patientForm.confirmPassword && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {patientForm.password === patientForm.confirmPassword ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {errors.confirmPassword && (
                    <span className="text-red-600 text-xs flex items-center gap-1" role="alert">
                      <AlertCircle className="h-3 w-3" />
                      {errors.confirmPassword}
                    </span>
                  )}
                  {patientForm.password &&
                    patientForm.confirmPassword &&
                    patientForm.password === patientForm.confirmPassword && (
                      <span className="text-emerald-600 text-xs flex items-center gap-1 font-medium">
                        <CheckCircle2 className="h-3 w-3" />
                        Passwords match
                      </span>
                    )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium shadow-lg shadow-emerald-200 transition-all" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Your Account...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-5 w-5" />
                      Create Patient Account
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="doctor" className="mt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error Display */}
                {errors.submit && (
                  <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-md flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-red-800 text-sm leading-relaxed">{errors.submit}</p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Dr. John Smith"
                    required
                    value={doctorForm.name}
                    onChange={handleDoctorChange}
                    aria-invalid={errors.name ? "true" : "false"}
                    className="h-11 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                  />
                  {errors.name && (
                    <span className="text-red-600 text-xs flex items-center gap-1" role="alert">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="doctor@hospital.com"
                    required
                    value={doctorForm.email}
                    onChange={handleDoctorChange}
                    aria-invalid={errors.email ? "true" : "false"}
                    className="h-11 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                  />
                  {errors.email && (
                    <span className="text-red-600 text-xs flex items-center gap-1" role="alert">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Phone Number <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 font-normal ml-2">(minimum 10 digits)</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    required
                    minLength={10}
                    value={doctorForm.phone}
                    onChange={handleDoctorChange}
                    aria-invalid={errors.phone ? "true" : "false"}
                    className="h-11 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                  />
                  {errors.phone && (
                    <span className="text-red-600 text-xs flex items-center gap-1" role="alert">
                      <AlertCircle className="h-3 w-3" />
                      {errors.phone}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="regNo" className="text-sm font-medium text-gray-700">
                    Medical Registration Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="regNo"
                    type="text"
                    placeholder="Enter your medical license number"
                    required
                    value={doctorForm.regNo}
                    onChange={handleDoctorChange}
                    aria-invalid={errors.regNo ? "true" : "false"}
                    className="h-11 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                  />
                  {errors.regNo && (
                    <span className="text-red-600 text-xs flex items-center gap-1" role="alert">
                      <AlertCircle className="h-3 w-3" />
                      {errors.regNo}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm font-medium text-gray-700">
                    Gender <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    onValueChange={(value) => handleSelectChange("gender", value)}
                    required
                    value={doctorForm.gender}
                  >
                    <SelectTrigger className={cn(
                      "h-11 border-gray-200 focus:border-teal-500 focus:ring-teal-500",
                      !doctorForm.gender && "text-muted-foreground"
                    )}>
                      <SelectValue placeholder="Select your gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <span className="text-red-600 text-xs flex items-center gap-1" role="alert">
                      <AlertCircle className="h-3 w-3" />
                      {errors.gender}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob" className="text-sm font-medium text-gray-700">
                    Date of Birth <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dob"
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={doctorForm.dob}
                    onChange={handleDoctorChange}
                    aria-invalid={errors.dob ? "true" : "false"}
                    className="h-11 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                  />
                  {errors.dob && (
                    <span className="text-red-600 text-xs flex items-center gap-1" role="alert">
                      <AlertCircle className="h-3 w-3" />
                      {errors.dob}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 font-normal ml-2">(minimum 8 characters)</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      required
                      value={doctorForm.password}
                      onChange={handleDoctorChange}
                      aria-invalid={errors.password ? "true" : "false"}
                      className="h-11 pr-10 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="text-red-600 text-xs flex items-center gap-1" role="alert">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      required
                      value={doctorForm.confirmPassword}
                      onChange={handleDoctorChange}
                      aria-invalid={errors.confirmPassword ? "true" : "false"}
                      className={cn(
                        "h-11 pr-20 border-gray-200 focus:ring-teal-500 transition-colors",
                        doctorForm.password && doctorForm.confirmPassword
                          ? doctorForm.password === doctorForm.confirmPassword
                            ? "border-teal-500 focus:border-teal-600"
                            : "border-red-500 focus:border-red-600"
                          : "focus:border-teal-500"
                      )}
                    />
                    <button
                      type="button"
                      className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600 transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    {doctorForm.password && doctorForm.confirmPassword && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {doctorForm.password === doctorForm.confirmPassword ? (
                          <CheckCircle2 className="h-5 w-5 text-teal-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {errors.confirmPassword && (
                    <span className="text-red-600 text-xs flex items-center gap-1" role="alert">
                      <AlertCircle className="h-3 w-3" />
                      {errors.confirmPassword}
                    </span>
                  )}
                  {doctorForm.password &&
                    doctorForm.confirmPassword &&
                    doctorForm.password === doctorForm.confirmPassword && (
                      <span className="text-teal-600 text-xs flex items-center gap-1 font-medium">
                        <CheckCircle2 className="h-3 w-3" />
                        Passwords match
                      </span>
                    )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-medium shadow-lg shadow-teal-200 transition-all" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Your Account...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-5 w-5" />
                      Create Doctor Account
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Button
                type="button"
                className="font-medium text-emerald-600 hover:text-emerald-700 underline underline-offset-4 transition-colors"
                onClick={() => navigate("/login")}
              >
                Sign in here
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-xs text-gray-500 leading-relaxed px-4">
        <p className="text-balance">
          By creating an account, you agree to our{" "}
          <button className="text-emerald-600 hover:text-emerald-700 underline underline-offset-4 font-medium transition-colors">
            Terms of Service
          </button>{" "}
          and{" "}
          <button className="text-emerald-600 hover:text-emerald-700 underline underline-offset-4 font-medium transition-colors">
            Privacy Policy
          </button>
          .
        </p>
      </div>
    </div>
  )
}