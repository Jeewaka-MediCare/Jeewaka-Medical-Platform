import express from 'express';
import {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  getDoctorByUuid,
  searchDoctors,
  getFilterOptions
} from './doctorControllers.js';

const doctorRoutes = express.Router();

// Search doctors with filters
doctorRoutes.get('/search', searchDoctors);
// Get filter options for dropdowns
doctorRoutes.get('/filter-options', getFilterOptions);
// Create a new doctor
doctorRoutes.post('/', createDoctor);
// Get all doctors
doctorRoutes.get('/', getDoctors);
// Get doctor by UUID
doctorRoutes.get('/uuid/:uuid', getDoctorByUuid);
// Get doctor by ID
doctorRoutes.get('/:id', getDoctorById);
// Update doctor
doctorRoutes.put('/:id', updateDoctor);
// Delete doctor
doctorRoutes.delete('/:id', deleteDoctor);

export default doctorRoutes;
