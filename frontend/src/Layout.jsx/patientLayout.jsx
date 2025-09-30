import React from "react";
import { Outlet } from "react-router-dom"; // ✅ import Outlet
import { Navbar } from "../components/navBar"; // ✅ your Navbar


function PatientLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar stays at the top */}
      <Navbar />

      {/* Page content (child routes render here) */}
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
}

export default PatientLayout;
