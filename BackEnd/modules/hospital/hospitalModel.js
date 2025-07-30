import mongoose from "mongoose";

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    
  },
  location: {
    type: String,
    required: true,
    
  }
}, {
  timestamps: true
});

const Hospital = mongoose.model('Hospital', hospitalSchema); 

export default Hospital