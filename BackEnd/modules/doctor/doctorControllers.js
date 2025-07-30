import Doctor from './doctorModel.js';



export const createDoctor = async (req, res) => {
  try {
    const data = req.body;

    // Check if the request body is an array or single object
    if (Array.isArray(data)) {
      // Insert multiple doctors
      const insertedDoctors = await Doctor.insertMany(data);
      return res.status(201).json({
        message: "Doctors inserted successfully.",
        count: insertedDoctors.length,
        doctors: insertedDoctors
      });
    } else {
      // Insert a single doctor
      const newDoctor = new Doctor(data);
      const savedDoctor = await newDoctor.save();
      return res.status(201).json({
        message: "Doctor inserted successfully.",
        doctor: savedDoctor
      });
    }
  } catch (error) {
    console.error('Insert Doctors Error:', error.message);
    return res.status(500).json({ error: "Failed to insert doctor(s)", details: error.message });
  }
};


// Get all doctors
export const getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDoctorByUuid = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ uuid: req.params.uuid });
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get doctor by ID
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update doctor
export const updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.json({success:true , doctor:doctor});
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete doctor
export const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.json({ message: 'Doctor deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
