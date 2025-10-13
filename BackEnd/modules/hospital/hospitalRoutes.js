import express from 'express';
import { createHospital , getHospitalById , getHospitals , deleteHospital , updateHospital } from './hospitalController.js';
import { authMiddleware, requireRole } from '../../middleware/authMiddleware.js';

const hospitalRouter = express.Router();

// ============================================
// PUBLIC ROUTES - Hospital Directory
// ============================================

// Get all hospitals (public - for patient/doctor search)
hospitalRouter.get('/', getHospitals);

// Get a single hospital by ID (public - view hospital details)
hospitalRouter.get('/:hospitalId', getHospitalById);

// ============================================
// ADMIN ONLY ROUTES - Hospital Management
// ============================================

// Create a new hospital (admin only)
hospitalRouter.post('/', 
  authMiddleware, 
  requireRole(['admin']), 
  createHospital
);

// Update a hospital (admin only)
hospitalRouter.put('/:hospitalId', 
  authMiddleware, 
  requireRole(['admin']), 
  updateHospital
);

// Delete a hospital (admin only)
hospitalRouter.delete('/:hospitalId', 
  authMiddleware, 
  requireRole(['admin']), 
  deleteHospital
);

export default hospitalRouter;