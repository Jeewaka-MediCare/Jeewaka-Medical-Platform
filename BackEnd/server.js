import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './shared/database.js';
import doctorRoutes from './modules/doctor/doctorRoutes.js';
import ratingRouter from './modules/ratings/ratingRoutes.js';
import doctorCardRouter from './modules/doctorCard/doctorCardRoutes.js.js';

import authRoutes from './modules/auth/authRoutes.js';
import hospitalRouter from './modules/hospital/hospitalRoutes.js';
import sessionRouter from './modules/session/sessionRoutes.js';
import patientRouter from './modules/patient/patientRoute.js';
// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Register doctor routes
app.use('/api/doctor', doctorRoutes);
// Register patient routes
app.use('/api/patient', patientRouter);

// Register auth routes
app.use('/api/auth', authRoutes);
// Register hospital Routes
app.use('/api/hospital' , hospitalRouter)
// Register session routes
app.use('/api/session', sessionRouter);
//docotr Card routes
app.use('/api/doctorCard', doctorCardRouter);

// Connect to MongoDB
connectDB();

// Basic route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
}); 