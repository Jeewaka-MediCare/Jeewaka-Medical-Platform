import express from "express";
import {
  createPaymentIntent,
  handleWebhook,
  getPaymentHistory,
  getPaymentDetails,
  getDoctorEarnings,
  getDoctorEarningsStats,
} from "./paymentsController.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";

const router = express.Router();

// ============================================
// AUTHENTICATED ROUTES
// ============================================

// Create payment intent (requires authentication)
// Users must be logged in to make payments
router.post("/create-intent", authMiddleware, createPaymentIntent);

// Get payment history for authenticated user (patient-specific)
router.get("/history", authMiddleware, getPaymentHistory);

// Get doctor earnings data (doctor-specific)
router.get("/earnings", authMiddleware, getDoctorEarnings);

// Get doctor earnings statistics for charts (doctor-specific)
router.get("/earnings/stats", authMiddleware, getDoctorEarningsStats);

// Get specific payment details (must come after other routes to avoid conflicts)
router.get("/:paymentId", authMiddleware, getPaymentDetails);

// ============================================
// WEBHOOK ROUTES (Stripe signature verification)
// ============================================

// Stripe webhook endpoint (requires raw body, verified by Stripe signature)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook
);

export default router;
