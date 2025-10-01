import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  phone: {type:String , required:true},
  uuid: { type: String, required: true, unique: true },
  gender: { type: String, },
  profile: { type: String },
  dob: Date,
  specialization: String,
  subSpecializations: [String],
  regNo:{ type: String, required: true, unique: true },
  qualifications: [String],
  yearsOfExperience: {type:Number  ,default:0},
  languagesSpoken: [String],
  
  bio:{type:String, default:""},
  consultationFee:{type:Number ,default:0},
  embedding: [Number], // Vector embedding for AI-powered search
  sessions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Session' }],
  createdAt: { type: Date, default: Date.now }
});

const Doctor = mongoose.model('Doctor', doctorSchema);
export default Doctor;
