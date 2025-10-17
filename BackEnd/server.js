import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./shared/database.js";
import doctorRoutes from "./modules/doctor/doctorRoutes.js";
import ratingRouter from "./modules/ratings/ratingRoutes.js";
import doctorCardRouter from "./modules/doctorCard/doctorCardRoutes.js";

import authRoutes from "./modules/auth/authRoutes.js";
import hospitalRouter from "./modules/hospital/hospitalRoutes.js";
import sessionRouter from "./modules/session/sessionRoutes.js";
import patientRouter from "./modules/patient/patientRoute.js";
import adminRouter from "./modules/admin/adminRoutes.js";
import adminVerificationRouter from "./modules/doctorCertificates/doctorVerificationRoutes.js";
import paymentsRouter from "./modules/payments/paymentsRoutes.js";
import financeRouter from "./modules/finance/financeRoutes.js";
import medicalRecordsRouter from "./modules/records/recordsRoutes.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Register doctor routes
app.use("/api/doctor", doctorRoutes);

// Register auth routes
app.use("/api/auth", authRoutes);

// Register hospital routes
app.use("/api/hospital", hospitalRouter);

// Register session routes
app.use("/api/session", sessionRouter);

// Register patient routes
app.use("/api/patient", patientRouter);

// Register payments routes
app.use("/api/payments", paymentsRouter);

// Register finance routes
app.use("/api/finance", financeRouter);

// Register medical records routes
app.use("/api/medical-records", medicalRecordsRouter);

// Register doctor Card routes
app.use("/api/doctorCard", doctorCardRouter);

// Register admin routes
app.use("/api/admin", adminRouter);

// Register admin verification routes
app.use("/api/admin-verification", adminVerificationRouter);

// Register rating/review routes
app.use("/api/ratings", ratingRouter);

// Connect to MongoDB
connectDB();

// Basic route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
