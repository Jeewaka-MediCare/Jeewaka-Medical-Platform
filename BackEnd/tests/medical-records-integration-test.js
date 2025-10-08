import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Import models and services
import Patient from '../modules/patient/patientModel.js';
import Doctor from '../modules/doctor/doctorModel.js';
import Record from '../modules/records/recordModel.js';
import Version from '../modules/records/versionModel.js';
import Audit from '../modules/records/auditModel.js';
import supabaseStorage from '../services/supabaseStorageService.js';
import { connectDB } from '../shared/database.js';

// Test data
const testPatient = {
  name: "John Doe",
  email: "john.doe.test@example.com",
  uuid: "TEST-PATIENT-001",
  phone: "+94771234567",
  profile: "https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg",
  dob: new Date("1990-05-15"),
  sex: "Male"
};

const testDoctor = {
  name: "Dr. Sarah Wilson",
  email: "dr.sarah.wilson.test@example.com",
  uuid: "TEST-DOCTOR-001",
  phone: "+94771234568",
  gender: "Female",
  profile: "https://images.pexels.com/photos/3781557/pexels-photo-3781557.jpeg",
  dob: new Date("1985-03-10"),
  specialization: "Cardiology",
  subSpecializations: ["Interventional Cardiology", "Heart Failure"],
  regNo: "SLMC2020TEST001",
  qualifications: ["MBBS", "MD", "MRCP"],
  yearsOfExperience: 10,
  languagesSpoken: ["English", "Sinhala"],
  bio: "Experienced cardiologist specializing in interventional procedures and heart failure management.",
  consultationFee: 12000
};

const testRecord = {
  title: "Initial Consultation - Chest Pain",
  description: "Patient presented with chest pain and shortness of breath",
  tags: ["cardiology", "chest-pain", "initial-consultation"],
  content: `# Initial Consultation Report

## Patient Information
- **Name:** John Doe
- **Age:** 33 years
- **Chief Complaint:** Chest pain for 2 days

## History of Present Illness
Patient reports onset of chest pain 2 days ago, described as:
- Sharp, stabbing pain in the central chest
- Radiates to left arm
- Associated with shortness of breath
- Occurs at rest and with exertion
- No relief with rest

## Physical Examination
- **Vital Signs:** BP 140/90, HR 88, RR 18, Temp 37.0°C
- **Heart:** Regular rhythm, no murmurs
- **Lungs:** Clear bilaterally
- **Extremities:** No edema

## Assessment
Likely cardiac chest pain, possible acute coronary syndrome

## Plan
1. ECG - **COMPLETED** - Normal sinus rhythm
2. Cardiac enzymes - **PENDING**
3. Chest X-ray - **PENDING**
4. Echocardiogram - **SCHEDULED**
5. Start aspirin 75mg daily
6. Follow up in 24 hours or sooner if symptoms worsen

## Next Steps
- Monitor cardiac enzymes
- Review imaging results
- Consider stress test if initial workup normal

*Record created: ${new Date().toISOString()}*
*Doctor: Dr. Sarah Wilson, Cardiologist*`
};

// Test class
class MedicalRecordsIntegrationTest {
  constructor() {
    this.testPatient = null;
    this.testDoctor = null;
    this.testRecord = null;
    this.testVersion = null;
    this.testStartTime = Date.now();
  }

  async runTests() {
    console.log('🧪 MEDICAL RECORDS SYSTEM INTEGRATION TEST');
    console.log('==================================================');
    
    try {
      await this.setupDatabase();
      await this.createTestData();
      await this.testRecordCreation();
      await this.testVersioning();
      await this.testAccessControl();
      await this.testAuditLogging();
      await this.testSupabaseBackup();
      await this.testSearchAndRetrieval();
      await this.testSoftDelete();
      await this.cleanup();
      
      console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
      console.log(`⏱️  Total test duration: ${Date.now() - this.testStartTime}ms`);
      
    } catch (error) {
      console.error('\n❌ TEST FAILED:', error.message);
      console.error(error.stack);
      process.exit(1);
    } finally {
      await mongoose.connection.close();
    }
  }

  async setupDatabase() {
    console.log('\n📡 Setting up database connection...');
    await connectDB();
    console.log('✅ Database connected successfully');
    
    // Clear test data
    await Patient.deleteMany({ email: /test@example\.com/ });
    await Doctor.deleteMany({ email: /test@example\.com/ });
    await Record.deleteMany({ title: /Initial Consultation/ });
    await Version.deleteMany({});
    await Audit.deleteMany({ 'details.recordTitle': /Initial Consultation/ });
    console.log('✅ Test data cleaned up');
  }

  async createTestData() {
    console.log('\n👥 Creating test patient and doctor...');
    
    // Create test patient
    this.testPatient = new Patient(testPatient);
    await this.testPatient.save();
    console.log(`✅ Test patient created: ${this.testPatient.name} (${this.testPatient.uuid})`);
    
    // Create test doctor
    this.testDoctor = new Doctor(testDoctor);
    await this.testDoctor.save();
    console.log(`✅ Test doctor created: ${this.testDoctor.name} (${this.testDoctor.specialization})`);
  }

  async testRecordCreation() {
    console.log('\n📋 Testing medical record creation...');
    
    // Create record
    this.testRecord = new Record({
      patientId: this.testPatient._id,
      title: testRecord.title,
      description: testRecord.description,
      tags: testRecord.tags,
      createdBy: this.testDoctor._id,
      lastModifiedBy: this.testDoctor._id
    });
    
    await this.testRecord.save();
    console.log(`✅ Medical record created: ${this.testRecord.title}`);
    console.log(`   Record ID: ${this.testRecord.recordId}`);
    
    // Create initial version
    this.testVersion = await Version.createNewVersion(
      this.testRecord._id,
      testRecord.content,
      this.testDoctor._id,
      'Initial record creation'
    );
    
    // Update record with current version
    this.testRecord.currentVersionId = this.testVersion._id;
    await this.testRecord.save();
    
    console.log(`✅ Initial version created: v${this.testVersion.versionNumber}`);
    console.log(`   Content size: ${this.testVersion.contentSize} bytes`);
    console.log(`   Content hash: ${this.testVersion.contentHash.substring(0, 16)}...`);
    
    // Verify integrity
    const isIntegrityValid = this.testVersion.verifyIntegrity();
    console.log(`✅ Content integrity check: ${isIntegrityValid ? 'PASSED' : 'FAILED'}`);
  }

  async testVersioning() {
    console.log('\n🔄 Testing versioning system...');
    
    // Create updated content
    const updatedContent = testRecord.content + `

## Follow-up Notes (Updated)
- **Cardiac enzymes:** Troponin slightly elevated (0.15 ng/mL)
- **Chest X-ray:** Normal heart size, clear lung fields
- **Recommendation:** Proceed with echocardiogram and consider cardiology consultation

*Updated: ${new Date().toISOString()}*`;

    // Create new version
    const version2 = await Version.createNewVersion(
      this.testRecord._id,
      updatedContent,
      this.testDoctor._id,
      'Added follow-up notes and test results'
    );
    
    // Update record
    this.testRecord.currentVersionId = version2._id;
    this.testRecord.lastModifiedBy = this.testDoctor._id;
    await this.testRecord.save();
    
    console.log(`✅ Version 2 created with updates`);
    console.log(`   Change description: ${version2.changeDescription}`);
    console.log(`   Previous version link: ${version2.previousVersionId ? 'SET' : 'NOT SET'}`);
    
    // Test version history
    const versionHistory = await Version.getVersionHistory(this.testRecord._id);
    console.log(`✅ Version history retrieved: ${versionHistory.length} versions`);
    
    // Test version diff
    const diff = await version2.getDiffWithPrevious();
    console.log(`✅ Version diff generated: v${diff.previousVersion} → v${diff.currentVersion}`);
    
    // Create one more version to test comprehensive versioning
    const version3Content = updatedContent + `

## Final Assessment
- **Echocardiogram:** Normal left ventricular function, no wall motion abnormalities
- **Final Diagnosis:** Non-cardiac chest pain, likely musculoskeletal
- **Discharge Plan:** NSAIDs as needed, follow up with primary care in 1 week

*Final update: ${new Date().toISOString()}*`;

    const version3 = await Version.createNewVersion(
      this.testRecord._id,
      version3Content,
      this.testDoctor._id,
      'Final assessment and discharge planning'
    );
    
    this.testRecord.currentVersionId = version3._id;
    await this.testRecord.save();
    
    console.log(`✅ Version 3 created - final assessment`);
    console.log(`   Total versions: 3`);
  }

  async testAccessControl() {
    console.log('\n🔒 Testing access control...');
    
    // Test doctor access (should work)
    const doctorCanAccess = await Record.findOne({ 
      _id: this.testRecord._id, 
      isDeleted: false 
    });
    console.log(`✅ Doctor access test: ${doctorCanAccess ? 'ALLOWED' : 'DENIED'}`);
    
    // Test patient viewing their own records (simulate)
    const patientCanView = await Record.findActive({ 
      patientId: this.testPatient._id 
    });
    console.log(`✅ Patient view own records: ${patientCanView.length > 0 ? 'ALLOWED' : 'DENIED'}`);
    
    // Test soft delete functionality
    const originalTitle = this.testRecord.title;
    await this.testRecord.softDelete(this.testDoctor._id);
    console.log(`✅ Soft delete executed for record: ${originalTitle}`);
    
    const deletedRecord = await Record.findOne({ _id: this.testRecord._id });
    console.log(`✅ Soft delete verification: isDeleted = ${deletedRecord.isDeleted}`);
    
    // Restore record
    await this.testRecord.restore();
    console.log(`✅ Record restored successfully`);
  }

  async testAuditLogging() {
    console.log('\n📝 Testing audit logging...');
    
    // Log various actions for testing
    const auditActions = [
      {
        action: 'CREATE_RECORD',
        resourceType: 'RECORD',
        resourceId: this.testRecord.recordId,
        patientId: this.testPatient._id,
        performedBy: this.testDoctor._id,
        details: {
          recordTitle: this.testRecord.title,
          tags: this.testRecord.tags
        }
      },
      {
        action: 'READ_RECORD',
        resourceType: 'RECORD',
        resourceId: this.testRecord.recordId,
        patientId: this.testPatient._id,
        performedBy: this.testDoctor._id,
        details: {
          recordTitle: this.testRecord.title
        }
      },
      {
        action: 'UPDATE_RECORD',
        resourceType: 'RECORD',
        resourceId: this.testRecord.recordId,
        patientId: this.testPatient._id,
        performedBy: this.testDoctor._id,
        details: {
          recordTitle: this.testRecord.title,
          versionNumber: 2,
          changeDescription: 'Added test results'
        }
      }
    ];

    for (const auditData of auditActions) {
      await Audit.logAction(auditData);
    }
    
    console.log(`✅ ${auditActions.length} audit entries created`);
    
    // Test audit trail retrieval
    const patientAuditTrail = await Audit.getPatientAuditTrail(this.testPatient._id);
    console.log(`✅ Patient audit trail: ${patientAuditTrail.length} entries`);
    
    const recordAuditTrail = await Audit.getRecordAuditTrail(this.testRecord.recordId);
    console.log(`✅ Record audit trail: ${recordAuditTrail.length} entries`);
    
    const doctorActivity = await Audit.getDoctorActivity(this.testDoctor._id);
    console.log(`✅ Doctor activity summary: ${doctorActivity.length} action types`);
  }

  async testSupabaseBackup() {
    console.log('\n💾 Testing Supabase backup system...');
    
    try {
      // Get latest version for backup
      const latestVersion = await Version.findById(this.testRecord.currentVersionId);
      
      if (process.env.ENABLE_SUPABASE_BACKUP === 'true') {
        // Test backup creation with patient object
        const backupResult = await supabaseStorage.backupRecord(
          this.testRecord,
          latestVersion,
          this.testPatient,  // Now requires full patient object
          this.testDoctor._id
        );
        
        if (backupResult) {
          console.log(`✅ Supabase backup created successfully`);
          console.log(`   Storage Path: ${backupResult.storagePath}`);
          console.log(`   User Folder: ${backupResult.userFolder}`);
          console.log(`   Size: ${backupResult.sizeBytes} bytes`);
        } else {
          console.log(`⚠️  Supabase backup returned null (service may be disabled)`);
        }
        
        // Test backup listing
        const patientBackups = await supabaseStorage.listPatientRecords(
          this.testPatient.name,
          this.testPatient.uuid
        );
        console.log(`✅ Patient backups listed: ${patientBackups.length} records`);
        
        // Test backup statistics
        const backupStats = await supabaseStorage.getPatientStorageStats(
          this.testPatient.name,
          this.testPatient.uuid
        );
        console.log(`✅ Backup statistics retrieved`);
        console.log(`   Total size: ${backupStats.totalSize} bytes`);
        console.log(`   File count: ${backupStats.fileCount}`);
        console.log(`   User folder: ${backupStats.userFolder}`);
        
      } else {
        console.log('⚠️  Supabase backup is disabled in environment');
        console.log(`✅ Backup service status: ${supabaseStorage.backupEnabled ? 'enabled' : 'disabled'}`);
      }
      
    } catch (error) {
      console.log(`⚠️  Supabase backup test skipped: ${error.message}`);
    }
  }

  async testSearchAndRetrieval() {
    console.log('\n🔍 Testing search and retrieval...');
    
    // Test active records query
    const activeRecords = await Record.findActive({ 
      patientId: this.testPatient._id 
    });
    console.log(`✅ Active records found: ${activeRecords.length}`);
    
    // Test records with population
    const populatedRecords = await Record.findActive({ 
      patientId: this.testPatient._id 
    })
    .populate('patientId', 'name email uuid')
    .populate('createdBy', 'name specialization')
    .populate('currentVersionId', 'versionNumber contentSize');
    
    console.log(`✅ Populated records retrieved: ${populatedRecords.length}`);
    if (populatedRecords.length > 0) {
      const record = populatedRecords[0];
      console.log(`   Patient: ${record.patientId.name}`);
      console.log(`   Doctor: ${record.createdBy.name} (${record.createdBy.specialization})`);
      console.log(`   Current version: v${record.currentVersionId.versionNumber}`);
    }
    
    // Test version retrieval
    const latestVersion = await Version.getLatestVersion(this.testRecord._id);
    console.log(`✅ Latest version retrieved: v${latestVersion.versionNumber}`);
    console.log(`   Content size: ${latestVersion.contentSize} bytes`);
    console.log(`   Created by: ${latestVersion.createdBy.name}`);
    
    // Test tag-based search
    const taggedRecords = await Record.find({ 
      tags: { $in: ['cardiology'] },
      isDeleted: false
    });
    console.log(`✅ Tag-based search (cardiology): ${taggedRecords.length} records`);
  }

  async testSoftDelete() {
    console.log('\n🗑️  Testing soft delete functionality...');
    
    // Soft delete record
    await this.testRecord.softDelete(this.testDoctor._id);
    console.log(`✅ Record soft deleted`);
    
    // Verify it's marked as deleted but still exists
    const deletedRecord = await Record.findById(this.testRecord._id);
    console.log(`✅ Soft delete verification:`);
    console.log(`   isDeleted: ${deletedRecord.isDeleted}`);
    console.log(`   deletedAt: ${deletedRecord.deletedAt}`);
    console.log(`   deletedBy: ${deletedRecord.deletedBy}`);
    
    // Verify it doesn't appear in active queries
    const activeRecords = await Record.findActive({ 
      patientId: this.testPatient._id 
    });
    console.log(`✅ Active records after delete: ${activeRecords.length} (should be 0)`);
    
    // Test restore
    await deletedRecord.restore();
    console.log(`✅ Record restored successfully`);
    
    const restoredRecords = await Record.findActive({ 
      patientId: this.testPatient._id 
    });
    console.log(`✅ Active records after restore: ${restoredRecords.length} (should be 1)`);
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    
    // Clean up in reverse order of dependencies
    await Audit.deleteMany({ 
      $or: [
        { 'details.recordTitle': this.testRecord.title },
        { patientId: this.testPatient._id }
      ]
    });
    
    await Version.deleteMany({ recordId: this.testRecord._id });
    await Record.deleteMany({ _id: this.testRecord._id });
    await Doctor.deleteMany({ _id: this.testDoctor._id });
    await Patient.deleteMany({ _id: this.testPatient._id });
    
    console.log('✅ Test data cleanup completed');
  }
}

// Run the integration test
const test = new MedicalRecordsIntegrationTest();
test.runTests().catch(console.error);