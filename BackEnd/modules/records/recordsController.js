import Record from './recordModel.js';
import Version from './versionModel.js';
import Audit from './auditModel.js';
import Patient from '../patient/patientModel.js';
import Doctor from '../doctor/doctorModel.js';
import supabaseStorage from '../../services/supabaseStorageService.js';

class MedicalRecordsController {
  
  // Create a new medical record
  static async createRecord(req, res) {
    const startTime = Date.now();
    
    try {
      const { patientId, title, description, content, tags = [] } = req.body;
      // Find doctor by Firebase UID (uuid)
      let doctor = null;
      if (req.user && req.user.uid) {
        doctor = await Doctor.findOne({ uuid: req.user.uid });
      }
      if (!doctor) {
        return res.status(401).json({ error: 'Doctor profile not found for this user.' });
      }
      const doctorId = doctor._id;

      // Validate patientId is a valid ObjectId
      if (!patientId || !/^[0-9a-fA-F]{24}$/.test(patientId)) {
        await Audit.logAction({
          action: 'CREATE_RECORD',
          resourceType: 'RECORD',
          resourceId: 'N/A',
          patientId,
          performedBy: doctorId,
          success: false,
          errorMessage: 'Invalid patientId',
          duration: Date.now() - startTime
        });
        return res.status(400).json({ error: 'Invalid patientId. Please contact support.' });
      }

      // Validate patient exists
      const patient = await Patient.findById(patientId);
      if (!patient) {
        await Audit.logAction({
          action: 'CREATE_RECORD',
          resourceType: 'RECORD',
          resourceId: 'N/A',
          patientId,
          performedBy: doctorId,
          success: false,
          errorMessage: 'Patient not found',
          duration: Date.now() - startTime
        });
        return res.status(404).json({ error: 'Patient not found' });
      }

      // Create the record
      const record = new Record({
        patientId,
        title,
        description,
        tags,
        createdBy: doctorId,
        lastModifiedBy: doctorId
      });

      await record.save();
      
      // Create initial version if content provided
      let version = null;
      if (content && content.trim().length > 0) {
        version = await Version.createNewVersion(
          record._id,
          content,
          doctorId,
          'Initial version'
        );
        
        // Update record with current version
        record.currentVersionId = version._id;
        await record.save();
      }
      
      // Log audit trail
      await Audit.logAction({
        action: 'CREATE_RECORD',
        resourceType: 'RECORD',
        resourceId: record.recordId,
        patientId,
        performedBy: doctorId,
        details: {
          recordTitle: title,
          tags,
          versionNumber: version ? version.versionNumber : null
        },
        duration: Date.now() - startTime
      });
      
      // Populate and return
      await record.populate([
        { path: 'patientId', select: 'name email uuid' },
        { path: 'createdBy', select: 'name specialization' },
        { path: 'currentVersionId' }
      ]);
      
      res.status(201).json({
        success: true,
        record,
        version
      });
      
    } catch (error) {
      await Audit.logAction({
        action: 'CREATE_RECORD',
        resourceType: 'RECORD',
        resourceId: 'N/A',
        patientId: req.body.patientId,
        performedBy: req.user.id,
        success: false,
        errorMessage: error.message,
        duration: Date.now() - startTime
      });
      
      res.status(500).json({ 
        error: 'Failed to create record',
        details: error.message 
      });
    }
  }
  
  // Get medical records for a patient (with access control)
  static async getPatientRecords(req, res) {
    const startTime = Date.now();
    
    try {
      const { patientId } = req.params;
      const { page = 1, limit = 10, includeDeleted = false } = req.query;
      let userId = req.user.id;
      let performedBy = null;
      let userType = req.user.type || req.user.role || '';
      if (typeof userType === 'string') userType = userType.toUpperCase();
      // If doctor, resolve ObjectId
      if (userType === 'DOCTOR' && req.user && req.user.uid) {
        const doctor = await Doctor.findOne({ uuid: req.user.uid });
        if (doctor) performedBy = doctor._id;
      } else if (userType === 'PATIENT') {
        performedBy = userId;
      }

      // Access control
      if (userType === 'PATIENT' && userId !== patientId) {
        await Audit.logAction({
          action: 'ACCESS_PATIENT_RECORDS',
          resourceType: 'PATIENT',
          resourceId: patientId,
          patientId,
          performedBy,
          performedByType: userType,
          success: false,
          errorMessage: 'Unauthorized access attempt',
          duration: Date.now() - startTime
        });
        return res.status(403).json({ error: 'Unauthorized access' });
      }
      
      // Build query
      let query = { patientId };
      if (!includeDeleted || userType === 'PATIENT') {
        query.isDeleted = false; // Patients can't see deleted records
      }
      
      const skip = (page - 1) * limit;
      
      const records = await Record.find(query)
        .sort({ updatedAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .populate([
          { path: 'patientId', select: 'name email uuid' },
          { path: 'createdBy', select: 'name specialization' },
          { path: 'lastModifiedBy', select: 'name specialization' },
          { path: 'currentVersionId', select: 'versionNumber contentSize createdAt' }
        ]);
      
      const totalRecords = await Record.countDocuments(query);
      
      // Log audit trail
      await Audit.logAction({
        action: 'ACCESS_PATIENT_RECORDS',
        resourceType: 'PATIENT',
        resourceId: patientId,
        patientId,
        performedBy,
        performedByType: userType,
        details: {
          recordsReturned: records.length,
          page: parseInt(page),
          limit: parseInt(limit)
        },
        duration: Date.now() - startTime
      });
      
      res.json({
        success: true,
        records,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalRecords,
          pages: Math.ceil(totalRecords / limit)
        }
      });
      
    } catch (error) {
      await Audit.logAction({
        action: 'ACCESS_PATIENT_RECORDS',
        resourceType: 'PATIENT',
        resourceId: req.params.patientId,
        patientId: req.params.patientId,
        performedBy: req.user.id,
        performedByType: req.user.type,
        success: false,
        errorMessage: error.message,
        duration: Date.now() - startTime
      });
      
      res.status(500).json({ 
        error: 'Failed to fetch records',
        details: error.message 
      });
    }
  }
  
  // Get a specific record with latest version
  static async getRecord(req, res) {
    const startTime = Date.now();
    
    try {
      const { recordId } = req.params;
      let userId = req.user.id;
      let performedBy = null;
      let userType = req.user.type || req.user.role || '';
      if (typeof userType === 'string') userType = userType.toUpperCase();
      // If doctor, resolve ObjectId
      if (userType === 'DOCTOR' && req.user && req.user.uid) {
        const doctor = await Doctor.findOne({ uuid: req.user.uid });
        if (doctor) performedBy = doctor._id;
      } else if (userType === 'PATIENT') {
        performedBy = userId;
      }

      const record = await Record.findOne({ recordId, isDeleted: false })
        .populate([
          { path: 'patientId', select: 'name email uuid dob sex' },
          { path: 'createdBy', select: 'name specialization' },
          { path: 'lastModifiedBy', select: 'name specialization' },
          { path: 'currentVersionId' }
        ]);

      if (!record) {
        return res.status(404).json({ error: 'Record not found' });
      }

      // Access control
      if (userType === 'PATIENT' && userId !== record.patientId._id.toString()) {
        await Audit.logAction({
          action: 'READ_RECORD',
          resourceType: 'RECORD',
          resourceId: recordId,
          patientId: record.patientId._id,
          performedBy,
          performedByType: userType,
          success: false,
          errorMessage: 'Unauthorized access attempt',
          duration: Date.now() - startTime
        });
        return res.status(403).json({ error: 'Unauthorized access' });
      }
      
      // Get latest version content
      let latestVersion = null;
      if (record.currentVersionId) {
        latestVersion = await Version.findById(record.currentVersionId)
          .populate('createdBy', 'name specialization');
      }
      
      // Log audit trail
      await Audit.logAction({
        action: 'READ_RECORD',
        resourceType: 'RECORD',
        resourceId: recordId,
        patientId: record.patientId._id,
        performedBy,
        performedByType: userType,
        details: {
          recordTitle: record.title,
          versionNumber: latestVersion ? latestVersion.versionNumber : null
        },
        duration: Date.now() - startTime
      });
      
      res.json({
        success: true,
        record,
        latestVersion
      });
      
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch record',
        details: error.message 
      });
    }
  }
  
  // Update record content (creates new version)
  static async updateRecord(req, res) {
    const startTime = Date.now();
    
    try {
      const { recordId } = req.params;
      const { content, changeDescription = '', title, description, tags } = req.body;
      // Find doctor by Firebase UID (uuid)
      let doctor = null;
      if (req.user && req.user.uid) {
        doctor = await Doctor.findOne({ uuid: req.user.uid });
      }
      if (!doctor) {
        return res.status(401).json({ error: 'Doctor profile not found for this user.' });
      }
      const doctorId = doctor._id;
      // Robust user type/role check
      let userType = req.user.type || req.user.role || '';
      console.log('[MedicalRecordsController.updateRecord] userType:', userType);
      if (typeof userType === 'string') userType = userType.toUpperCase();
      if (userType !== 'DOCTOR') {
        return res.status(403).json({ error: 'Only doctors can edit records' });
      }

      const record = await Record.findOne({ recordId, isDeleted: false });
      if (!record) {
        return res.status(404).json({ error: 'Record not found' });
      }
      
      // Get previous version for comparison
      const previousVersion = record.currentVersionId ? 
        await Version.findById(record.currentVersionId) : null;
      
      // Update record metadata if provided
      let recordUpdated = false;
      if (title && title !== record.title) {
        record.title = title;
        recordUpdated = true;
      }
      if (description !== undefined && description !== record.description) {
        record.description = description;
        recordUpdated = true;
      }
      if (tags && JSON.stringify(tags) !== JSON.stringify(record.tags)) {
        record.tags = tags;
        recordUpdated = true;
      }
      
      if (recordUpdated) {
        record.lastModifiedBy = doctorId;
        await record.save();
      }
      
      // Create new version if content provided and different
      let newVersion = null;
      if (content && content.trim().length > 0) {
        if (!previousVersion || content !== previousVersion.content) {
          newVersion = await Version.createNewVersion(
            record._id,
            content,
            doctorId,
            changeDescription
          );
          // Update record with new current version
          record.currentVersionId = newVersion._id;
          record.lastModifiedBy = doctorId;
          await record.save();
        }
      }
      
      // Log audit trail
      await Audit.logAction({
        action: 'UPDATE_RECORD',
        resourceType: 'RECORD',
        resourceId: recordId,
        patientId: record.patientId,
        performedBy: doctorId,
        details: {
          recordTitle: record.title,
          versionNumber: newVersion ? newVersion.versionNumber : null,
          changeDescription,
          recordMetadataUpdated: recordUpdated,
          contentUpdated: !!newVersion
        },
        duration: Date.now() - startTime
      });
      
      // Trigger Supabase backup if content was updated
      if (newVersion) {
        try {
          // Fetch patient for folder structure
          const patient = await Patient.findById(record.patientId);
          if (patient) {
            await supabaseStorage.backupRecord(record, newVersion, patient, doctorId);
          }
        } catch (backupError) {
          console.error('Supabase backup failed:', backupError);
          // Don't fail the main operation if backup fails
        }
      }
      
      await record.populate([
        { path: 'patientId', select: 'name email uuid' },
        { path: 'lastModifiedBy', select: 'name specialization' }
      ]);

      res.json({
        success: true,
        record,
        newVersion,
        recordUpdated,
        contentUpdated: !!newVersion
      });
      
    } catch (error) {
      // Try to resolve doctorId for audit log, fallback to null
      let doctorId = null;
      if (req.user && req.user.uid) {
        const doctor = await Doctor.findOne({ uuid: req.user.uid });
        if (doctor) doctorId = doctor._id;
      }
      await Audit.logAction({
        action: 'UPDATE_RECORD',
        resourceType: 'RECORD',
        resourceId: req.params.recordId,
        patientId: null, // We might not have access to this on error
        performedBy: doctorId,
        success: false,
        errorMessage: error.message,
        duration: Date.now() - startTime
      });
      res.status(500).json({ 
        error: 'Failed to update record',
        details: error.message 
      });
    }
  }
  
  // Soft delete a record
  static async deleteRecord(req, res) {
    const startTime = Date.now();
    
    try {
      const { recordId } = req.params;
      const doctorId = req.user.id;
      const userType = req.user.type;
      
      // Only doctors can delete
      if (userType !== 'DOCTOR') {
        return res.status(403).json({ error: 'Only doctors can delete records' });
      }
      
      const record = await Record.findOne({ recordId, isDeleted: false });
      if (!record) {
        return res.status(404).json({ error: 'Record not found' });
      }
      
      // Soft delete
      await record.softDelete(doctorId);
      
      // Log audit trail
      await Audit.logAction({
        action: 'DELETE_RECORD',
        resourceType: 'RECORD',
        resourceId: recordId,
        patientId: record.patientId,
        performedBy: doctorId,
        details: {
          recordTitle: record.title
        },
        duration: Date.now() - startTime
      });
      
      res.json({
        success: true,
        message: 'Record deleted successfully'
      });
      
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to delete record',
        details: error.message 
      });
    }
  }
  
  // Get version history for a record
  static async getVersionHistory(req, res) {
    const startTime = Date.now();

    try {
      const { recordId } = req.params;
      const { limit = 10 } = req.query;
      let userId = req.user.id;
      let userType = req.user.type;

      const record = await Record.findOne({ recordId, isDeleted: false });
      if (!record) {
        return res.status(404).json({ error: 'Record not found' });
      }

      // Access control
      if (userType === 'PATIENT' && userId !== record.patientId.toString()) {
        return res.status(403).json({ error: 'Unauthorized access' });
      }

      // Fix: If doctor, get Doctor ObjectId for audit log
      let performedBy = userId;
      let performedByType = userType;
      if ((userType === 'DOCTOR' || userType === 'doctor') && req.user && req.user.uid) {
        const doctor = await Doctor.findOne({ uuid: req.user.uid });
        if (doctor) {
          performedBy = doctor._id;
          performedByType = 'DOCTOR';
        }
      }

      const versions = await Version.getVersionHistory(record._id, parseInt(limit));

      // Log audit trail
      await Audit.logAction({
        action: 'VIEW_VERSION',
        resourceType: 'RECORD',
        resourceId: recordId,
        patientId: record.patientId,
        performedBy,
        performedByType,
        details: {
          recordTitle: record.title,
          versionsReturned: versions.length
        },
        duration: Date.now() - startTime
      });

      res.json({
        success: true,
        versions
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch version history',
        details: error.message
      });
    }
  }
  
  // Get specific version content
  static async getVersion(req, res) {
    const startTime = Date.now();
    
    try {
      const { recordId, versionNumber } = req.params;
      const userId = req.user.id;
      const userType = req.user.type;
      
      const record = await Record.findOne({ recordId, isDeleted: false });
      if (!record) {
        return res.status(404).json({ error: 'Record not found' });
      }
      
      // Access control
      if (userType === 'PATIENT' && userId !== record.patientId.toString()) {
        return res.status(403).json({ error: 'Unauthorized access' });
      }
      
      const version = await Version.findOne({ 
        recordId: record._id, 
        versionNumber: parseInt(versionNumber) 
      }).populate('createdBy', 'name specialization');
      
      if (!version) {
        return res.status(404).json({ error: 'Version not found' });
      }
      
      // Verify content integrity
      const isIntegrityValid = version.verifyIntegrity();
      
      // Log audit trail
      await Audit.logAction({
        action: 'VIEW_VERSION',
        resourceType: 'VERSION',
        resourceId: version.versionId,
        patientId: record.patientId,
        performedBy: userId,
        performedByType: userType,
        details: {
          recordTitle: record.title,
          versionNumber: version.versionNumber,
          integrityCheck: isIntegrityValid
        },
        duration: Date.now() - startTime
      });
      
      res.json({
        success: true,
        version,
        integrityValid: isIntegrityValid
      });
      
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch version',
        details: error.message 
      });
    }
  }
  
  // Get audit trail for a record
  static async getRecordAuditTrail(req, res) {
    try {
      const { recordId } = req.params;
      const { limit = 50 } = req.query;
      const userType = req.user.type;
      
      // Only doctors can view audit trails
      if (userType !== 'DOCTOR') {
        return res.status(403).json({ error: 'Only doctors can view audit trails' });
      }
      
      const record = await Record.findOne({ recordId });
      if (!record) {
        return res.status(404).json({ error: 'Record not found' });
      }
      
      const auditTrail = await Audit.getRecordAuditTrail(recordId, { limit: parseInt(limit) });
      
      res.json({
        success: true,
        auditTrail
      });
      
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch audit trail',
        details: error.message 
      });
    }
  }
}

export default MedicalRecordsController;