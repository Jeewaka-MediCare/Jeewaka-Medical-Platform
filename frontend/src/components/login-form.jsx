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
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
 import { signInWithEmailAndPassword } from "firebase/auth";
 import { auth } from "./firebase";
 import api from "../services/api";
 import { useNavigate } from "react-router-dom";
import useAuthStore from '../store/authStore';
export function LoginForm({ className, ...props }) {
  const navigate = useNavigate();
  const { setUser, setUserRole, setLoading, logout } = useAuthStore();
  // Zod schema for validation
  const schema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
  });

  // useEffect(() => {
  //   setLoading(true);
  //   const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
  //     if (currentUser) {
  //       setUser(currentUser);
  //     } else {
  //       logout();
  //     }
  //     setLoading(false);
  //   });
  //   return () => unsubscribe();
  // }, [setUser, setLoading, logout]);

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLocalLoading] = useState(false); // Local loading state

  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalLoading(true);
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      setLocalLoading(false);
    } else {
      setErrors({});
      // Proceed with login logic
      console.log("Login form values:", form);
      try {
        // Sign in user with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(
          auth,
          form.email,
          form.password
        );
        const user = userCredential.user;
        const uid = user.uid;
        // Get Firebase custom claims (must be set server-side)
        const idTokenResult = await user.getIdTokenResult();
        const role = idTokenResult.claims.role;
        console.log("User UID:", uid);
        console.log("User role:", role);
        let res;
        if (role === "doctor") {
          res = await api.get(`/api/doctor/uuid/${uid}`);
          console.log( "user", res.data)
          localStorage.setItem("userData", JSON.stringify(res.data));
        } else if (role === "patient") {
          res = await api.get(`/api/patient/uuid/${uid}`);
          console.log(res.data)
          localStorage.setItem("userData", JSON.stringify(res.data));
        } else {
          res = {
            data: {
              name: "Unknown",
              email: user.email,
              role: role || "Unknown",
            },
          };
        }
        // Only store if data is valid
        if (res && res.data) {
      
          // setUser(res.data); // Set user in Zustand store (handles localStorage)
          // setUserRole(role || "Unknown"); // Set userRole in Zustand store (handles localStorage)
          // Only navigate after storage
          if (role === "doctor") {
            navigate("/doctor-dashboard");
          } else if (role === "patient") {
            navigate("/patient-dashboard");
          } else {
            navigate("/");
          }
        } else {
          //setError("Failed to retrieve user data.")
          alert("Failed to retrieve user data.");
        }
      } catch (err) {
        console.error(err);
      }
      setLocalLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Login with your Apple or Google account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <div className="flex flex-col gap-4">
                <Button variant="outline" className="w-full">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                      fill="currentColor"
                    />
                  </svg>
                  Login with Apple
                </Button>
                <Button variant="outline" className="w-full">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Login with Google
                </Button>
              </div>
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  Or continue with
                </span>
              </div>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={form.email}
                    onChange={handleChange}
                  />
                  {errors.email && (
                    <span className="text-red-500 text-xs">
                      {errors.email}
                    </span>
                  )}
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <a
                      href="#"
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={form.password}
                    onChange={handleChange}
                  />
                  {errors.password && (
                    <span className="text-red-500 text-xs">
                      {errors.password}
                    </span>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Loading..." : "Login"}
                </Button>
              </div>
              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link to="/sign-up" className="underline underline-offset-4">
                  Sign up
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our{" "}
        <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
