import express from 'express';
import MedicalRecordsController from './recordsController.js';
import s3BackupService from '../../services/s3BackupService.js';
import Audit from './auditModel.js';

const router = express.Router();

// Middleware to authenticate and set user context
// This should be replaced with your actual auth middleware
const authMiddleware = (req, res, next) => {
  // For now, we'll assume the auth middleware sets req.user
  // In real implementation, this would verify JWT token and set user info
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Middleware to log API access for audit trail
const auditMiddleware = (action) => {
  return async (req, res, next) => {
    req.auditData = {
      action,
      startTime: Date.now(),
      resourceId: req.params.recordId || req.params.patientId || 'N/A'
    };
    next();
  };
};

// ======================
// MEDICAL RECORDS ROUTES
// ======================

// Create a new medical record
router.post('/patients/:patientId/records', 
  authMiddleware, 
  auditMiddleware('CREATE_RECORD'),
  MedicalRecordsController.createRecord
);

// Get all records for a patient
router.get('/patients/:patientId/records', 
  authMiddleware, 
  auditMiddleware('ACCESS_PATIENT_RECORDS'),
  MedicalRecordsController.getPatientRecords
);

// Get a specific record with latest version
router.get('/records/:recordId', 
  authMiddleware, 
  auditMiddleware('READ_RECORD'),
  MedicalRecordsController.getRecord
);

// Update a record (creates new version)
router.put('/records/:recordId', 
  authMiddleware, 
  auditMiddleware('UPDATE_RECORD'),
  async (req, res, next) => {
    // Enhanced middleware to trigger S3 backup after successful update
    const originalSend = res.send;
    res.send = function(data) {
      // Call original send first
      originalSend.call(this, data);
      
      // If successful and content was updated, trigger backup
      if (res.statusCode === 200) {
        try {
          const responseData = typeof data === 'string' ? JSON.parse(data) : data;
          if (responseData.success && responseData.newVersion) {
            // Trigger S3 backup asynchronously
            s3BackupService.backupRecord(
              responseData.record,
              responseData.newVersion,
              req.user.id
            ).catch(error => {
              console.error('S3 backup failed:', error);
            });
          }
        } catch (error) {
          console.error('Error parsing response for backup:', error);
        }
      }
    };
    
    next();
  },
  MedicalRecordsController.updateRecord
);

// Soft delete a record
router.delete('/records/:recordId', 
  authMiddleware, 
  auditMiddleware('DELETE_RECORD'),
  MedicalRecordsController.deleteRecord
);

// ======================
// VERSIONING ROUTES
// ======================

// Get version history for a record
router.get('/records/:recordId/versions', 
  authMiddleware, 
  auditMiddleware('VIEW_VERSION'),
  MedicalRecordsController.getVersionHistory
);

// Get specific version content
router.get('/records/:recordId/versions/:versionNumber', 
  authMiddleware, 
  auditMiddleware('VIEW_VERSION'),
  MedicalRecordsController.getVersion
);

// ======================
// AUDIT ROUTES
// ======================

// Get audit trail for a specific record
router.get('/records/:recordId/audit', 
  authMiddleware,
  MedicalRecordsController.getRecordAuditTrail
);

// Get audit trail for a patient (doctor only)
router.get('/patients/:patientId/audit', 
  authMiddleware,
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const { page = 1, limit = 50, actions, startDate, endDate } = req.query;
      const userType = req.user.type;
      
      // Only doctors can view patient audit trails
      if (userType !== 'DOCTOR') {
        return res.status(403).json({ error: 'Only doctors can view audit trails' });
      }
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit)
      };
      
      if (actions) {
        options.actions = actions.split(',');
      }
      
      if (startDate) {
        options.startDate = startDate;
      }
      
      if (endDate) {
        options.endDate = endDate;
      }
      
      const auditTrail = await Audit.getPatientAuditTrail(patientId, options);
      
      res.json({
        success: true,
        auditTrail,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
      
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch audit trail',
        details: error.message 
      });
    }
  }
);

// Get doctor activity summary
router.get('/doctors/:doctorId/activity', 
  authMiddleware,
  async (req, res) => {
    try {
      const { doctorId } = req.params;
      const { startDate, endDate } = req.query;
      
      // Only the doctor themselves or admin can view activity
      if (req.user.id !== doctorId && req.user.type !== 'ADMIN') {
        return res.status(403).json({ error: 'Unauthorized access' });
      }
      
      const options = {};
      if (startDate) options.startDate = new Date(startDate);
      if (endDate) options.endDate = new Date(endDate);
      
      const activity = await Audit.getDoctorActivity(doctorId, options);
      
      res.json({
        success: true,
        activity
      });
      
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch activity',
        details: error.message 
      });
    }
  }
);

// ======================
// S3 BACKUP ROUTES
// ======================

// Manually trigger backup for a record
router.post('/records/:recordId/backup', 
  authMiddleware,
  async (req, res) => {
    try {
      const { recordId } = req.params;
      const doctorId = req.user.id;
      const userType = req.user.type;
      
      // Only doctors can trigger backups
      if (userType !== 'DOCTOR') {
        return res.status(403).json({ error: 'Only doctors can trigger backups' });
      }
      
      // Get record and latest version
      const Record = (await import('./recordModel.js')).default;
      const Version = (await import('./versionModel.js')).default;
      
      const record = await Record.findOne({ recordId, isDeleted: false });
      if (!record) {
        return res.status(404).json({ error: 'Record not found' });
      }
      
      if (!record.currentVersionId) {
        return res.status(400).json({ error: 'No version to backup' });
      }
      
      const version = await Version.findById(record.currentVersionId);
      if (!version) {
        return res.status(404).json({ error: 'Current version not found' });
      }
      
      // Trigger backup
      const backupResult = await s3BackupService.backupRecord(record, version, doctorId);
      
      res.json({
        success: true,
        backup: backupResult,
        message: 'Manual backup completed successfully'
      });
      
    } catch (error) {
      res.status(500).json({ 
        error: 'Backup failed',
        details: error.message 
      });
    }
  }
);

// List patient backups
router.get('/patients/:patientUuid/backups', 
  authMiddleware,
  async (req, res) => {
    try {
      const { patientUuid } = req.params;
      const { maxKeys = 100 } = req.query;
      const userType = req.user.type;
      
      // Only doctors can view backups
      if (userType !== 'DOCTOR') {
        return res.status(403).json({ error: 'Only doctors can view backups' });
      }
      
      const backups = await s3BackupService.listPatientBackups(patientUuid, { maxKeys });
      
      res.json({
        success: true,
        backups,
        totalCount: backups.length
      });
      
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to list backups',
        details: error.message 
      });
    }
  }
);

// Export patient complete history
router.post('/patients/:patientUuid/export', 
  authMiddleware,
  async (req, res) => {
    try {
      const { patientUuid } = req.params;
      const { format = 'json', includeAttachments = false } = req.body;
      const userType = req.user.type;
      
      // Only doctors can export patient history
      if (userType !== 'DOCTOR') {
        return res.status(403).json({ error: 'Only doctors can export patient history' });
      }
      
      const exportResult = await s3BackupService.exportPatientHistory(patientUuid, {
        format,
        includeAttachments
      });
      
      res.json({
        success: true,
        export: exportResult,
        message: 'Export completed successfully'
      });
      
    } catch (error) {
      res.status(500).json({ 
        error: 'Export failed',
        details: error.message 
      });
    }
  }
);

// Get backup statistics
router.get('/admin/backup-stats', 
  authMiddleware,
  async (req, res) => {
    try {
      const userType = req.user.type;
      
      // Only admins can view backup statistics
      if (userType !== 'ADMIN' && userType !== 'DOCTOR') {
        return res.status(403).json({ error: 'Unauthorized access' });
      }
      
      const stats = await s3BackupService.getBackupStatistics();
      
      res.json({
        success: true,
        statistics: stats
      });
      
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to get backup statistics',
        details: error.message 
      });
    }
  }
);

// ======================
// UTILITY ROUTES
// ======================

// Health check for medical records system
router.get('/health', async (req, res) => {
  try {
    const Record = (await import('./recordModel.js')).default;
    const Version = (await import('./versionModel.js')).default;
    const Audit = (await import('./auditModel.js')).default;
    
    // Test database connectivity
    const recordCount = await Record.countDocuments();
    const versionCount = await Version.countDocuments();
    const auditCount = await Audit.countDocuments();
    
    // Test S3 connectivity if enabled
    const backupStats = await s3BackupService.getBackupStatistics();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      database: {
        records: recordCount,
        versions: versionCount,
        auditLogs: auditCount
      },
      backup: backupStats,
      message: 'Medical records system is healthy'
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Health check failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Search records (for doctor dashboard integration)
router.get('/search', 
  authMiddleware,
  async (req, res) => {
    try {
      const { 
        query, 
        patientId, 
        tags, 
        dateFrom, 
        dateTo, 
        page = 1, 
        limit = 10 
      } = req.query;
      const userType = req.user.type;
      
      // Only doctors can search across records
      if (userType !== 'DOCTOR') {
        return res.status(403).json({ error: 'Only doctors can search records' });
      }
      
      const Record = (await import('./recordModel.js')).default;
      
      // Build search query
      let searchQuery = { isDeleted: false };
      
      if (patientId) {
        searchQuery.patientId = patientId;
      }
      
      if (query) {
        searchQuery.$or = [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ];
      }
      
      if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim());
        searchQuery.tags = { $in: tagArray };
      }
      
      if (dateFrom || dateTo) {
        searchQuery.createdAt = {};
        if (dateFrom) searchQuery.createdAt.$gte = new Date(dateFrom);
        if (dateTo) searchQuery.createdAt.$lte = new Date(dateTo);
      }
      
      const skip = (page - 1) * limit;
      
      const records = await Record.find(searchQuery)
        .sort({ updatedAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .populate([
          { path: 'patientId', select: 'name email uuid' },
          { path: 'createdBy', select: 'name specialization' },
          { path: 'currentVersionId', select: 'versionNumber contentSize createdAt' }
        ]);
      
      const totalRecords = await Record.countDocuments(searchQuery);
      
      res.json({
        success: true,
        records,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalRecords,
          pages: Math.ceil(totalRecords / limit)
        },
        searchQuery: {
          query,
          patientId,
          tags,
          dateFrom,
          dateTo
        }
      });
      
    } catch (error) {
      res.status(500).json({ 
        error: 'Search failed',
        details: error.message 
      });
    }
  }
);

export default router;