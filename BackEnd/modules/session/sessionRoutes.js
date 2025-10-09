import express from "express";
import {
  createSession,
  getSessionById,
  getSessions,
  updateSession,
  updateSessionMeetingId,
  updateAppointmentMeetingId,
  deleteSession,
  addTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
  bookAppointment,
  getSessionByDoctorId,
} from "./sessionController.js";
import { authMiddleware, requireRole, optionalAuthMiddleware } from "../../middleware/authMiddleware.js";

const sessionRouter = express.Router();

// ============================================
// PUBLIC ROUTES (with optional auth for enhanced features)
// ============================================

// Get all sessions (public - for browsing available appointments)
sessionRouter.get("/", optionalAuthMiddleware, getSessions);

// Get sessions by doctor ID (public - view doctor's availability)
sessionRouter.get("/doctor/:doctorId", optionalAuthMiddleware, getSessionByDoctorId);

// Get single session by ID (public - view session details before booking)
sessionRouter.get("/:sessionId", optionalAuthMiddleware, getSessionById);

// ============================================
// AUTHENTICATED ROUTES - Patient Actions
// ============================================

// Book an appointment (requires authentication)
sessionRouter.post("/:sessionId/book", 
  authMiddleware, 
  bookAppointment
);

// ============================================
// DOCTOR ONLY ROUTES - Session Management
// ============================================

// Create a new session (doctors only)
sessionRouter.post("/", 
  authMiddleware, 
  requireRole(['doctor']), 
  createSession
);

// Update a session (doctors only - should only update own sessions)
sessionRouter.patch("/:sessionId", 
  authMiddleware, 
  requireRole(['doctor']), 
  updateSession
);

// Update session meeting ID (doctors only)
sessionRouter.patch("/:sessionId/meeting-id", 
  authMiddleware, 
  requireRole(['doctor']), 
  updateSessionMeetingId
);

// Update appointment meeting ID (doctors only)
sessionRouter.patch(
  "/:sessionId/appointment/:slotIndex/meeting-id",
  authMiddleware, 
  requireRole(['doctor']), 
  updateAppointmentMeetingId
);

// Delete a session (doctors only)
sessionRouter.delete("/:sessionId", 
  authMiddleware, 
  requireRole(['doctor']), 
  deleteSession
);

// Add a time slot to a session (doctors only)
sessionRouter.post("/:sessionId/timeslot", 
  authMiddleware, 
  requireRole(['doctor']), 
  addTimeSlot
);

// Update a time slot in a session (doctors only)
sessionRouter.put("/:sessionId/timeslot/:slotIndex", 
  authMiddleware, 
  requireRole(['doctor']), 
  updateTimeSlot
);

// Delete a time slot from a session (doctors only)
sessionRouter.delete("/:sessionId/timeslot/:slotIndex", 
  authMiddleware, 
  requireRole(['doctor']), 
  deleteTimeSlot
);

export default sessionRouter;
