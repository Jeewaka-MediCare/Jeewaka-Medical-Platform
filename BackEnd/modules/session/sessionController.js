import Session from "./sessionModel.js";
import Doctor from "../doctor/doctorModel.js";

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