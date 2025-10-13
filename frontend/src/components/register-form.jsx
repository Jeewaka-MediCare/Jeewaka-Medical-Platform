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
import { Eye, EyeOff, Loader2, UserCheck, Stethoscope } from "lucide-react"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { auth } from "./firebase"
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
    <div className={cn("flex flex-col gap-6 max-w-md mx-auto", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Join our medical platform as a doctor or patient</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={userType} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="patient" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Patient
              </TabsTrigger>
              <TabsTrigger value="doctor" className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Doctor
              </TabsTrigger>
            </TabsList>

            <TabsContent value="patient" className="mt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error Display */}
                {errors.submit && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-800 text-sm">{errors.submit}</p>
                  </div>
                )}
                
                <div className="grid gap-3">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    required
                    value={patientForm.name}
                    onChange={handlePatientChange}
                    aria-invalid={errors.name ? "true" : "false"}
                  />
                  {errors.name && (
                    <span className="text-red-500 text-xs" role="alert">
                      {errors.name}
                    </span>
                  )}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                    value={patientForm.email}
                    onChange={handlePatientChange}
                    aria-invalid={errors.email ? "true" : "false"}
                  />
                  {errors.email && (
                    <span className="text-red-500 text-xs" role="alert">
                      {errors.email}
                    </span>
                  )}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select 
                    onValueChange={(value) => handleSelectChange("gender", value)}
                    required
                    value={patientForm.gender}
                  >
                    <SelectTrigger className={!patientForm.gender ? "border-red-300" : ""}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <span className="text-red-500 text-xs" role="alert">
                      {errors.gender}
                    </span>
                  )}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="dob">Date of Birth *</Label>
                  <Input
                    id="dob"
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={patientForm.dob}
                    onChange={handlePatientChange}
                    aria-invalid={errors.dob ? "true" : "false"}
                  />
                  {errors.dob && (
                    <span className="text-red-500 text-xs" role="alert">
                      {errors.dob}
                    </span>
                  )}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="password">Password * (min. 8 characters)</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      required
                      minLength={8}
                      value={patientForm.password}
                      onChange={handlePatientChange}
                      aria-invalid={errors.password ? "true" : "false"}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="text-red-500 text-xs" role="alert">
                      {errors.password}
                    </span>
                  )}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      required
                      value={patientForm.confirmPassword}
                      onChange={handlePatientChange}
                      aria-invalid={errors.confirmPassword ? "true" : "false"}
                      className={
                        patientForm.password && patientForm.confirmPassword
                          ? patientForm.password === patientForm.confirmPassword
                            ? "border-green-500 focus:border-green-500"
                            : "border-red-500 focus:border-red-500"
                          : ""
                      }
                    />
                    <button
                      type="button"
                      className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    {patientForm.password && patientForm.confirmPassword && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {patientForm.password === patientForm.confirmPassword ? (
                          <span className="text-green-500 text-sm">✓</span>
                        ) : (
                          <span className="text-red-500 text-sm">✗</span>
                        )}
                      </div>
                    )}
                  </div>
                  {errors.confirmPassword && (
                    <span className="text-red-500 text-xs" role="alert">
                      {errors.confirmPassword}
                    </span>
                  )}
                  {patientForm.password &&
                    patientForm.confirmPassword &&
                    patientForm.password === patientForm.confirmPassword && (
                      <span className="text-green-500 text-xs">✓ Passwords match</span>
                    )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Patient Account"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="doctor" className="mt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error Display */}
                {errors.submit && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-800 text-sm">{errors.submit}</p>
                  </div>
                )}
                
                <div className="grid gap-3">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    required
                    value={doctorForm.name}
                    onChange={handleDoctorChange}
                    aria-invalid={errors.name ? "true" : "false"}
                  />
                  {errors.name && (
                    <span className="text-red-500 text-xs" role="alert">
                      {errors.name}
                    </span>
                  )}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                    value={doctorForm.email}
                    onChange={handleDoctorChange}
                    aria-invalid={errors.email ? "true" : "false"}
                  />
                  {errors.email && (
                    <span className="text-red-500 text-xs" role="alert">
                      {errors.email}
                    </span>
                  )}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="phone">Phone Number * (min. 10 digits)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1234567890"
                    required
                    minLength={10}
                    value={doctorForm.phone}
                    onChange={handleDoctorChange}
                    aria-invalid={errors.phone ? "true" : "false"}
                  />
                  {errors.phone && (
                    <span className="text-red-500 text-xs" role="alert">
                      {errors.phone}
                    </span>
                  )}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="regNo">Medical Registration Number *</Label>
                  <Input
                    id="regNo"
                    type="text"
                    placeholder="Enter your registration number"
                    required
                    value={doctorForm.regNo}
                    onChange={handleDoctorChange}
                    aria-invalid={errors.regNo ? "true" : "false"}
                  />
                  {errors.regNo && (
                    <span className="text-red-500 text-xs" role="alert">
                      {errors.regNo}
                    </span>
                  )}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select 
                    onValueChange={(value) => handleSelectChange("gender", value)}
                    required
                    value={doctorForm.gender}
                  >
                    <SelectTrigger className={!doctorForm.gender ? "border-red-300" : ""}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <span className="text-red-500 text-xs" role="alert">
                      {errors.gender}
                    </span>
                  )}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="dob">Date of Birth *</Label>
                  <Input
                    id="dob"
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={doctorForm.dob}
                    onChange={handleDoctorChange}
                    aria-invalid={errors.dob ? "true" : "false"}
                  />
                  {errors.dob && (
                    <span className="text-red-500 text-xs" role="alert">
                      {errors.dob}
                    </span>
                  )}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      required
                      value={doctorForm.password}
                      onChange={handleDoctorChange}
                      aria-invalid={errors.password ? "true" : "false"}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="text-red-500 text-xs" role="alert">
                      {errors.password}
                    </span>
                  )}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      required
                      value={doctorForm.confirmPassword}
                      onChange={handleDoctorChange}
                      aria-invalid={errors.confirmPassword ? "true" : "false"}
                      className={
                        doctorForm.password && doctorForm.confirmPassword
                          ? doctorForm.password === doctorForm.confirmPassword
                            ? "border-green-500 focus:border-green-500"
                            : "border-red-500 focus:border-red-500"
                          : ""
                      }
                    />
                    <button
                      type="button"
                      className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    {doctorForm.password && doctorForm.confirmPassword && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {doctorForm.password === doctorForm.confirmPassword ? (
                          <span className="text-green-500 text-sm">✓</span>
                        ) : (
                          <span className="text-red-500 text-sm">✗</span>
                        )}
                      </div>
                    )}
                  </div>
                  {errors.confirmPassword && (
                    <span className="text-red-500 text-xs" role="alert">
                      {errors.confirmPassword}
                    </span>
                  )}
                  {doctorForm.password &&
                    doctorForm.confirmPassword &&
                    doctorForm.password === doctorForm.confirmPassword && (
                      <span className="text-green-500 text-xs">✓ Passwords match</span>
                    )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Doctor Account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm">
            Already have an account?{" "}
            <button
              type="button"
              className="underline underline-offset-4 hover:text-primary"
              onClick={() => console.log("Login clicked")}
            >
              Sign in
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="text-muted-foreground text-center text-xs text-balance">
        By creating an account, you agree to our{" "}
        <button className="underline underline-offset-4 hover:text-primary">Terms of Service</button> and{" "}
        <button className="underline underline-offset-4 hover:text-primary">Privacy Policy</button>.
      </div>
    </div>
  )
}
