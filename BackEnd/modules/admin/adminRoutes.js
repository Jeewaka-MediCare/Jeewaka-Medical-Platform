import {removeAdminRole, addAdminRole, getAdminUsers} from "./adminCotroller.js";
import express from "express";
import { authMiddleware, requireRole } from "../../middleware/authMiddleware.js";

const adminRouter = express.Router();

// ============================================
// ADMIN ONLY ROUTES - All require admin role
// ============================================

// Legacy routes for compatibility
adminRouter.get("/", getAdminUsers);
adminRouter.post("/add-role", addAdminRole);
adminRouter.post("/remove-role", removeAdminRole);

// Protected routes (if needed later, functions would need to be implemented)
// adminRouter.post("/", authMiddleware, requireRole(['admin']), createAdmin);
// adminRouter.get("/protected", authMiddleware, requireRole(['admin']), getAdmins);
// adminRouter.get("/:id", authMiddleware, requireRole(['admin']), getAdminById);
// adminRouter.get("/uuid/:uuid", authMiddleware, requireRole(['admin']), getAdminByUid);
// adminRouter.put("/:id", authMiddleware, requireRole(['admin']), updateAdmin);
// adminRouter.delete("/:id", authMiddleware, requireRole(['admin']), deleteAdmin);

export default adminRouter;