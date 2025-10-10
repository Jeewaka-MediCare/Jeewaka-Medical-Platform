"use client";

import { Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, LogOut, User, Stethoscope, Menu, CreditCard, BarChart3, CalendarDays } from "lucide-react";
import useAuthStore from "../store/authStore";

export function Navbar() {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const userRole = useAuthStore((state) => state.userRole); // Get user role
  console.log(user);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
    console.log("✅ Logged out successfully");
  };

  // Determine navigation links based on user role
  const getDashboardLink = () => {
    switch (userRole) {
      case 'doctor':
        return '/doctor-overview';
      case 'admin':
        return '/admin-dashboard';
      case 'patient':
      default:
        return '/patient-dashboard';
    }
  };

  const getNavigationLinks = () => {
    if (userRole === 'doctor') {
      return [
        { to: "/doctor-overview", label: "Overview", icon: BarChart3 },
        { to: "/doctor-dashboard", label: "Sessions", icon: CalendarDays },
        { to: "/doctor-profile-setting", label: "Profile Settings", icon: User },
      ];
    } else if (userRole === 'admin') {
      return [
        { to: "/admin-dashboard", label: "Admin Dashboard", icon: Calendar },
      ];
    } else {
      // Patient navigation (default)
      return [
        { to: "/appointments", label: "Appointments", icon: Calendar },
        { to: "/payments", label: "Payments", icon: CreditCard },
        { 
          to: "/medical-records", 
          label: "Medical Records", 
          icon: () => (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ) 
        },
      ];
    }
  };

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-green-100/50 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side: logo + links */}
          <div className="flex items-center space-x-8">
            <Link
              to={getDashboardLink()}
              className="flex items-center space-x-2 group"
            >
              <div className="bg-gradient-to-r from-green-600 to-green-700 p-2 rounded-xl shadow-lg group-hover:shadow-green-200 transition-all duration-200">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
                Jeewaka
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-2">
              {getNavigationLinks().map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-slate-600 hover:text-green-700 hover:bg-green-50/80 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 hover:shadow-sm"
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side: profile + mobile menu */}
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-green-200 transition-all duration-200"
                >
                  <Avatar className="h-10 w-10 border-2 border-green-200 shadow-sm">
                    <AvatarImage
                      src={user?.photoURL || "/doctor-profile.png"}
                      alt={user?.displayName || "Profile"}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-green-100 to-green-50 text-green-700 font-semibold">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-64 shadow-lg border-green-100/50"
                align="end"
                forceMount
              >
                <DropdownMenuLabel className="font-normal p-4">
                  <div className="flex flex-col space-y-2">
                    <p className="text-sm font-semibold leading-none text-slate-900">
                      {user?.name || "Guest User"}
                    </p>
                    <p className="text-xs leading-none text-slate-500">
                      {user?.email || "No email"}
                    </p>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="bg-green-100/50" />

                

                <DropdownMenuSeparator className="bg-green-100/50" />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50/80 focus:bg-red-50/80 focus:text-red-700 p-3"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span className="text-sm">Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-green-50/80 transition-colors"
                  >
                    <Menu className="h-5 w-5 text-slate-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 shadow-lg border-green-100/50"
                  align="end"
                >
                  {getNavigationLinks().map((link) => (
                    <DropdownMenuItem
                      key={link.to}
                      asChild
                      className="cursor-pointer hover:bg-green-50/80 focus:bg-green-50/80"
                    >
                      <Link to={link.to} className="flex items-center p-3">
                        <link.icon className="mr-3 h-4 w-4 text-slate-600" />
                        <span className="text-sm">{link.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
