import Hospital from "./hospitalModel.js";

// Create a new hospital
export const createHospital = async (req, res) => {
  try {
    const hospital = await Hospital.create(req.body);
    res.status(201).json(hospital);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all hospitals
export const getHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find();
    res.json(hospitals);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get a single hospital by ID
export const getHospitalById = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.hospitalId);
    if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
    res.json(hospital);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update a hospital
export const updateHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(req.params.hospitalId, req.body, { new: true });
    if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
    res.json(hospital);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a hospital
export const deleteHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndDelete(req.params.hospitalId);
    if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
    res.json({ message: 'Hospital deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}; 