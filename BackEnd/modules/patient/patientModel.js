import mongoose from "mongoose";

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  uuid: { type: String, required: true, unique: true },
  profile: { type: String },
  dob: { type: Date },
  sex: { type: String, enum: ["Male", "Female", "Other"] },
});

const Patient = mongoose.model("Patient", patientSchema);
export default Patient;
