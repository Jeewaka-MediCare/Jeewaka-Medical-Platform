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

const sessionRouter = express.Router();

// Create a new session
sessionRouter.post("/", createSession);

// Get all sessions
sessionRouter.get("/", getSessions);
// Get a  sessions by doctor id
sessionRouter.get("/doctor/:doctorId", getSessionByDoctorId);

// Get a single session by ID
sessionRouter.get("/:sessionId", getSessionById);

// Update a session
sessionRouter.patch("/:sessionId", updateSession);

// ------------------------new----------------------------
// Update session meeting ID
sessionRouter.patch("/:sessionId/meeting-id", updateSessionMeetingId);

// Update appointment (timeSlot) meeting ID
sessionRouter.patch(
  "/:sessionId/appointment/:slotIndex/meeting-id",
  updateAppointmentMeetingId
);
// -------------------------------------------------------

// Delete a session
sessionRouter.delete("/:sessionId", deleteSession);

// Add a time slot to a session
sessionRouter.post("/:sessionId/timeslot", addTimeSlot);

// Update a time slot in a session
sessionRouter.put("/:sessionId/timeslot/:slotIndex", updateTimeSlot);

// Delete a time slot from a session
sessionRouter.delete("/:sessionId/timeslot/:slotIndex", deleteTimeSlot);

// Book an appointment with payment verification
sessionRouter.post("/:sessionId/book", bookAppointment);

export default sessionRouter;
