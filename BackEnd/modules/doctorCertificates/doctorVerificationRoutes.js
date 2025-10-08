import express from "express";
import { createVerification , updateVerificationStatus , getAllVerifications } from "./doctorVerificationControllers.js";
import { authMiddleware, requireRole } from "../../middleware/authMiddleware.js";

const adminVerificationRouter = express.Router();

// ============================================
// DOCTOR VERIFICATION ROUTES
// ============================================

// Submit verification (doctors can submit their own credentials)
adminVerificationRouter.post('/', 
  authMiddleware, 
  requireRole(['doctor']), 
  createVerification
);

// Get all verifications (admin only - for approval dashboard)
adminVerificationRouter.get('/', 
  authMiddleware, 
  requireRole(['admin']), 
  getAllVerifications
);

// Update verification status (admin only - approve/reject doctors)
adminVerificationRouter.put('/:doctorId', 
  authMiddleware, 
  requireRole(['admin']), 
  updateVerificationStatus
);

export default adminVerificationRouter;

