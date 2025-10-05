import mongoose from "mongoose";

const recordSchema = new mongoose.Schema({
  recordId: { 
    type: String, 
    required: true, 
    unique: true,
    default: () => `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: true 
  },
  
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  
  description: { 
    type: String,
    trim: true
  },
  
  currentVersionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Version',
    default: null
  },
  
  tags: [{ 
    type: String, 
    trim: true 
  }],
  
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor', 
    required: true 
  },
  
  lastModifiedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor'
  },
  
  isDeleted: { 
    type: Boolean, 
    default: false 
  },
  
  deletedAt: { 
    type: Date, 
    default: null 
  },
  
  deletedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor',
    default: null
  },
  
  attachments: [{
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number },
    mimeType: { type: String },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }
  }]
  
}, {
  timestamps: true
});

// Index for efficient queries
recordSchema.index({ patientId: 1, isDeleted: 1 });
recordSchema.index({ createdBy: 1, isDeleted: 1 });
recordSchema.index({ recordId: 1 });
recordSchema.index({ tags: 1 });

// Virtual for getting active records (not soft deleted)
recordSchema.virtual('isActive').get(function() {
  return !this.isDeleted;
});

// Static method to find active records
recordSchema.statics.findActive = function(filter = {}) {
  return this.find({ ...filter, isDeleted: false });
};

// Instance method for soft delete
recordSchema.methods.softDelete = function(deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  return this.save();
};

// Instance method to restore soft deleted record
recordSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = null;
  this.deletedBy = null;
  return this.save();
};

const Record = mongoose.model("Record", recordSchema);
export default Record;