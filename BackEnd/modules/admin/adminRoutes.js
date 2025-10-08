import {removeAdminRole,addAdminRole,getAdminUsers, createAdmin, getAdmins, getAdminById, getAdminByUid, updateAdmin, deleteAdmin}from "./adminCotroller.js";
import express from "express";
import { authMiddleware, requireRole } from "../../middleware/authMiddleware.js";

const adminRouter = express.Router();

// ============================================
// ADMIN ONLY ROUTES - All require admin role
// ============================================

// Legacy routes for compatibility
adminRouter.get("/legacy", getAdminUsers);
adminRouter.post("/add-role", addAdminRole);
adminRouter.post("/remove-role", removeAdminRole);

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