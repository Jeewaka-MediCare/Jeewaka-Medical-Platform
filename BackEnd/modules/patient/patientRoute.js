import express from "express";
import {
  createPatient,
  getPatient,
  updatePatient,
  deletePatient,
  getPatientByUuid,
  getAllPatients,
  getPatientAppointments
} from "./patientController.js";
import { authMiddleware, requireRole } from "../../middleware/authMiddleware.js";

const patientRouter = express.Router();

// ============================================
// PUBLIC ROUTES (Registration)
// ============================================

// Create patient profile (during registration - no auth required yet)
patientRouter.post("/", createPatient);

// ============================================
// AUTHENTICATED ROUTES - Patient Access
// ============================================

// Get patient by UUID (authenticated - for profile loading after login)
patientRouter.get("/uuid/:uuid", 
  authMiddleware, 
  getPatientByUuid
);

// Get patient appointments (authenticated - patients view their own appointments)
// TODO: Add controller logic to verify patient can only see their own appointments
patientRouter.get("/:patientId/appointments", 
  authMiddleware, 
  getPatientAppointments
);

// Get patient by ID (authenticated - patients can view their own profile)
// TODO: Add controller logic to verify patient can only see their own data
patientRouter.get("/:id", 
  authMiddleware, 
  getPatient
);

// Update patient (authenticated - patients can update their own profile)
// TODO: Add controller logic to verify patient can only update their own data
patientRouter.put("/:id", 
  authMiddleware, 
  updatePatient
);

// ============================================
// ADMIN ONLY ROUTES
// ============================================

// Get all patients (admin only - for admin dashboard)
patientRouter.get("/", 
  authMiddleware, 
  requireRole(['admin']), 
  getAllPatients
);

// Delete patient (admin only - account removal/cleanup)
patientRouter.delete("/:id", 
  authMiddleware, 
  requireRole(['admin']), 
  deletePatient
);

export default patientRouter;
