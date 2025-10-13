import express from "express";
import { 
  createVerification, 
  updateVerificationStatus, 
  getAllVerifications,
  uploadDoctorDocument,
  getDoctorDocuments,
  deleteDoctorDocument,
  uploadMiddleware,
  getVerificationByDoctorId
} from "./doctorVerificationControllers.js";
import { authMiddleware, requireRole } from "../../middleware/authMiddleware.js";

const adminVerificationRouter = express.Router();

// ============================================
// DOCTOR VERIFICATION ROUTES
// ============================================

// Submit verification (doctors can submit their own credentials)
adminVerificationRouter.post('/', 
  
  createVerification
);

// Get all verifications (admin only - for approval dashboard)
adminVerificationRouter.get('/', 
  authMiddleware, 
  requireRole(['admin']), 
  getAllVerifications
);
adminVerificationRouter.get('/:doctorId', 

  getVerificationByDoctorId
);

// Update verification status (admin only - approve/reject doctors)
adminVerificationRouter.put('/:doctorId', 
  authMiddleware, 
  requireRole(['admin']), 
  updateVerificationStatus
);

// ============================================
// DOCTOR DOCUMENT UPLOAD ROUTES
// ============================================

// Upload verification document for a doctor
adminVerificationRouter.post('/documents/:doctorId', 
  authMiddleware, 
  requireRole(['doctor', 'admin']), 
  uploadMiddleware,
  uploadDoctorDocument
);

// Get all documents for a doctor
adminVerificationRouter.get('/documents/:doctorId', 
  authMiddleware, 
  requireRole(['doctor', 'admin']), 
  getDoctorDocuments
);

// Delete a specific document
adminVerificationRouter.delete('/documents/:doctorId/:filename', 
  authMiddleware, 
  requireRole(['doctor', 'admin']), 
  deleteDoctorDocument
);

export default adminVerificationRouter;

