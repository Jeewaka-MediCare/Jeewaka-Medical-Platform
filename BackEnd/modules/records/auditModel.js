import mongoose from "mongoose";

const auditSchema = new mongoose.Schema({
  auditId: { 
    type: String, 
    required: true, 
    unique: true,
    default: () => `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  
  action: { 
    type: String, 
    required: true,
    enum: [
      'CREATE_RECORD',
      'READ_RECORD', 
      'UPDATE_RECORD',
      'DELETE_RECORD',
      'RESTORE_RECORD',
      'CREATE_VERSION',
      'VIEW_VERSION',
      'BACKUP_RECORD',
      'UPLOAD_ATTACHMENT',
      'DELETE_ATTACHMENT',
      'ACCESS_PATIENT_RECORDS'
    ]
  },
  
  resourceType: { 
    type: String, 
    required: true,
    enum: ['RECORD', 'VERSION', 'PATIENT', 'ATTACHMENT']
  },
  
  resourceId: { 
    type: String, 
    required: true 
  },
  
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: true 
  },
  
  performedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor', 
    required: true 
  },
  
  performedByType: { 
    type: String, 
    required: true,
    enum: ['DOCTOR', 'PATIENT', 'ADMIN'],
    default: 'DOCTOR'
  },
  
  details: {
    recordTitle: { type: String },
    versionNumber: { type: Number },
    previousValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    changeDescription: { type: String },
    attachmentFileName: { type: String },
    tags: [String],
    additionalInfo: { type: mongoose.Schema.Types.Mixed }
  },
  
  timestamp: { 
    type: Date, 
    default: Date.now,
    required: true
  },
  
  sessionInfo: {
    sessionId: { type: String },
    userAgent: { type: String },
    ipAddress: { type: String }
  },
  
  success: { 
    type: Boolean, 
    default: true 
  },
  
  errorMessage: { 
    type: String,
    default: null
  },
  
  duration: { 
    type: Number, // Duration in milliseconds
    default: null
  }
  
}, {
  timestamps: false // We're managing timestamp manually for audit purposes
});

// Indexes for efficient audit queries
auditSchema.index({ patientId: 1, timestamp: -1 });
auditSchema.index({ performedBy: 1, timestamp: -1 });
auditSchema.index({ action: 1, timestamp: -1 });
auditSchema.index({ resourceType: 1, resourceId: 1, timestamp: -1 });
auditSchema.index({ timestamp: -1 });
auditSchema.index({ auditId: 1 });

// Static method to log an action
auditSchema.statics.logAction = async function(actionData) {
  try {
    const auditEntry = new this({
      action: actionData.action,
      resourceType: actionData.resourceType,
      resourceId: actionData.resourceId,
      patientId: actionData.patientId,
      performedBy: actionData.performedBy,
      performedByType: actionData.performedByType || 'DOCTOR',
      details: actionData.details || {},
      sessionInfo: actionData.sessionInfo || {},
      success: actionData.success !== undefined ? actionData.success : true,
      errorMessage: actionData.errorMessage || null,
      duration: actionData.duration || null
    });
    
    return await auditEntry.save();
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to avoid breaking main operations
    return null;
  }
};

// Static method to get audit trail for a patient
auditSchema.statics.getPatientAuditTrail = function(patientId, options = {}) {
  const {
    limit = 50,
    page = 1,
    actions = null,
    startDate = null,
    endDate = null
  } = options;
  
  let query = { patientId };
  
  if (actions && actions.length > 0) {
    query.action = { $in: actions };
  }
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .populate('performedBy', 'name specialization')
    .populate('patientId', 'name email');
};

// Static method to get audit trail for a specific record
auditSchema.statics.getRecordAuditTrail = function(recordId, options = {}) {
  const { limit = 50 } = options;
  
  return this.find({ 
    resourceType: 'RECORD', 
    resourceId: recordId 
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('performedBy', 'name specialization')
    .populate('patientId', 'name email');
};

// Static method to get activity summary for a doctor
auditSchema.statics.getDoctorActivity = function(doctorId, options = {}) {
  const {
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default: last 30 days
    endDate = new Date()
  } = options;
  
  return this.aggregate([
    {
      $match: {
        performedBy: new mongoose.Types.ObjectId(doctorId),
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        lastPerformed: { $max: '$timestamp' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Instance method to get human-readable description
auditSchema.methods.getDescription = function() {
  const actionDescriptions = {
    'CREATE_RECORD': 'Created medical record',
    'READ_RECORD': 'Viewed medical record',
    'UPDATE_RECORD': 'Updated medical record',
    'DELETE_RECORD': 'Deleted medical record',
    'RESTORE_RECORD': 'Restored medical record',
    'CREATE_VERSION': 'Created new version',
    'VIEW_VERSION': 'Viewed version',
    'BACKUP_RECORD': 'Backed up record to S3',
    'UPLOAD_ATTACHMENT': 'Uploaded attachment',
    'DELETE_ATTACHMENT': 'Deleted attachment',
    'ACCESS_PATIENT_RECORDS': 'Accessed patient records'
  };
  
  let description = actionDescriptions[this.action] || this.action;
  
  if (this.details.recordTitle) {
    description += ` "${this.details.recordTitle}"`;
  }
  
  if (this.details.versionNumber) {
    description += ` (v${this.details.versionNumber})`;
  }
  
  return description;
};

const Audit = mongoose.model("Audit", auditSchema);
export default Audit;