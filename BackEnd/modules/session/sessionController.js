import Session from "./sessionModel.js";
import Doctor from "../doctor/doctorModel.js";
import Patient from "../patient/patientModel.js";
import Hospital from "../hospital/hospitalModel.js";
import { sendSessionInitializedEmail } from "../email/emailService.js";
import mongoose from "mongoose";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

let stripe;
try {
  if (
    !process.env.STRIPE_SECRET_KEY ||
    process.env.STRIPE_SECRET_KEY ===
      "sk_test_placeholder_key_replace_with_real_sandbox_key"
  ) {
    throw new Error("Stripe secret key not configured");
  }
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} catch (error) {
  console.warn("Stripe not configured:", error.message);
  stripe = null;
}

// Create a new session
// export const createSession = async (req, res) => {
//   const { doctorId, ...rest } = req.body;

//   try {
//     console.log("Creating session with payload:", req.body);

//     // Create session
//     const session = await Session.create({ doctorId, ...rest });

//     // Update doctor's sessions array with spread operator
//     const doctor = await Doctor.findById(doctorId);
//     if (!doctor) {
//       return res.status(404).json({ error: "Doctor not found" });
//     }

//     doctor.sessions = [...doctor.sessions, session._id]; // ✅ spread operator
//     await doctor.save();

//     res.status(200).json({ success: true, session });
//   } catch (err) {
//     console.error("Error creating session:", err);
//     res.status(400).json({ error: err.message });
//   }
// };
// controllers/sessionController.js

export const createSession = async (req, res) => {
  const { doctorId, ...rest } = req.body;

  try {
    console.log("Creating session with payload:", req.body);

    // 1) Create the session
    const session = await Session.create({ doctorId, ...rest });

    // 2) Attach session to doctor (spread operator)
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }
    doctor.sessions = [...doctor.sessions, session._id];
    await doctor.save();

    // 3) Email: session initialized (best-effort; don't block success)
    try {
      // doctor name + email
      const doctorName = `Dr. ${doctor.name ?? ""}`;
      const to = doctor.email;

      // resolve hospital info if needed
      let hospitalName = "",
        hospitalAddress = "";
      if (
        String(session.type).toLowerCase() === "in-person" &&
        session.hospital
      ) {
        const hosp = await Hospital.findById(session.hospital).lean();
        hospitalName = hosp?.name || "";
        hospitalAddress = hosp?.location || "";
      }

      // build a dashboard URL to manage the just-created session
      const manageUrl = `https://app.healthcare.example/doctor/sessions/${session._id}`;

      // send the email
      await sendSessionInitializedEmail({
        to,
        doctorName,
        sessionDate: session.date, // Date
        type: session.type, // "online" | "in-person"
        hospitalName,
        hospitalAddress,
        meetingLink: session.meetingLink || "", // for online type
        timeSlots: (session.timeSlots || []).map((s) => ({
          startTime: s.startTime,
          endTime: s.endTime,
        })),
        manageUrl,
        // calendarIcsUrl: 'https://app.healthcare.example/api/sessions/${session._id}/ics' // optional
      });
      console.log("✅ Session initialized email queued/sent.");
    } catch (mailErr) {
      console.warn(
        "⚠️ Session created, but failed to send email:",
        mailErr?.message || mailErr
      );
      // do not throw; we still return 200 for successful creation
    }

    // 4) Respond success
    return res.status(200).json({ success: true, session });
  } catch (err) {
    console.error("Error creating session:", err);
    return res.status(400).json({ error: err.message });
  }
};

export const getSessions = async (req, res) => {
  try {
    // Fetch all sessions with hospital and doctorId populated
    const sessions = await Session.find()
      .populate("hospital")
      .populate("doctorId")
      .lean(); // lean() gives plain JS objects, easier to add properties

    // Map through sessions and calculate totalSlots and bookedSlots
    const sessionsWithSlots = sessions.map((session) => {
      const totalSlots = session.timeSlots.length;
      // Count booked slots (assuming booked means status != "available" or patientId != null)
      const bookedSlots = session.timeSlots.filter(
        (slot) => slot.status !== "available" || slot.patientId
      ).length;

      return {
        ...session,
        totalSlots,
        bookedSlots,
      };
    });

    // Send response
    res.json(sessionsWithSlots);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get a single session by ID
export const getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId)
      .populate("hospital", "name location address")
      .populate("timeSlots.patientId", "name email phone uuid");
    if (!session) return res.status(404).json({ error: "Session not found" });

    // If user is authenticated and is a doctor, populate patient information in time slots      //new
    if (req.user && req.user.role === "doctor") {
      // Find the doctor by Firebase UID to get their MongoDB _id
      const doctor = await Doctor.findOne({ uuid: req.user.uid });

      if (doctor) {
        // Additional security: Only populate patient data if doctor owns this session or is admin
        const isDoctorOwner =
          session.doctorId.toString() === doctor._id.toString();
        const isAdmin = req.user.role === "admin";

        if (isDoctorOwner || isAdmin) {
          // Get all patient IDs from booked slots
          const patientIds = session.timeSlots
            .filter((slot) => slot.patientId && slot.status !== "available")
            .map((slot) => slot.patientId);

          // Fetch patient details for all unique patient IDs
          const patients =
            patientIds.length > 0
              ? await Patient.find({ _id: { $in: patientIds } }).select(
                  "name email phone uuid"
                )
              : [];

          // Create a map for quick lookup
          const patientsMap = new Map();
          patients.forEach((patient) => {
            patientsMap.set(patient._id.toString(), patient);
          });

          // Add patient information to time slots
          const enhancedTimeSlots = session.timeSlots.map((slot) => ({
            ...slot.toObject(),
            patient: slot.patientId
              ? patientsMap.get(slot.patientId.toString()) || null
              : null,
          }));

          const sessionWithPatients = {
            ...session.toObject(),
            timeSlots: enhancedTimeSlots,
          };

          return res.json(sessionWithPatients);
        }
      }
    }

    // For non-authenticated users, non-doctors, or doctors who don't own this session
    // Return session without patient details but with hospital information       //new
    res.json(session);
  } catch (err) {
    console.error("Error fetching session:", err); //new
    res.status(400).json({ error: err.message });
  }
};

export const getSessionByDoctorId = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { patientName, startDate, endDate, status, type, hospitalName } =
      req.query;

    // Build the base query
    let query = { doctorId };

    // Add date range filter if provided
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Add session type filter if provided
    if (type) {
      query.type = type;
    }

    const sessions = await Session.find(query)
      .populate("hospital", "name location address")
      .populate("timeSlots.patientId", "name email phone uuid");

    let filteredSessions = sessions;

    // Filter by patient name if provided
    if (patientName && patientName.trim()) {
      const searchTerm = patientName.toLowerCase().trim();
      filteredSessions = sessions.filter((session) => {
        return session.timeSlots.some((slot) => {
          if (!slot.patientId) return false;
          const patient = slot.patientId;
          return (
            patient.name && patient.name.toLowerCase().includes(searchTerm)
          );
        });
      });
    }

    // Filter by hospital name if provided
    if (hospitalName && hospitalName.trim()) {
      const hospitalSearchTerm = hospitalName.toLowerCase().trim();
      filteredSessions = filteredSessions.filter((session) => {
        return (
          session.hospital &&
          session.hospital.name &&
          session.hospital.name.toLowerCase().includes(hospitalSearchTerm)
        );
      });
    }

    // Filter by appointment status if provided
    if (status) {
      filteredSessions = filteredSessions.filter((session) => {
        return session.timeSlots.some((slot) => {
          return slot.appointmentStatus === status;
        });
      });
    }

    res.json(filteredSessions);
  } catch (err) {
    console.error("Error fetching doctor sessions:", err);
    res.status(400).json({ error: err.message });
  }
};

// Update a session
export const updateSession = async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(
      req.params.sessionId,
      req.body,
      { new: true }
    );
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ------------------------new----------------------------

// Update session meeting ID
export const updateSessionMeetingId = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { meetingId } = req.body;

    const session = await Session.findByIdAndUpdate(
      sessionId,
      { meetingId },
      { new: true }
    );

    if (!session) return res.status(404).json({ error: "Session not found" });

    res.json({ success: true, session });
  } catch (err) {
    console.error("Error updating session meeting ID:", err);
    res.status(400).json({ error: err.message });
  }
};

// Get or create appointment (timeSlot) meeting ID - atomic operation
export const updateAppointmentMeetingId = async (req, res) => {
  try {
    const { sessionId, slotIndex } = req.params;
    const slotIndexNum = parseInt(slotIndex);

    // First, get the session to check current state
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });

    if (slotIndexNum < 0 || slotIndexNum >= session.timeSlots.length) {
      return res.status(400).json({ error: "Invalid slot index" });
    }

    // ✅ ALWAYS check timeSlot meetingId first (NOT session-level meetingId)
    console.log(
      `🔍 Checking timeSlot[${slotIndexNum}].meetingId for session ${sessionId}`
    );
    console.log(
      `📊 Current timeSlot[${slotIndexNum}].meetingId value:`,
      session.timeSlots[slotIndexNum].meetingId
    );
    console.log(
      `📊 Session-level meetingId (should be ignored for appointments):`,
      session.meetingId
    );

    if (session.timeSlots[slotIndexNum].meetingId) {
      console.log(
        `✅ Found existing timeSlot meetingId: ${session.timeSlots[slotIndexNum].meetingId} for session ${sessionId}, slot ${slotIndex}`
      );
      return res.json({
        success: true,
        meetingId: session.timeSlots[slotIndexNum].meetingId,
        session,
      });
    }

    // ❌ REJECT if no meeting ID provided (frontend should create it)
    const { meetingId } = req.body;
    if (!meetingId) {
      return res.status(400).json({
        error:
          "No existing meeting ID found and no new meeting ID provided. Frontend should create meeting ID first.",
      });
    }

    console.log(
      `🔄 Attempting to store new meeting ID: ${meetingId} for session ${sessionId}, slot ${slotIndex}`
    );
    console.log(
      `📊 Current meetingId value in slot ${slotIndex}:`,
      session.timeSlots[slotIndexNum].meetingId
    );

    // ✅ Simple atomic operation: Only update if meetingId field is null or doesn't exist
    const updatedSession = await Session.findOneAndUpdate(
      {
        _id: sessionId,
        [`timeSlots.${slotIndexNum}.meetingId`]: null,
      },
      {
        $set: { [`timeSlots.${slotIndexNum}.meetingId`]: meetingId },
      },
      { new: true }
    );

    console.log(
      `📊 Update result:`,
      updatedSession
        ? "SUCCESS"
        : "FAILED - Document not found or already has meetingId"
    );

    if (!updatedSession) {
      // ⚠️ Race condition: Another request already set a meeting ID
      console.log(
        `⚠️ Race condition detected! Another request already set meeting ID for session ${sessionId}, slot ${slotIndex}`
      );
      const refreshedSession = await Session.findById(sessionId);
      const existingMeetingId =
        refreshedSession.timeSlots[slotIndexNum].meetingId;
      console.log(
        `✅ Returning existing meeting ID from race condition: ${existingMeetingId}`
      );
      return res.json({
        success: true,
        meetingId: existingMeetingId,
        session: refreshedSession,
      });
    }

    console.log(
      `✅ Successfully stored new meeting ID: ${meetingId} for session ${sessionId}, slot ${slotIndex}`
    );
    res.json({
      success: true,
      meetingId: meetingId,
      session: updatedSession,
    });
  } catch (err) {
    console.error("Error managing appointment meeting ID:", err);
    res.status(400).json({ error: err.message });
  }
};

// -------------------------------------------------------------------

// Delete a session
export const deleteSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });

    // Check if any time slots have bookings
    const hasBookings = session.timeSlots.some(
      (slot) => slot.patientId !== null || slot.status === "booked"
    );

    if (hasBookings) {
      return res.status(400).json({
        error:
          "Cannot delete session with existing bookings. Please cancel all appointments first.",
      });
    }

    // Delete the session
    await Session.findByIdAndDelete(req.params.sessionId);

    // Remove session from doctor's sessions array
    await Doctor.findByIdAndUpdate(session.doctorId, {
      $pull: { sessions: req.params.sessionId },
    });

    res.json({ message: "Session deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Add a time slot to a session
export const addTimeSlot = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const timeSlot = req.body;
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });
    session.timeSlots.push(timeSlot);
    await session.save();
    res.json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update a time slot in a session
export const updateTimeSlot = async (req, res) => {
  try {
    const { sessionId, slotIndex } = req.params;
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const slot = session.timeSlots[slotIndex];
    if (!slot) return res.status(404).json({ error: "Time slot not found" });

    // Only update the provided fields
    Object.keys(req.body).forEach((key) => {
      slot[key] = req.body[key];
    });

    await session.save();
    res.json({ success: true, message: "Time slot successfully updated" });
  } catch (err) {
    console.error("Error updating time slot:", err);
    res.status(400).json({ error: err.message });
  }
};

// Delete a time slot from a session
export const deleteTimeSlot = async (req, res) => {
  try {
    const { sessionId, slotIndex } = req.params;
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });
    session.timeSlots.splice(slotIndex, 1);
    await session.save();
    res.json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Book an appointment with payment verification
export const bookAppointment = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { slotIndex, paymentIntentId } = req.body;

    // Get patientId from authenticated user (req.user set by authMiddleware)
    const firebaseUid = req.user?.uid;

    if (!firebaseUid) {
      console.error("bookAppointment - No authenticated user");
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!stripe) {
      return res.status(500).json({
        error:
          "Payment system not configured. Please set STRIPE_SECRET_KEY in .env file.",
      });
    }

    // Basic validation
    if (
      paymentIntentId === null ||
      paymentIntentId === undefined ||
      paymentIntentId === ""
    ) {
      console.error("bookAppointment - Missing paymentIntentId", {
        sessionId,
        slotIndex,
        firebaseUid,
        paymentIntentId,
      });
      return res.status(400).json({ error: "Payment intent ID is required" });
    }

    if (
      slotIndex === null ||
      slotIndex === undefined ||
      isNaN(parseInt(slotIndex))
    ) {
      console.error("bookAppointment - Invalid slotIndex", { slotIndex });
      return res
        .status(400)
        .json({ error: "slotIndex is required and must be a number" });
    }

    // Normalize slot index to integer for consistent usage
    const slotIdx = parseInt(slotIndex, 10);

    // Look up patient by Firebase UID
    console.log("bookAppointment - Looking up patient by Firebase UID", {
      firebaseUid,
    });
    const patient = await Patient.findOne({ uuid: firebaseUid });

    if (!patient) {
      console.error("bookAppointment - No patient found for Firebase UID", {
        firebaseUid,
      });
      return res.status(404).json({
        error: "Patient profile not found",
        message:
          "Your account is not properly set up. Please complete your profile or contact support.",
      });
    }

    const resolvedPatientId = patient._id;
    console.log("bookAppointment - Patient resolved", {
      firebaseUid,
      patientMongoId: resolvedPatientId.toString(),
      patientName: patient.name,
      patientEmail: patient.email,
    });

    // Verify payment status with Stripe (handle Stripe errors explicitly)
    let paymentIntent;
    try {
      console.log("bookAppointment - Retrieving payment intent from Stripe", {
        paymentIntentId,
      });
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      console.log("bookAppointment - Retrieved payment intent", {
        id: paymentIntent.id,
        status: paymentIntent.status,
      });
    } catch (stripeErr) {
      console.error(
        "bookAppointment - Error retrieving payment intent from Stripe:",
        stripeErr && stripeErr.message ? stripeErr.message : stripeErr
      );
      // If Stripe returns an error (invalid id, API error), forward a clear message
      return res.status(400).json({
        error: `Failed to retrieve payment intent: ${
          stripeErr.message || stripeErr
        }`,
      });
    }

    if (!paymentIntent || paymentIntent.status !== "succeeded") {
      const statusText = paymentIntent ? paymentIntent.status : "not found";
      console.error("bookAppointment - Payment not completed or invalid", {
        paymentIntentId,
        status: statusText,
      });
      return res
        .status(400)
        .json({ error: `Payment not completed. Status: ${statusText}` });
    }

    // Find the session
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Check if slot exists and handle availability/idempotency
    const slot = session.timeSlots[slotIdx];
    if (!slot) {
      return res.status(404).json({ error: "Time slot not found" });
    }

    // If slot already booked, allow idempotent success when it's the same paymentIntent
    if (slot.status !== "available") {
      // If the same payment already booked this slot, treat as success
      if (slot.paymentIntentId && slot.paymentIntentId === paymentIntentId) {
        console.log(
          "bookAppointment - Slot already booked by same paymentIntent, returning success",
          { sessionId, slotIdx, paymentIntentId }
        );
        return res.status(200).json({
          success: true,
          message: "Appointment already confirmed",
          session: session,
          slot: slot,
          payment: {
            intentId: slot.paymentIntentId,
            amount: slot.paymentAmount,
            currency: slot.paymentCurrency,
            status: paymentIntent.status,
          },
        });
      }

      console.error("bookAppointment - Time slot is not available", {
        slotIndex: slotIdx,
        status: slot.status,
        existingPaymentIntentId: slot.paymentIntentId,
      });
      return res
        .status(409)
        .json({ error: "Time slot is not available", status: slot.status });
    }

    // Update the time slot with booking details
    // Use the resolvedPatientId (may be an ObjectId) so Mongoose doesn't try to cast a Firebase uid string
    console.log("bookAppointment - Assigning patientId to slot", {
      firebaseUid: req.user.uid,
      resolvedPatientId,
    });
    slot.patientId = resolvedPatientId;
    slot.status = "booked";
    slot.appointmentStatus = "confirmed";

    // Store payment details in the slot
    slot.paymentIntentId = paymentIntentId;
    slot.paymentAmount = paymentIntent.amount / 100; // Convert from cents
    slot.paymentCurrency = paymentIntent.currency;
    slot.paymentDate = new Date();

    await session.save();

    res.status(200).json({
      success: true,
      message: "Appointment booked successfully",
      session: session,
      slot: slot,
      payment: {
        intentId: paymentIntentId,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      },
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get doctor statistics
export const getDoctorStatistics = async (req, res) => {
  console.log("🔍 getDoctorStatistics called");
  console.log("🔍 Request params:", req.params);
  console.log("🔍 Request URL:", req.originalUrl);

  try {
    const doctorId = req.params.doctorId;
    console.log("🔍 Getting statistics for doctor:", doctorId);

    // Validate doctorId format
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ error: "Invalid doctor ID format" });
    }

    // Get all sessions for the doctor
    const sessions = await Session.find({ doctorId });
    console.log(`Found ${sessions.length} sessions for doctor ${doctorId}`);

    // Debug: log first session structure
    if (sessions.length > 0) {
      console.log(
        "🔍 Sample session structure:",
        JSON.stringify(sessions[0], null, 2)
      );
    }

    // Get unique patients who have booked appointments
    const uniquePatients = new Set();
    let appointmentsToday = 0;
    let completedSessions = 0;
    let totalBookedSlots = 0;

    const today = new Date();
    const todayString = today.toDateString();

    sessions.forEach((session) => {
      console.log("🔍 Processing session:", {
        id: session._id,
        date: session.date,
        slotsCount: session.timeSlots?.length || 0,
      });

      if (session.timeSlots) {
        session.timeSlots.forEach((slot) => {
          console.log("🔍 Processing slot:", {
            startTime: slot.startTime,
            appointmentStatus: slot.appointmentStatus,
            patientId: slot.patientId ? slot.patientId.toString() : null,
            sessionDate: session.date,
          });

          // Count unique patients (check both patientId and confirmed status)
          if (slot.patientId && slot.patientId.toString() !== "null") {
            uniquePatients.add(slot.patientId.toString());
            totalBookedSlots++;
            console.log(
              "🔍 Added patient to count:",
              slot.patientId.toString()
            );
          }

          // Count today's appointments (confirmed appointments)
          if (slot.appointmentStatus === "confirmed" && slot.patientId) {
            // Use session date, not slot startTime for date comparison
            const sessionDate = new Date(session.date);
            const sessionDateString = sessionDate.toDateString();
            console.log("🔍 Checking today appointment:", {
              sessionDate: session.date,
              sessionDateString,
              todayString,
              isToday: sessionDateString === todayString,
            });

            if (sessionDateString === todayString) {
              appointmentsToday++;
              console.log("🔍 Found today appointment:", slot.startTime);
            }
          }

          // Count completed appointments (individual appointments that are completed)
          if (slot.appointmentStatus === "completed") {
            completedSessions++;
          }
        });
      }
    });

    const statistics = {
      totalPatients: uniquePatients.size,
      appointmentsToday,
      completedAppointments: completedSessions, // Renamed for clarity - these are completed individual appointments
      totalSessions: sessions.length,
      totalBookedSlots,
    };

    console.log("Calculated statistics:", statistics);
    res.json(statistics);
  } catch (error) {
    console.error("Error fetching doctor statistics:", error);
    res.status(500).json({ error: error.message });
  }
};
