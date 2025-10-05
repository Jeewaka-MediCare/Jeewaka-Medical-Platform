import mongoose from "mongoose";
import crypto from "crypto";

const versionSchema = new mongoose.Schema({
  versionId: { 
    type: String, 
    required: true, 
    unique: true,
    default: () => `VER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  
  recordId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Record', 
    required: true 
  },
  
  versionNumber: { 
    type: Number, 
    required: true,
    min: 1
  },
  
  content: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        return v && v.trim().length > 0;
      },
      message: 'Content cannot be empty'
    }
  },
  
  contentHash: { 
    type: String, 
    required: false // Will be set by pre-save middleware
  },
  
  changeDescription: { 
    type: String,
    trim: true,
    default: ''
  },
  
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor', 
    required: true 
  },
  
  isApproved: { 
    type: Boolean, 
    default: true  // Auto-approved as per requirements
  },
  
  approvedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor'
  },
  
  approvedAt: { 
    type: Date,
    default: Date.now
  },
  
  contentSize: { 
    type: Number,
    required: false // Will be set by pre-save middleware
  },
  
  previousVersionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Version',
    default: null
  }
  
}, {
  timestamps: true
});

// Compound index for efficient version queries
versionSchema.index({ recordId: 1, versionNumber: -1 });
versionSchema.index({ recordId: 1, createdAt: -1 });
versionSchema.index({ versionId: 1 });
versionSchema.index({ contentHash: 1 });

// Pre-save middleware to generate content hash and size
versionSchema.pre('save', function(next) {
  if (this.isModified('content') || this.isNew) {
    // Generate SHA-256 hash for content integrity
    this.contentHash = crypto
      .createHash('sha256')
      .update(this.content, 'utf8')
      .digest('hex');
    
    // Calculate content size in bytes
    this.contentSize = Buffer.byteLength(this.content, 'utf8');
  }
  next();
});

// Static method to get latest version for a record
versionSchema.statics.getLatestVersion = function(recordId) {
  return this.findOne({ recordId })
    .sort({ versionNumber: -1 })
    .populate('createdBy', 'name specialization')
    .populate('approvedBy', 'name specialization');
};

// Static method to get version history for a record
versionSchema.statics.getVersionHistory = function(recordId, limit = 10) {
  return this.find({ recordId })
    .sort({ versionNumber: -1 })
    .limit(limit)
    .populate('createdBy', 'name specialization')
    .populate('approvedBy', 'name specialization')
    .select('-content'); // Exclude content for performance in history view
};

// Static method to create new version with auto-incrementing version number
versionSchema.statics.createNewVersion = async function(recordId, content, createdBy, changeDescription = '') {
  try {
    // Get the latest version number for this record
    const latestVersion = await this.findOne({ recordId }).sort({ versionNumber: -1 });
    const newVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;
    
    // Create new version
    const newVersion = new this({
      recordId,
      versionNumber: newVersionNumber,
      content,
      createdBy,
      changeDescription,
      previousVersionId: latestVersion ? latestVersion._id : null,
      approvedBy: createdBy, // Auto-approved by creator
      approvedAt: new Date()
    });
    
    return await newVersion.save();
  } catch (error) {
    throw new Error(`Failed to create new version: ${error.message}`);
  }
};

// Instance method to verify content integrity
versionSchema.methods.verifyIntegrity = function() {
  const currentHash = crypto
    .createHash('sha256')
    .update(this.content, 'utf8')
    .digest('hex');
  
  return currentHash === this.contentHash;
};

// Instance method to get content diff with previous version
versionSchema.methods.getDiffWithPrevious = async function() {
  if (!this.previousVersionId) {
    return null;
  }
  
  const previousVersion = await this.constructor.findById(this.previousVersionId);
  if (!previousVersion) {
    return null;
  }
  
  return {
    previousVersion: previousVersion.versionNumber,
    currentVersion: this.versionNumber,
    previousContent: previousVersion.content,
    currentContent: this.content,
    changeDescription: this.changeDescription
  };
};

const Version = mongoose.model("Version", versionSchema);
export default Version;