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
import { Calendar, LogOut, User, Stethoscope, Menu, CreditCard, BarChart3, CalendarDays, FileText } from 'lucide-react';
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
        { to: "/medical-records", label: "Medical Records", icon: FileText },
      ];
    }
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-teal-100 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side: logo + links */}
          <div className="flex items-center space-x-8">
            <Link
              to={getDashboardLink()}
              className="flex items-center space-x-2 group"
            >
              <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-2.5 rounded-xl shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-teal-700 to-emerald-700 bg-clip-text text-transparent">
                Jeewaka
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {getNavigationLinks().map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-gray-700 hover:text-teal-700 hover:bg-gradient-to-r hover:from-teal-50 hover:to-emerald-50 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-200 hover:shadow-sm border border-transparent hover:border-teal-100"
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
                  className="relative h-11 w-11 rounded-full hover:ring-2 hover:ring-teal-300 hover:ring-offset-2 transition-all duration-200"
                >
                  <Avatar className="h-11 w-11 border-2 border-teal-200 shadow-md hover:border-teal-300 transition-all">
                    <AvatarImage
                      src={user?.photoURL || "/doctor-profile.png"}
                      alt={user?.displayName || "Profile"}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-teal-100 to-emerald-100 text-teal-700 font-bold text-base">
                      {user?.name?.charAt(0)?.toUpperCase() || <User className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-72 shadow-xl border-teal-100 bg-white/95 backdrop-blur-sm"
                align="end"
                forceMount
              >
                <DropdownMenuLabel className="font-normal p-4 bg-gradient-to-r from-teal-50 to-emerald-50">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12 border-2 border-teal-200 shadow-sm">
                      <AvatarImage
                        src={user?.photoURL || "/doctor-profile.png"}
                        alt={user?.displayName || "Profile"}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-teal-100 to-emerald-100 text-teal-700 font-bold">
                        {user?.name?.charAt(0)?.toUpperCase() || <User className="h-5 w-5" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-bold leading-none text-gray-900">
                        {user?.name || "Guest User"}
                      </p>
                      <p className="text-xs leading-none text-gray-600">
                        {user?.email || "No email"}
                      </p>
                      {userRole && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-teal-100 text-teal-800 mt-1 w-fit">
                          {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="bg-teal-100" />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 focus:bg-red-50 focus:text-red-700 p-3 m-2 rounded-lg transition-colors font-medium"
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
                    className="hover:bg-gradient-to-r hover:from-teal-50 hover:to-emerald-50 transition-all rounded-lg border border-transparent hover:border-teal-100"
                  >
                    <Menu className="h-5 w-5 text-gray-700" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-64 shadow-xl border-teal-100 bg-white/95 backdrop-blur-sm"
                  align="end"
                >
                  <DropdownMenuLabel className="px-4 py-3 bg-gradient-to-r from-teal-50 to-emerald-50 font-bold text-teal-800">
                    Navigation
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-teal-100" />
                  {getNavigationLinks().map((link) => (
                    <DropdownMenuItem
                      key={link.to}
                      asChild
                      className="cursor-pointer hover:bg-gradient-to-r hover:from-teal-50 hover:to-emerald-50 focus:bg-gradient-to-r focus:from-teal-50 focus:to-emerald-50 m-2 rounded-lg transition-all"
                    >
                      <Link to={link.to} className="flex items-center p-3">
                        <link.icon className="mr-3 h-4 w-4 text-teal-600" />
                        <span className="text-sm font-medium text-gray-700">{link.label}</span>
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