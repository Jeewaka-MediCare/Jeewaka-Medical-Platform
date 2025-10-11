import Patient from "./patientModel.js";
import Session from "../session/sessionModel.js";
import Doctor from "../doctor/doctorModel.js";

// Create a patient
export const createPatient = async (req, res) => {
  try {
    const patient = new Patient(req.body);
    await patient.save();
    res.status(201).json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find();
    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPatientAppointments = async (req, res) => {
  const { patientId } = req.params;
  console.log("Fetching appointments for patientId:", patientId);

  try {
    // Find all sessions where at least one timeslot has this patient
    const sessions = await Session.find({ "timeSlots.patientId": patientId })
      .populate("doctorId", "name specialization") // include doctor details
      .populate("hospital", "name address") // include hospital details
      .lean();
    
    console.log("Sessions retrieved:", sessions.length);
  


    if (!sessions || sessions.length === 0) {
      return res
        .status(404)
        .json({ message: "No appointments found for this patient" });
    }
    console.log("Sessions found for patient:", sessions);

    // Extract only the slots belonging to this patient
    const appointments = sessions.flatMap((session) =>
      session.timeSlots
        .filter((slot) => slot.patientId?.toString() === patientId)
        .map((slot) => ({
          sessionId: session._id,
          doctor: session.doctorId,
          hospital: session.hospital,
          date: session.date,
          meetingLink: session.meetingLink,
          type: session.type,
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: slot.status,
          appointmentStatus: slot.appointmentStatus,
          paymentAmount: slot.paymentAmount,
          paymentCurrency: slot.paymentCurrency,
          paymentDate: slot.paymentDate,
        }))
    );

    res.json(appointments);
  } catch (error) {
    console.error("Error fetching patient appointments:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPatientByUuid = async (req, res) => {
  const { uuid } = req.params;

  try {
    const patient = await Patient.findOne({ uuid }); // or just { uuid }
    res.status(200).json(patient);

    // res.status(200).json(patient);
  } catch (error) {
    console.error("Error fetching patient:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get a patient by ID
export const getPatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Update a patient
export const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // return the updated document
      runValidators: true, // ensure validation rules are applied
    });
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🗑️ Optional: Delete a patient
export const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    res.status(200).json({ message: "Patient deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
