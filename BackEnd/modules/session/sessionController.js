import Session from "./sessionModel.js";
import Doctor from "../doctor/doctorModel.js";
import Patient from "../patient/patientModel.js";
import mongoose from 'mongoose';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

let stripe;
try {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder_key_replace_with_real_sandbox_key') {
    throw new Error('Stripe secret key not configured');
  }
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} catch (error) {
  console.warn('Stripe not configured:', error.message);
  stripe = null;
}

// Create a new session
export const createSession = async (req, res) => {
  const { doctorId, ...rest } = req.body;

  try {
    console.log("Creating session with payload:", req.body);

    // Create session
    const session = await Session.create({ doctorId, ...rest });

    // Update doctor's sessions array with spread operator
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    doctor.sessions = [...doctor.sessions, session._id]; // ✅ spread operator
    await doctor.save();

    res.status(200).json({ success: true, session });
  } catch (err) {
    console.error("Error creating session:", err);
    res.status(400).json({ error: err.message });
  }
};

 

export const getSessions = async (req, res) => {
  try {
    // Fetch all sessions with hospital and doctorId populated
    const sessions = await Session.find()
      .populate('hospital')
      .populate('doctorId')
      .lean(); // lean() gives plain JS objects, easier to add properties

    // Map through sessions and calculate totalSlots and bookedSlots
    const sessionsWithSlots = sessions.map(session => {
      const totalSlots = session.timeSlots.length;
      // Count booked slots (assuming booked means status != "available" or patientId != null)
      const bookedSlots = session.timeSlots.filter(slot => slot.status !== 'available' || slot.patientId).length;

      return {
        ...session,
        totalSlots,
        bookedSlots
      };
    });

    // Send response
    res.json(sessionsWithSlots);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Get a single session by ID
export const getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update a session
export const updateSession = async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(req.params.sessionId, req.body, { new: true });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a session
export const deleteSession = async (req, res) => {
  try {
    const session = await Session.findByIdAndDelete(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ message: 'Session deleted' });
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
    if (!session) return res.status(404).json({ error: 'Session not found' });
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
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const slot = session.timeSlots[slotIndex];
    if (!slot) return res.status(404).json({ error: 'Time slot not found' });

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
    if (!session) return res.status(404).json({ error: 'Session not found' });
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
    const { slotIndex, patientId, paymentIntentId } = req.body;

    if (!stripe) {
      return res.status(500).json({ 
        error: 'Payment system not configured. Please set STRIPE_SECRET_KEY in .env file.' 
      });
    }

    // Basic validation
    if (paymentIntentId === null || paymentIntentId === undefined || paymentIntentId === '') {
      console.error('bookAppointment - Missing paymentIntentId', { sessionId, slotIndex, patientId, paymentIntentId });
      return res.status(400).json({ error: 'Payment intent ID is required' });
    }

    if (slotIndex === null || slotIndex === undefined || isNaN(parseInt(slotIndex))) {
      console.error('bookAppointment - Invalid slotIndex', { slotIndex });
      return res.status(400).json({ error: 'slotIndex is required and must be a number' });
    }

    // Normalize slot index to integer for consistent usage
    const slotIdx = parseInt(slotIndex, 10);

    if (!patientId) {
      console.error('bookAppointment - Missing patientId', { patientId });
      return res.status(400).json({ error: 'patientId is required' });
    }

    // Resolve patientId: accept either backend ObjectId or frontend UUID (firebase uid stored as Patient.uuid)
    let resolvedPatientId = patientId;
    try {
      if (!mongoose.Types.ObjectId.isValid(patientId)) {
        // Try to find by uuid field
        const patientDoc = await Patient.findOne({ uuid: patientId });
        if (!patientDoc) {
          console.error('bookAppointment - No patient found for provided id/uuid', { patientId });
          return res.status(400).json({ error: 'Invalid patientId: no matching patient found' });
        }
        resolvedPatientId = patientDoc._id;
        console.log('bookAppointment - Resolved patientId to _id', { resolvedPatientId });
      }
    } catch (resolveErr) {
      console.error('bookAppointment - Error resolving patientId:', resolveErr);
      return res.status(500).json({ error: 'Internal error resolving patientId' });
    }

    // Verify payment status with Stripe (handle Stripe errors explicitly)
    let paymentIntent;
    try {
      console.log('bookAppointment - Retrieving payment intent from Stripe', { paymentIntentId });
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      console.log('bookAppointment - Retrieved payment intent', { id: paymentIntent.id, status: paymentIntent.status });
    } catch (stripeErr) {
      console.error('bookAppointment - Error retrieving payment intent from Stripe:', stripeErr && stripeErr.message ? stripeErr.message : stripeErr);
      // If Stripe returns an error (invalid id, API error), forward a clear message
      return res.status(400).json({ error: `Failed to retrieve payment intent: ${stripeErr.message || stripeErr}` });
    }

    if (!paymentIntent || paymentIntent.status !== 'succeeded') {
      const statusText = paymentIntent ? paymentIntent.status : 'not found';
      console.error('bookAppointment - Payment not completed or invalid', { paymentIntentId, status: statusText });
      return res.status(400).json({ error: `Payment not completed. Status: ${statusText}` });
    }

    // Find the session
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if slot exists and handle availability/idempotency
    const slot = session.timeSlots[slotIdx];
    if (!slot) {
      return res.status(404).json({ error: 'Time slot not found' });
    }

    // If slot already booked, allow idempotent success when it's the same paymentIntent
    if (slot.status !== 'available') {
      // If the same payment already booked this slot, treat as success
      if (slot.paymentIntentId && slot.paymentIntentId === paymentIntentId) {
        console.log('bookAppointment - Slot already booked by same paymentIntent, returning success', { sessionId, slotIdx, paymentIntentId });
        return res.status(200).json({
          success: true,
          message: 'Appointment already confirmed',
          session: session,
          slot: slot,
          payment: {
            intentId: slot.paymentIntentId,
            amount: slot.paymentAmount,
            currency: slot.paymentCurrency,
            status: paymentIntent.status
          }
        });
      }

      console.error('bookAppointment - Time slot is not available', { slotIndex: slotIdx, status: slot.status, existingPaymentIntentId: slot.paymentIntentId });
      return res.status(409).json({ error: 'Time slot is not available', status: slot.status });
    }

  // Update the time slot with booking details
  // Use the resolvedPatientId (may be an ObjectId) so Mongoose doesn't try to cast a Firebase uid string
  console.log('bookAppointment - Assigning patientId to slot', { originalPatientId: patientId, resolvedPatientId });
  slot.patientId = resolvedPatientId;
    slot.status = 'booked';
    slot.appointmentStatus = 'confirmed';
    
    // Store payment details in the slot
    slot.paymentIntentId = paymentIntentId;
    slot.paymentAmount = paymentIntent.amount / 100; // Convert from cents
    slot.paymentCurrency = paymentIntent.currency;
    slot.paymentDate = new Date();

    await session.save();

    res.status(200).json({
      success: true,
      message: 'Appointment booked successfully',
      session: session,
      slot: slot,
      payment: {
        intentId: paymentIntentId,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status
      }
    });

  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ error: error.message });
  }
}; 