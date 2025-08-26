import express from 'express';
import { getAllDoctorCards  ,  getDoctorCardById } from './doctorCardController.js';

const doctorCardRouter = express.Router();


doctorCardRouter.get('/', getAllDoctorCards); // 🔥 NEW ENDPOINT
doctorCardRouter.get('/:doctorId', getDoctorCardById); // 🔥 NEW ENDPOINT

export default doctorCardRouter;
