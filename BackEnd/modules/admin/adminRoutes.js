import { getAdminById ,getAdminByUid , createAdmin ,deleteAdmin , updateAdmin  , getAdmins} from "./adminCotroller.js";
import express from "express";
import { authMiddleware, requireRole } from "../../middleware/authMiddleware.js";

const adminRouter = express.Router();

// ============================================
// ADMIN ONLY ROUTES - All require admin role
// ============================================

// Create admin (admin only)
adminRouter.post("/", 
  authMiddleware, 
  requireRole(['admin']), 
  createAdmin
);

// Get all admins (admin only)
adminRouter.get("/", 
  authMiddleware, 
  requireRole(['admin']), 
  getAdmins
);

// Get admin by ID (admin only)
adminRouter.get("/:id", 
  authMiddleware, 
  requireRole(['admin']), 
  getAdminById
);

// Get admin by UUID (admin only)
adminRouter.get("/uuid/:uuid", 
  authMiddleware, 
  requireRole(['admin']), 
  getAdminByUid
);

// Update admin (admin only)
adminRouter.put("/:id", 
  authMiddleware, 
  requireRole(['admin']), 
  updateAdmin
);

// Delete admin (admin only)
adminRouter.delete("/:id", 
  authMiddleware, 
  requireRole(['admin']), 
  deleteAdmin
);

export default adminRouter;