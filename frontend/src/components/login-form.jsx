import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from '../store/authStore';
import api from "../services/api";
import { Mail, Lock, AlertCircle, Heart, User } from "lucide-react";

export function LoginForm({ className, ...props }) {
  const navigate = useNavigate();
  const { login, loading } = useAuthStore();
  
  // Zod schema for validation
  const schema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
  });

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    
    setErrors({});
    
    // Use centralized login method
    const loginResult = await login(form.email, form.password);
    
    if (loginResult.success) {
      // Navigate based on role
      const { role , user } = loginResult;
      if (role === "doctor") {
        const res2 = await api.get(`/api/admin-verification/${user._id}`);
        console.log("Admin verification status (raw):", res2.data);
        let verification = Array.isArray(res2.data) ? res2.data[0] : res2.data;
        // Always enforce doctorId is the doctor's MongoDB _id
        verification = {
          ...verification,
          doctorId: user._id
        };
        console.log("Verification object used for redirect:", verification);
        if (!verification || verification.isVerified === false || verification.isVerified === "false") {
          console.log("Redirecting to pending page. isVerified:", verification && verification.isVerified);
          navigate("/admin-verification-pending", { state: [verification] });
          return;
        }
        console.log("Redirecting to doctor dashboard. isVerified:", verification && verification.isVerified);
        navigate("/doctor-dashboard");
      } else if (role === "patient") {
        navigate("/patient-dashboard");
      } else if (role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/");
      }
    } else {
      // Show error message
      alert(`Login failed: ${loginResult.error}`);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-md mx-auto", className)} {...props}>
      <Card className="border-2 border-emerald-100 shadow-lg">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-md">
            <User className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent">
            Welcome back
          </CardTitle>
          <CardDescription className="text-base text-gray-600">
            Login to access your healthcare portal
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <div className="flex flex-col gap-4">
               
              </div>
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
             
              </div>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2 text-gray-700">
                    <Mail className="w-4 h-4 text-emerald-600" />
                    Email Address
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={form.email}
                      onChange={handleChange}
                      className={cn(
                        "pl-10 h-11 transition-all duration-200 border-gray-200",
                        errors.email 
                          ? "border-red-500 focus-visible:ring-red-500" 
                          : "focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
                      )}
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  {errors.email && (
                    <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-2 rounded-md border border-red-200">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{errors.email}</span>
                    </div>
                  )}
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-semibold flex items-center gap-2 text-gray-700">
                      <Lock className="w-4 h-4 text-emerald-600" />
                      Password
                    </Label>
                    <a
                      href="#"
                      className="text-sm text-emerald-600 hover:text-emerald-700 underline-offset-4 hover:underline transition-colors"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      required
                      value={form.password}
                      onChange={handleChange}
                      className={cn(
                        "pl-10 h-11 transition-all duration-200 border-gray-200",
                        errors.password 
                          ? "border-red-500 focus-visible:ring-red-500" 
                          : "focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
                      )}
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  {errors.password && (
                    <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-2 rounded-md border border-red-200">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{errors.password}</span>
                    </div>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200" 
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Logging in...
                    </span>
                  ) : (
                    "Login"
                  )}
                </Button>
              </div>
              <div className="text-center text-sm bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                Don&apos;t have an account?{" "}
                <Link to="/sign-up" className="text-emerald-700 font-semibold hover:text-emerald-800 underline underline-offset-4 transition-colors">
                  Sign up
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground text-center text-xs text-balance px-4">
        By clicking continue, you agree to our{" "}
        <a href="#" className="text-emerald-600 hover:text-emerald-700 underline underline-offset-4 transition-colors">Terms of Service</a> and{" "}
        <a href="#" className="text-emerald-600 hover:text-emerald-700 underline underline-offset-4 transition-colors">Privacy Policy</a>.
      </div>
    </div>
  );
}