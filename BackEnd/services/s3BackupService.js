import AWS from 'aws-sdk';
import crypto from 'crypto';
import path from 'path';

class S3BackupService {
  constructor() {
    // Initialize S3 client
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    this.bucketName = process.env.S3_MEDICAL_RECORDS_BUCKET || 'jeewaka-medical-records';
    this.backupEnabled = process.env.ENABLE_S3_BACKUP === 'true';
    
    if (this.backupEnabled) {
      this.ensureBucketExists();
    }
  }
  
  // Ensure S3 bucket exists with versioning enabled
  async ensureBucketExists() {
    try {
      // Check if bucket exists
      await this.s3.headBucket({ Bucket: this.bucketName }).promise();
      console.log(`S3 bucket ${this.bucketName} exists`);
      
      // Enable versioning
      await this.s3.putBucketVersioning({
        Bucket: this.bucketName,
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      }).promise();
      
      console.log(`Versioning enabled for bucket ${this.bucketName}`);
      
    } catch (error) {
      if (error.statusCode === 404) {
        // Create bucket if it doesn't exist
        await this.createBucket();
      } else {
        console.error('Error checking S3 bucket:', error);
      }
    }
  }
  
  // Create S3 bucket with proper configuration
  async createBucket() {
    try {
      await this.s3.createBucket({ 
        Bucket: this.bucketName,
        CreateBucketConfiguration: {
          LocationConstraint: process.env.AWS_REGION || 'us-east-1'
        }
      }).promise();
      
      // Enable versioning
      await this.s3.putBucketVersioning({
        Bucket: this.bucketName,
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      }).promise();
      
      // Set lifecycle policy for old versions
      await this.s3.putBucketLifecycleConfiguration({
        Bucket: this.bucketName,
        LifecycleConfiguration: {
          Rules: [{
            ID: 'DeleteOldVersions',
            Status: 'Enabled',
            Filter: { Prefix: '' },
            NoncurrentVersionExpiration: {
              NoncurrentDays: 365 // Keep old versions for 1 year
            }
          }]
        }
      }).promise();
      
      console.log(`Created S3 bucket ${this.bucketName} with versioning and lifecycle policy`);
      
    } catch (error) {
      console.error('Error creating S3 bucket:', error);
      throw error;
    }
  }
  
  // Backup a record with its latest version
  async backupRecord(record, version, triggeredBy) {
    if (!this.backupEnabled) {
      console.log('S3 backup is disabled');
      return null;
    }
    
    const startTime = Date.now();
    
    try {
      // Get patient info for backup metadata
      const patient = await Patient.findById(record.patientId);
      if (!patient) {
        throw new Error('Patient not found for backup');
      }
      
      // Create backup object
      const backupData = {
        backup: {
          timestamp: new Date().toISOString(),
          triggeredBy,
          backupVersion: '1.0'
        },
        record: {
          recordId: record.recordId,
          title: record.title,
          description: record.description,
          tags: record.tags,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          createdBy: record.createdBy,
          lastModifiedBy: record.lastModifiedBy
        },
        patient: {
          uuid: patient.uuid,
          name: patient.name,
          email: patient.email,
          dob: patient.dob,
          sex: patient.sex
        },
        version: {
          versionId: version.versionId,
          versionNumber: version.versionNumber,
          content: version.content,
          contentHash: version.contentHash,
          contentSize: version.contentSize,
          changeDescription: version.changeDescription,
          createdAt: version.createdAt,
          createdBy: version.createdBy,
          isApproved: version.isApproved,
          approvedBy: version.approvedBy,
          approvedAt: version.approvedAt
        }
      };
      
      // Generate backup key
      const backupKey = this.generateBackupKey(patient.uuid, record.recordId, version.versionNumber);
      
      // Upload to S3
      const uploadParams = {
        Bucket: this.bucketName,
        Key: backupKey,
        Body: JSON.stringify(backupData, null, 2),
        ContentType: 'application/json',
        Metadata: {
          'patient-uuid': patient.uuid,
          'record-id': record.recordId,
          'version-number': version.versionNumber.toString(),
          'backup-timestamp': new Date().toISOString(),
          'triggered-by': triggeredBy.toString()
        },
        ServerSideEncryption: 'AES256'
      };
      
      const result = await this.s3.upload(uploadParams).promise();
      
      // Log successful backup
      await Audit.logAction({
        action: 'BACKUP_RECORD',
        resourceType: 'RECORD',
        resourceId: record.recordId,
        patientId: record.patientId,
        performedBy: triggeredBy,
        details: {
          recordTitle: record.title,
          versionNumber: version.versionNumber,
          s3Key: backupKey,
          s3VersionId: result.VersionId,
          backupSize: Buffer.byteLength(JSON.stringify(backupData), 'utf8')
        },
        duration: Date.now() - startTime
      });
      
      console.log(`Successfully backed up record ${record.recordId} v${version.versionNumber} to S3`);
      
      return {
        success: true,
        s3Key: backupKey,
        versionId: result.VersionId,
        location: result.Location,
        etag: result.ETag
      };
      
    } catch (error) {
      console.error('S3 backup failed:', error);
      
      // Log failed backup
      await Audit.logAction({
        action: 'BACKUP_RECORD',
        resourceType: 'RECORD',
        resourceId: record.recordId,
        patientId: record.patientId,
        performedBy: triggeredBy,
        success: false,
        errorMessage: error.message,
        details: {
          recordTitle: record.title,
          versionNumber: version ? version.versionNumber : null
        },
        duration: Date.now() - startTime
      });
      
      throw error;
    }
  }
  
  // Backup file attachment
  async backupAttachment(record, attachment, triggeredBy) {
    if (!this.backupEnabled) {
      return null;
    }
    
    try {
      // Generate attachment backup key
      const attachmentKey = this.generateAttachmentKey(
        record.patientId, 
        record.recordId, 
        attachment.fileName
      );
      
      // If the attachment is already stored elsewhere, we'd copy it to S3
      // For now, we'll store the attachment metadata
      const attachmentBackup = {
        backup: {
          timestamp: new Date().toISOString(),
          triggeredBy,
          type: 'attachment'
        },
        record: {
          recordId: record.recordId,
          title: record.title
        },
        attachment: {
          fileName: attachment.fileName,
          originalUrl: attachment.fileUrl,
          fileSize: attachment.fileSize,
          mimeType: attachment.mimeType,
          uploadedAt: attachment.uploadedAt,
          uploadedBy: attachment.uploadedBy
        }
      };
      
      const uploadParams = {
        Bucket: this.bucketName,
        Key: attachmentKey,
        Body: JSON.stringify(attachmentBackup, null, 2),
        ContentType: 'application/json',
        Metadata: {
          'record-id': record.recordId,
          'attachment-name': attachment.fileName,
          'backup-timestamp': new Date().toISOString()
        },
        ServerSideEncryption: 'AES256'
      };
      
      const result = await this.s3.upload(uploadParams).promise();
      
      return {
        success: true,
        s3Key: attachmentKey,
        versionId: result.VersionId
      };
      
    } catch (error) {
      console.error('Attachment backup failed:', error);
      throw error;
    }
  }
  
  // Restore a record from S3 backup
  async restoreRecord(patientUuid, recordId, versionNumber) {
    if (!this.backupEnabled) {
      throw new Error('S3 backup is not enabled');
    }
    
    try {
      const backupKey = this.generateBackupKey(patientUuid, recordId, versionNumber);
      
      const params = {
        Bucket: this.bucketName,
        Key: backupKey
      };
      
      const result = await this.s3.getObject(params).promise();
      const backupData = JSON.parse(result.Body.toString());
      
      return {
        success: true,
        backupData,
        metadata: result.Metadata,
        lastModified: result.LastModified,
        versionId: result.VersionId
      };
      
    } catch (error) {
      if (error.statusCode === 404) {
        throw new Error(`Backup not found for record ${recordId} version ${versionNumber}`);
      }
      throw error;
    }
  }
  
  // List all backups for a patient
  async listPatientBackups(patientUuid, options = {}) {
    if (!this.backupEnabled) {
      return [];
    }
    
    try {
      const prefix = `patients/${patientUuid}/records/`;
      const { maxKeys = 100 } = options;
      
      const params = {
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys
      };
      
      const result = await this.s3.listObjectsV2(params).promise();
      
      return result.Contents.map(obj => ({
        key: obj.Key,
        lastModified: obj.LastModified,
        size: obj.Size,
        etag: obj.ETag,
        storageClass: obj.StorageClass
      }));
      
    } catch (error) {
      console.error('Error listing patient backups:', error);
      throw error;
    }
  }
  
  // Export patient's complete medical history
  async exportPatientHistory(patientUuid, options = {}) {
    if (!this.backupEnabled) {
      throw new Error('S3 backup is not enabled');
    }
    
    try {
      const { format = 'json', includeAttachments = false } = options;
      
      // Get patient info
      const patient = await Patient.findOne({ uuid: patientUuid });
      if (!patient) {
        throw new Error('Patient not found');
      }
      
      // Get all records for patient
      const records = await Record.findActive({ patientId: patient._id })
        .populate('createdBy', 'name specialization')
        .populate('lastModifiedBy', 'name specialization');
      
      // Get all versions for each record
      const completeHistory = await Promise.all(
        records.map(async (record) => {
          const versions = await Version.find({ recordId: record._id })
            .sort({ versionNumber: -1 })
            .populate('createdBy', 'name specialization');
          
          return {
            record: record.toObject(),
            versions: versions.map(v => v.toObject())
          };
        })
      );
      
      // Create export package
      const exportData = {
        export: {
          timestamp: new Date().toISOString(),
          format,
          patientUuid,
          totalRecords: records.length,
          totalVersions: completeHistory.reduce((sum, r) => sum + r.versions.length, 0)
        },
        patient: patient.toObject(),
        medicalHistory: completeHistory
      };
      
      // Generate export key
      const exportKey = `exports/${patientUuid}/complete-history-${Date.now()}.json`;
      
      // Upload export to S3
      const uploadParams = {
        Bucket: this.bucketName,
        Key: exportKey,
        Body: JSON.stringify(exportData, null, 2),
        ContentType: 'application/json',
        Metadata: {
          'export-type': 'complete-history',
          'patient-uuid': patientUuid,
          'export-timestamp': new Date().toISOString(),
          'total-records': records.length.toString()
        },
        ServerSideEncryption: 'AES256'
      };
      
      const result = await this.s3.upload(uploadParams).promise();
      
      return {
        success: true,
        exportKey,
        downloadUrl: result.Location,
        versionId: result.VersionId,
        totalRecords: records.length,
        exportSize: Buffer.byteLength(JSON.stringify(exportData), 'utf8')
      };
      
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }
  
  // Generate backup key for S3
  generateBackupKey(patientUuid, recordId, versionNumber) {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `patients/${patientUuid}/records/${recordId}/versions/${versionNumber}/backup-${timestamp}.json`;
  }
  
  // Generate attachment key for S3
  generateAttachmentKey(patientId, recordId, fileName) {
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    return `patients/${patientId}/records/${recordId}/attachments/${timestamp}-${sanitizedFileName}`;
  }
  
  // Get backup statistics
  async getBackupStatistics() {
    if (!this.backupEnabled) {
      return { enabled: false };
    }
    
    try {
      const params = {
        Bucket: this.bucketName
      };
      
      const result = await this.s3.listObjectsV2(params).promise();
      
      const stats = {
        enabled: true,
        totalObjects: result.KeyCount || 0,
        totalSize: result.Contents ? 
          result.Contents.reduce((sum, obj) => sum + obj.Size, 0) : 0,
        lastBackup: result.Contents && result.Contents.length > 0 ? 
          Math.max(...result.Contents.map(obj => new Date(obj.LastModified))) : null,
        bucketName: this.bucketName
      };
      
      return stats;
    } catch (error) {
      console.error('Error getting backup statistics:', error);
      return { enabled: true, error: error.message };
    }
  }
  
  // Clean up old backups based on retention policy
  async cleanupOldBackups(retentionDays = 365) {
    if (!this.backupEnabled) {
      return { message: 'Backup not enabled' };
    }
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      const params = {
        Bucket: this.bucketName
      };
      
      const result = await this.s3.listObjectsV2(params).promise();
      const objectsToDelete = result.Contents.filter(obj => 
        new Date(obj.LastModified) < cutoffDate
      );
      
      if (objectsToDelete.length === 0) {
        return { message: 'No old backups to delete' };
      }
      
      const deleteParams = {
        Bucket: this.bucketName,
        Delete: {
          Objects: objectsToDelete.map(obj => ({ Key: obj.Key }))
        }
      };
      
      const deleteResult = await this.s3.deleteObjects(deleteParams).promise();
      
      return {
        deletedCount: deleteResult.Deleted.length,
        errors: deleteResult.Errors.length,
        message: `Cleaned up ${deleteResult.Deleted.length} old backups`
      };
      
    } catch (error) {
      console.error('Cleanup failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
const s3BackupService = new S3BackupService();
export default s3BackupService;