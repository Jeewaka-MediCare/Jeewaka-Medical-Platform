import mongoose from "mongoose";

const doctorCertificateSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
  },
  certificates: {
    type: [String], // list of strings (cloud links)
    required: true,
  },
  commentFromAdmin: {
    type: String,
    default: "", // optional, admin can add later
  },
  isVerified: {
    type: Boolean,
    default: false, // initially not verified
  },
}, { timestamps: true });

const adminVerificationSchema = mongoose.model("DoctorCertificate", doctorCertificateSchema);
export default adminVerificationSchema;
