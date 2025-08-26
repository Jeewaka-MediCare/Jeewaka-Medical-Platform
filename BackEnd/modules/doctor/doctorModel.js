import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  phone: {type:String , required:true},
  uuid: { type: String, required: true, unique: true },
  gender: { type: String, },
  profile: { type: String ,default:"https://www.bing.com/images/search?view=detailV2&ccid=hGSCbXlc&id=317D9F7971F27317249FEBCD1E8132C925837B61&thid=OIP.hGSCbXlcOjL_9mmzerqAbQHaHa&mediaurl=https%3a%2f%2fwww.pngmart.com%2ffiles%2f23%2fProfile-PNG-Photo.png&cdnurl=https%3a%2f%2fth.bing.com%2fth%2fid%2fR.8464826d795c3a32fff669b37aba806d%3frik%3dYXuDJckygR7N6w%26pid%3dImgRaw%26r%3d0&exph=2048&expw=2048&q=profile+photo&simid=608018884673290624&FORM=IRPRST&ck=4BDF1503C9F51D7DFE6865BF623638F4&selectedIndex=0&itb=1" },
  dob: Date,
  specialization: String,
  subSpecializations: [String],
  regNo:{ type: String, required: true, unique: true },
  qualifications: [String],
  yearsOfExperience: {type:Number  ,default:0},
  languagesSpoken: [String],
  
  bio:{type:String, default:""},
  consultationFee:{type:Number ,default:0},
  sessions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Session' }],
  createdAt: { type: Date, default: Date.now }
});

const Doctor = mongoose.model('Doctor', doctorSchema);
export default Doctor;
