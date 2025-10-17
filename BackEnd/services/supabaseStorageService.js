import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import path from 'path';

/**
 * Supabase Storage Service for Medical Records Backup
 * 
 * Features:
 * - User-specific folder structure: {patientName}/{patientUuid}/records/{recordId}/versions/
 * - Automatic folder creation
 * - Versioned backups with metadata
 * - Encryption support
 * - Audit trail integration
 */
class SupabaseStorageService {
  constructor() {
    this.initialized = false;
    this.initializeClient();
  }
  
  /**
   * Initialize Supabase client (can be called multiple times safely)
   */
  initializeClient() {
    if (this.initialized) return;
    
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin operations
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️ Supabase credentials not configured. Storage service disabled.');
      this.backupEnabled = false;
      return;
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  // Use a dedicated env variable for verification documents bucket, fallback to 'verification-documents'
    this.verificationDocsBucket = process.env.SUPABASE_VERIFICATION_DOCS_BUCKET || 'verification-documents';
    this.medicalRecordsBucket = process.env.SUPABASE_MEDICAL_RECORDS_BUCKET || 'medical-records';
    this.backupEnabled = process.env.ENABLE_SUPABASE_BACKUP === 'true';
    this.initialized = true;
    
    if (this.backupEnabled) {
      this.ensureBucketExists();
    }
  }
  
  /**
   * Upload doctor verification document
   * Folder structure: verification-documents/{doctorId}/{filename}
   */
  async uploadDoctorDocument(doctorId, file, filename, contentType = 'application/octet-stream') {
    if (!this.backupEnabled) {
      console.warn('Supabase backup is disabled');
      return null;
    }
    try {
      const folderPath = `${doctorId}`;
      const filePath = `${folderPath}/${filename}`;
      const { data, error } = await this.supabase.storage
        .from(this.verificationDocsBucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType
        });
      if (error) {
        console.error('Error uploading doctor document:', error);
        throw new Error(`Failed to upload document: ${error.message}`);
      }
      // Generate a signed URL (default: 1 week)
      const { data: signedData, error: signedError } = await this.supabase.storage
        .from(this.verificationDocsBucket)
        .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 1 week expiry
      if (signedError) {
        console.error('Error generating signed URL:', signedError);
        throw new Error(`Failed to generate signed URL: ${signedError.message}`);
      }
      return {
        path: filePath,
        url: signedData.signedUrl,
        doctorId,
        filename,
        uploadedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Doctor document upload failed:', error);
      throw error;
    }
  }

  /**
   * List all documents for a specific doctor
   */
  async listDoctorDocuments(doctorId) {
    if (!this.backupEnabled) {
      console.warn('Supabase backup is disabled');
      return [];
    }
    try {
      const folderPath = `${doctorId}`;
      const { data, error } = await this.supabase.storage
        .from(this.verificationDocsBucket)
        .list(folderPath);
      if (error) {
        console.error('Error listing doctor documents:', error);
        throw new Error(`Failed to list documents: ${error.message}`);
      }
      // For each file, generate a signed URL (1 week expiry)
      const filesWithSignedUrls = await Promise.all(
        data.map(async file => {
          const filePath = `${folderPath}/${file.name}`;
          const { data: signedData, error: signedError } = await this.supabase.storage
            .from(this.verificationDocsBucket)
            .createSignedUrl(filePath, 60 * 60 * 24 * 7);
          return {
            name: file.name,
            path: filePath,
            size: file.metadata?.size || 0,
            lastModified: file.updated_at,
            url: signedData?.signedUrl || null,
            error: signedError?.message || null
          };
        })
      );
      return filesWithSignedUrls;
    } catch (error) {
      console.error('Failed to list doctor documents:', error);
      throw error;
    }
  }

  /**
   * Delete a specific doctor document
   */
  async deleteDoctorDocument(doctorId, filename) {
    if (!this.backupEnabled) {
      console.warn('Supabase backup is disabled');
      return null;
    }
    try {
      const filePath = `${doctorId}/${filename}`;
      const { error } = await this.supabase.storage
        .from(this.verificationDocsBucket)
        .remove([filePath]);
      if (error) {
        console.error('Error deleting doctor document:', error);
        throw new Error(`Failed to delete document: ${error.message}`);
      }
      return { message: 'Document deleted successfully', path: filePath };
    } catch (error) {
      console.error('Failed to delete doctor document:', error);
      throw error;
    }
  }

  /**
   * Ensure Supabase storage bucket exists
   */
  async ensureBucketExists() {
    try {
      // Ensure both buckets exist
      const { data: buckets, error } = await this.supabase.storage.listBuckets();
      if (error) {
        console.error('Error listing buckets:', error);
        return;
      }
      const bucketsToCheck = [this.verificationDocsBucket, this.medicalRecordsBucket];
      for (const bucketName of bucketsToCheck) {
        const bucketExists = buckets.some(bucket => bucket.name === bucketName);
        if (!bucketExists) {
          await this.createBucket(bucketName);
        } else {
          console.log(`✅ Supabase bucket '${bucketName}' exists`);
        }
      }
    } catch (error) {
      console.error('Error checking Supabase buckets:', error);
    }
  }
  
  /**
   * Create Supabase storage bucket
   */
  async createBucket(bucketName) {
    try {
      const { data, error } = await this.supabase.storage.createBucket(bucketName, {
        public: false, // Private bucket - requires authentication
        fileSizeLimit: 52428800, // 50MB limit per file
        allowedMimeTypes: ['application/json', 'text/markdown', 'text/plain']
      });
      if (error) {
        console.error('Error creating bucket:', error);
        throw error;
      }
      console.log(`✅ Created Supabase bucket '${bucketName}'`);
      return data;
    } catch (error) {
      console.error('Error in createBucket:', error);
      throw error;
    }
  }
  
  /**
   * Sanitize user name for folder creation
   * Removes special characters, replaces spaces with underscores
   */
  sanitizeFolderName(name) {
    if (!name) return 'unknown';
    
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
      .replace(/\s+/g, '_')          // Replace spaces with underscores
      .replace(/-+/g, '_')           // Replace hyphens with underscores
      .substring(0, 50);             // Limit length
  }
  
  /**
   * Generate user folder path: {sanitized_name}_{uuid_first_8}
   * Example: john_doe_a1b2c3d4/REC-123_v1_timestamp.json
   */
  generateUserFolderPath(patientName, patientUuid) {
    const sanitizedName = this.sanitizeFolderName(patientName);
    const uuidPrefix = patientUuid.substring(0, 8); // First 8 chars of UUID for uniqueness
    return `${sanitizedName}_${uuidPrefix}`;
  }
  
  /**
   * Generate full backup file path with simplified structure
   * Format: {user_folder}/{recordId}_v{version}_{timestamp}.json
   */
  generateBackupPath(patientName, patientUuid, recordId, versionNumber) {
    const userFolder = this.generateUserFolderPath(patientName, patientUuid);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${recordId}_v${versionNumber}_${timestamp}.json`;
    
    return `${userFolder}/${fileName}`;
  }
  
  /**
   * Create user folder structure if it doesn't exist
   * Note: Supabase Storage automatically creates folders when uploading files
   * This is a helper to check if folder exists by listing files
   */
  async ensureUserFolderExists(patientName, patientUuid) {
    const userFolder = this.generateUserFolderPath(patientName, patientUuid);
    
    try {
      // Check if folder exists by listing files
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(userFolder, {
          limit: 1
        });
      
      if (error && error.message.includes('not found')) {
        console.log(`📁 Creating folder structure for user: ${userFolder}`);
        // Folder will be created automatically on first upload
        return { exists: false, path: userFolder };
      }
      
      console.log(`✅ Folder exists: ${userFolder}`);
      return { exists: true, path: userFolder };
      
    } catch (error) {
      console.error('Error checking folder:', error);
      return { exists: false, path: userFolder };
    }
  }
  
  /**
   * Backup a medical record with its latest version to Supabase Storage
   * 
   * @param {Object} record - Medical record object
   * @param {Object} version - Version object
   * @param {Object} patient - Patient object with name and uuid
   * @param {String} triggeredBy - User who triggered the backup
   * @returns {Object} Backup result with storage path and metadata
   */
  async backupRecord(record, version, patient, triggeredBy) {
    if (!this.initialized) {
      this.initializeClient();
    }
    if (!this.backupEnabled) {
      console.log('⏭️ Supabase backup is disabled');
      return null;
    }
    const startTime = Date.now();
    try {
      if (!patient || !patient.name || !patient.uuid) {
        throw new Error('Patient information (name and uuid) is required for backup');
      }
      await this.ensureUserFolderExists(patient.name, patient.uuid);
      const backupData = {
        backup: {
          timestamp: new Date().toISOString(),
          triggeredBy,
          backupVersion: '1.0',
          storageProvider: 'supabase',
          userFolder: this.generateUserFolderPath(patient.name, patient.uuid)
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
      const backupJson = JSON.stringify(backupData, null, 2);
      const backupBuffer = Buffer.from(backupJson, 'utf-8');
      const backupPath = this.generateBackupPath(
        patient.name,
        patient.uuid,
        record.recordId,
        version.versionNumber
      );
      console.log(`📤 Uploading backup to: ${backupPath}`);
      const { data, error } = await this.supabase.storage
        .from(this.medicalRecordsBucket)
        .upload(backupPath, backupBuffer, {
          contentType: 'application/json',
          upsert: false,
          metadata: {
            recordId: record.recordId,
            versionNumber: version.versionNumber.toString(),
            patientUuid: patient.uuid,
            patientName: patient.name,
            triggeredBy,
            contentHash: version.contentHash,
            originalSize: version.contentSize.toString()
          }
        });
      if (error) {
        console.error('❌ Supabase upload error:', error);
        throw error;
      }
      const duration = Date.now() - startTime;
      console.log(`✅ Backup uploaded successfully in ${duration}ms`);
      console.log(`   Path: ${backupPath}`);
      console.log(`   Size: ${backupBuffer.length} bytes`);
      return {
        success: true,
        storagePath: data.path,
        storageId: data.id,
        storageProvider: 'supabase',
        bucket: this.medicalRecordsBucket,
        userFolder: this.generateUserFolderPath(patient.name, patient.uuid),
        sizeBytes: backupBuffer.length,
        uploadDuration: duration,
        metadata: {
          recordId: record.recordId,
          versionNumber: version.versionNumber,
          patientUuid: patient.uuid,
          contentHash: version.contentHash
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Backup failed after ${duration}ms:`, error);
      return {
        success: false,
        error: error.message,
        duration
      };
    }
  }
  
  /**
   * Retrieve a backup from Supabase Storage
   * 
   * @param {String} patientName - Patient name
   * @param {String} patientUuid - Patient UUID
   * @param {String} recordId - Record ID
   * @param {Number} versionNumber - Version number
   * @returns {Object} Backup data
   */
  async retrieveBackup(patientName, patientUuid, recordId, versionNumber) {
    if (!this.backupEnabled) {
      throw new Error('Supabase backup is disabled');
    }
    
    try {
      const userFolder = this.generateUserFolderPath(patientName, patientUuid);
      const folderPath = `${userFolder}/records/${recordId}/versions`;
      
      // List all versions for this record
      const { data: files, error: listError } = await this.supabase.storage
        .from(this.bucketName)
        .list(folderPath);
      
      if (listError) {
        throw listError;
      }
      
      // Find the file matching the version number
      const versionFile = files.find(file => 
        file.name.startsWith(`v${versionNumber}_`)
      );
      
      if (!versionFile) {
        throw new Error(`Backup not found for version ${versionNumber}`);
      }
      
      const filePath = `${folderPath}/${versionFile.name}`;
      
      // Download the file
      const { data, error: downloadError } = await this.supabase.storage
        .from(this.bucketName)
        .download(filePath);
      
      if (downloadError) {
        throw downloadError;
      }
      
      // Parse JSON
      const backupJson = await data.text();
      const backupData = JSON.parse(backupJson);
      
      console.log(`✅ Retrieved backup from: ${filePath}`);
      
      return backupData;
      
    } catch (error) {
      console.error('Error retrieving backup:', error);
      throw error;
    }
  }
  
  /**
   * List all backups for a specific record
   * 
   * @param {String} patientName - Patient name
   * @param {String} patientUuid - Patient UUID
   * @param {String} recordId - Record ID
   * @returns {Array} List of backup files with metadata
   */
  async listRecordBackups(patientName, patientUuid, recordId) {
    if (!this.backupEnabled) {
      return [];
    }
    
    try {
      const userFolder = this.generateUserFolderPath(patientName, patientUuid);
      
      // List all files in user folder
      const { data: files, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(userFolder, {
          sortBy: { column: 'created_at', order: 'desc' }
        });
      
      if (error) {
        console.error('Error listing backups:', error);
        return [];
      }
      
      // Filter files for this specific record
      const recordFiles = files.filter(file => file.name.startsWith(`${recordId}_`));
      
      return recordFiles.map(file => ({
        name: file.name,
        path: `${userFolder}/${file.name}`,
        size: file.metadata?.size,
        createdAt: file.created_at,
        updatedAt: file.updated_at,
        metadata: file.metadata
      }));
      
    } catch (error) {
      console.error('Error listing record backups:', error);
      return [];
    }
  }
  
  /**
   * List all backup files for a patient
   * 
   * @param {String} patientName - Patient name
   * @param {String} patientUuid - Patient UUID
   * @returns {Array} List of all backup files in patient folder
   */
  async listPatientRecords(patientName, patientUuid) {
    if (!this.backupEnabled) {
      return [];
    }
    
    try {
      const userFolder = this.generateUserFolderPath(patientName, patientUuid);
      
      // List all files directly in user folder
      const { data: files, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(userFolder, {
          sortBy: { column: 'created_at', order: 'desc' }
        });
      
      if (error) {
        console.error('Error listing patient records:', error);
        return [];
      }
      
      return files;
      
    } catch (error) {
      console.error('Error listing patient records:', error);
      return [];
    }
  }
  
  /**
   * Delete a specific backup
   * 
   * @param {String} storagePath - Full storage path to the backup file
   * @returns {Boolean} Success status
   */
  async deleteBackup(storagePath) {
    if (!this.backupEnabled) {
      return false;
    }
    
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([storagePath]);
      
      if (error) {
        console.error('Error deleting backup:', error);
        return false;
      }
      
      console.log(`🗑️ Deleted backup: ${storagePath}`);
      return true;
      
    } catch (error) {
      console.error('Error in deleteBackup:', error);
      return false;
    }
  }
  
  /**
   * Get signed URL for temporary access to a backup
   * 
   * @param {String} storagePath - Full storage path
   * @param {Number} expiresIn - Expiration time in seconds (default: 1 hour)
   * @returns {String} Signed URL
   */
  async getSignedUrl(storagePath, expiresIn = 3600) {
    if (!this.backupEnabled) {
      throw new Error('Supabase backup is disabled');
    }
    
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(storagePath, expiresIn);
      
      if (error) {
        throw error;
      }
      
      return data.signedUrl;
      
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw error;
    }
  }
  
  /**
   * Get storage statistics for a patient
   * 
   * @param {String} patientName - Patient name
   * @param {String} patientUuid - Patient UUID
   * @returns {Object} Storage statistics
   */
  async getPatientStorageStats(patientName, patientUuid) {
    if (!this.backupEnabled) {
      return { totalSize: 0, fileCount: 0, recordCount: 0 };
    }
    
    try {
      const userFolder = this.generateUserFolderPath(patientName, patientUuid);
      
      // List all files recursively
      const { data: files, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(userFolder, {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' }
        });
      
      if (error) {
        console.error('Error getting storage stats:', error);
        return { totalSize: 0, fileCount: 0, recordCount: 0 };
      }
      
      const totalSize = files.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
      
      return {
        totalSize,
        fileCount: files.length,
        recordCount: 0, // Would need to count unique record folders
        userFolder
      };
      
    } catch (error) {
      console.error('Error calculating storage stats:', error);
      return { totalSize: 0, fileCount: 0, recordCount: 0 };
    }
  }
}

// Export singleton instance
export default new SupabaseStorageService();
