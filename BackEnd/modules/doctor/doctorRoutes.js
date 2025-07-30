import express from 'express';
import {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  getDoctorByUuid
} from './doctorControllers.js';

const doctorRoutes = express.Router();

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
