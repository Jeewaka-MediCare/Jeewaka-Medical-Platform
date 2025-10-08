import express from 'express';
import {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  getDoctorByUuid,
  searchDoctors,
  getFilterOptions,
  aiSearchDoctors,
  getAISearchSuggestions
} from './doctorControllers.js';
import { authMiddleware, requireRole } from '../../middleware/authMiddleware.js';

const doctorRoutes = express.Router();

// ============================================
// PUBLIC ROUTES - Doctor Discovery
// ============================================

// AI-powered search routes (public - for patient search)
doctorRoutes.get('/ai-search', aiSearchDoctors);
doctorRoutes.get('/ai-suggestions', getAISearchSuggestions);

// Search doctors with filters (public - for patient search)
doctorRoutes.get('/search', searchDoctors);

// Get filter options for dropdowns (public)
doctorRoutes.get('/filter-options', getFilterOptions);

// Get all doctors (public - doctor directory)
doctorRoutes.get('/', getDoctors);

// Get doctor by UUID (public - view doctor profile)
doctorRoutes.get('/uuid/:uuid', getDoctorByUuid);

// Get doctor by ID (public - view doctor profile)
doctorRoutes.get('/:id', getDoctorById);

// ============================================
// AUTHENTICATED ROUTES - Doctor Registration
// ============================================

// Create a new doctor profile (during registration - similar to patient)
doctorRoutes.post('/', 
  authMiddleware,
  createDoctor
);

// ============================================
// DOCTOR ONLY ROUTES - Profile Management
// ============================================

// Update doctor profile (doctors can update their own profile)
// TODO: Add controller logic to verify doctor can only update their own profile
doctorRoutes.put('/:id', 
  authMiddleware, 
  requireRole(['doctor', 'admin']), // Doctors update own profile, admins can update any
  updateDoctor
);

// ============================================
// ADMIN ONLY ROUTES
// ============================================

// Delete doctor (admin only - account removal)
doctorRoutes.delete('/:id', 
  authMiddleware, 
  requireRole(['admin']), 
  deleteDoctor
);

export default doctorRoutes;
