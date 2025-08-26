import express from 'express';
import { createHospital , getHospitalById , getHospitals , deleteHospital , updateHospital } from './hospitalController.js';
const hospitalRouter = express.Router();


// Create a new hospital
hospitalRouter.post('/', createHospital);

// Get all hospitals
hospitalRouter.get('/', getHospitals);

// Get a single hospital by ID
hospitalRouter.get('/:hospitalId', getHospitalById);

// Update a hospital
hospitalRouter.put('/:hospitalId', updateHospital);

// Delete a hospital
hospitalRouter.delete('/:hospitalId', deleteHospital);

export default hospitalRouter