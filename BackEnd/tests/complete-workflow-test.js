/**
 * Complete Medical Records Workflow Test
 * 
 * Tests the full flow from user creation to medical record viewing:
 * 1. Create a patient user
 * 2. Create a doctor user  
 * 3. Doctor creates a session
 * 4. Patient books appointment (with payment)
 * 5. Doctor creates medical record
 * 6. Patient views the record
 * 
 * All data is preserved in the database for verification
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import admin from '../config/fireBaseAdmin.js';

const BASE_URL = 'http://localhost:5000';
const api = axios.create({ baseURL: BASE_URL });

// Generate unique identifiers for this test run
const testRunId = Date.now();

// Store test data
const testData = {
  patient: {
    email: `john.patient.${testRunId}@test.com`,
    password: 'TestPatient123!',
    name: 'John Patient',
    phone: '+94771234567',
    dob: '1990-05-15',
    sex: 'Male'
  },
  doctor: {
    email: `dr.smith.${testRunId}@test.com`,
    password: 'TestDoctor123!',
    name: 'Dr. Sarah Smith',
    phone: '+94771234568',
    gender: 'Female',
    specialization: 'Cardiology',
    subSpecializations: ['Interventional Cardiology'],
    regNo: `SLMC${testRunId}`,
    qualifications: ['MBBS', 'MD'],
    yearsOfExperience: 8,
    languagesSpoken: ['English', 'Sinhala'],
    consultationFee: 5000
  },
  hospital: {
    name: 'Test Hospital',
    address: 'Colombo, Sri Lanka'
  },
  session: {
    date: '2025-10-15',
    startTime: '10:00',
    endTime: '12:00',
    type: 'in-person',
    maxPatients: 5
  },
  medicalRecord: {
    title: 'Initial Cardiology Consultation',
    description: 'Patient presented with chest discomfort',
    content: `# Initial Cardiology Consultation

## Patient Information
- **Name:** John Patient
- **Age:** 35 years
- **Chief Complaint:** Chest discomfort for 3 days

## History of Present Illness
Patient reports:
- Intermittent chest discomfort, central location
- Occurs after physical exertion
- Duration: 3 days
- No radiation to arms or jaw
- No shortness of breath at rest

## Physical Examination
- **Vital Signs:** BP 130/85, HR 82, RR 16, Temp 36.8°C
- **Heart:** Regular rhythm, no murmurs detected
- **Lungs:** Clear bilaterally, good air entry
- **Extremities:** No edema, pulses normal

## Assessment
Possible cardiac-related chest pain. Further investigation needed.

## Plan
1. ECG - Scheduled
2. Cardiac enzyme test - Ordered
3. Stress test - To be scheduled
4. Lifestyle modifications discussed
5. Follow-up in 1 week

## Medications Prescribed
- Aspirin 75mg daily
- Atorvastatin 10mg at night

## Patient Education
- Warning signs discussed
- When to seek emergency care
- Lifestyle modifications advised

*Consultation Date: October 15, 2025*
*Doctor: Dr. Sarah Smith, Cardiologist*`,
    tags: ['cardiology', 'chest-pain', 'initial-consultation']
  }
};

// Store created records
const created = {
  patient: null,
  doctor: null,
  hospital: null,
  session: null,
  booking: null,
  record: null,
  tokens: {
    patient: null,
    doctor: null
  }
};

async function log(message, data = null) {
  console.log(`\n${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

async function handleError(error, step) {
  console.error(`\n❌ Error in ${step}:`, error.response?.data || error.message);
  throw error;
}

// 1. Create Patient User
async function createPatient() {
  try {
    log('📝 Step 1: Creating Patient User...');
    
    // Create Firebase user
    const firebaseUser = await admin.auth().createUser({
      email: testData.patient.email,
      password: testData.patient.password,
      displayName: testData.patient.name
    });
    
    const uuid = firebaseUser.uid;
    log('✅ Firebase User Created:', { uid: uuid });
    
    // Set role in custom claims
    await api.post('/api/auth/role', { uid: uuid, role: 'patient' });
    log('✅ Role Set: patient');
    
    // Create patient profile in MongoDB
    const response = await api.post('/api/patient', {
      name: testData.patient.name,
      email: testData.patient.email,
      uuid: uuid,
      dob: testData.patient.dob,
      sex: testData.patient.sex,
      phone: testData.patient.phone
    });
    
    created.patient = response.data;
    created.patient.firebaseUid = uuid;
    log('✅ Patient Profile Created:', {
      id: created.patient._id,
      email: created.patient.email,
      name: created.patient.name,
      uuid: uuid
    });
    
    return created.patient;
  } catch (error) {
    await handleError(error, 'Create Patient');
  }
}

// 2. Create Doctor User
async function createDoctor() {
  try {
    log('📝 Step 2: Creating Doctor User...');
    
    // Create Firebase user
    const firebaseUser = await admin.auth().createUser({
      email: testData.doctor.email,
      password: testData.doctor.password,
      displayName: testData.doctor.name
    });
    
    const uuid = firebaseUser.uid;
    log('✅ Firebase User Created:', { uid: uuid });
    
    // Set role in custom claims
    await api.post('/api/auth/role', { uid: uuid, role: 'doctor' });
    log('✅ Role Set: doctor');
    
    // Create doctor profile in MongoDB (no auth required for registration)
    const response = await api.post('/api/doctor', {
      name: testData.doctor.name,
      email: testData.doctor.email,
      uuid: uuid,
      dob: '1985-03-20',
      gender: testData.doctor.gender,
      regNo: testData.doctor.regNo,
      phone: testData.doctor.phone,
      specialization: testData.doctor.specialization,
      subSpecializations: testData.doctor.subSpecializations,
      qualifications: testData.doctor.qualifications,
      yearsOfExperience: testData.doctor.yearsOfExperience,
      languagesSpoken: testData.doctor.languagesSpoken,
      consultationFee: testData.doctor.consultationFee
    });
    
    created.doctor = response.data;
    created.doctor.firebaseUid = uuid;
    log('✅ Doctor Profile Created:', {
      id: created.doctor.doctor._id,
      email: created.doctor.doctor.email,
      name: created.doctor.doctor.name,
      specialization: created.doctor.doctor.specialization,
      uuid: uuid
    });
    
    return created.doctor;
  } catch (error) {
    await handleError(error, 'Create Doctor');
  }
}

// 2.5. Get or Create Hospital (needed for session)
async function createHospital() {
  try {
    log('📝 Step 2.5: Getting Hospital...');
    
    // Try to get existing hospitals first
    const hospitalsRes = await api.get('/api/hospital');
    
    if (hospitalsRes.data && hospitalsRes.data.length > 0) {
      created.hospital = hospitalsRes.data[0];
      log('✅ Using Existing Hospital:', {
        id: created.hospital._id,
        name: created.hospital.name
      });
    } else {
      // If no hospitals exist, create admin and then hospital
      log('⚠️ No hospitals found. Creating admin user and hospital...');
      
      // Create admin Firebase user
      const adminFirebaseUser = await admin.auth().createUser({
        email: `admin.${testRunId}@test.com`,
        password: 'AdminTest123!',
        displayName: 'Test Admin'
      });
      
      const adminUuid = adminFirebaseUser.uid;
      
      // Set admin role
      await api.post('/api/auth/role', { uid: adminUuid, role: 'admin' });
      
      // Get admin token
      const adminToken = await admin.auth().createCustomToken(adminUuid);
      
      // Create hospital with admin token
      const hospitalRes = await api.post('/api/hospital', {
        ...testData.hospital,
        location: { type: 'Point', coordinates: [79.8612, 6.9271] },
        facilities: ['ICU', 'Emergency'],
        phone: '+94112345678'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      created.hospital = hospitalRes.data;
      log('✅ Hospital Created:', {
        id: created.hospital._id,
        name: created.hospital.name
      });
    }
    
    return created.hospital;
  } catch (error) {
    await handleError(error, 'Create Hospital');
  }
}

// 3. Doctor Creates Session
async function createSession() {
  try {
    log('📝 Step 3: Doctor Creating Session...');
    
    // Get custom token for doctor
    const customToken = await admin.auth().createCustomToken(created.doctor.firebaseUid);
    created.tokens.doctor = customToken;
    log('✅ Doctor Token Created');
    
    // Create session with doctor token
    const response = await api.post('/api/session', {
      doctorId: created.doctor.doctor._id,
      hospital: created.hospital._id,
      ...testData.session,
      timeSlots: []
    }, {
      headers: { Authorization: `Bearer ${customToken}` }
    });
    
    created.session = response.data;
    log('✅ Session Created:', {
      id: created.session._id,
      date: created.session.date,
      time: `${created.session.startTime} - ${created.session.endTime}`,
      type: created.session.type
    });
    
    return created.session;
  } catch (error) {
    await handleError(error, 'Create Session');
  }
}

// 4. Patient Books Appointment with Payment
async function bookAppointment() {
  try {
    log('📝 Step 4: Patient Booking Appointment...');
    
    // Get custom token for patient
    const customToken = await admin.auth().createCustomToken(created.patient.firebaseUid);
    created.tokens.patient = customToken;
    log('✅ Patient Token Created');
    
    // Create payment intent
    log('💳 Creating payment intent...');
    const paymentRes = await api.post('/api/payments/create-payment-intent', {
      amount: testData.doctor.consultationFee,
      currency: 'lkr',
      metadata: {
        sessionId: created.session._id,
        patientId: created.patient._id,
        doctorId: created.doctor.doctor._id,
        appointmentType: 'consultation'
      }
    }, {
      headers: { Authorization: `Bearer ${customToken}` }
    });
    
    const paymentIntent = paymentRes.data.clientSecret;
    log('✅ Payment Intent Created:', { clientSecret: paymentIntent.substring(0, 20) + '...' });
    
    // Book the session
    log('📅 Booking session...');
    const bookingRes = await api.post('/api/session/book', {
      sessionId: created.session._id,
      patientId: created.patient._id,
      timeSlot: testData.session.startTime,
      paymentIntentId: paymentIntent.split('_secret_')[0] // Extract payment intent ID
    }, {
      headers: { Authorization: `Bearer ${customToken}` }
    });
    
    created.booking = bookingRes.data;
    log('✅ Appointment Booked:', {
      sessionId: created.session._id,
      patientId: created.patient._id,
      timeSlot: testData.session.startTime,
      status: 'booked'
    });
    
    return created.booking;
  } catch (error) {
    await handleError(error, 'Book Appointment');
  }
}

// 5. Doctor Creates Medical Record
async function createMedicalRecord() {
  try {
    log('📝 Step 5: Doctor Creating Medical Record...');
    
    const response = await api.post(
      `/api/patients/${created.patient._id}/records`,
      testData.medicalRecord,
      {
        headers: { Authorization: `Bearer ${created.tokens.doctor}` }
      }
    );
    
    created.record = response.data.record;
    log('✅ Medical Record Created:', {
      id: created.record._id,
      recordId: created.record.recordId,
      title: created.record.title,
      versionNumber: response.data.version?.versionNumber
    });
    
    return created.record;
  } catch (error) {
    await handleError(error, 'Create Medical Record');
  }
}

// 6. Patient Views Medical Record
async function viewMedicalRecord() {
  try {
    log('📝 Step 6: Patient Viewing Medical Records...');
    
    const response = await api.get(
      `/api/patients/${created.patient._id}/records`,
      {
        headers: { Authorization: `Bearer ${created.tokens.patient}` }
      }
    );
    
    const records = response.data.records;
    log('✅ Patient Can View Records:', {
      totalRecords: records.length,
      records: records.map(r => ({
        id: r.recordId,
        title: r.title,
        createdBy: r.createdBy?.name
      }))
    });
    
    // View specific record details
    const detailRes = await api.get(
      `/api/records/${created.record.recordId}`,
      {
        headers: { Authorization: `Bearer ${created.tokens.patient}` }
      }
    );
    
    log('✅ Record Details Retrieved:', {
      title: detailRes.data.record.title,
      hasContent: !!detailRes.data.currentVersion?.content,
      contentLength: detailRes.data.currentVersion?.content?.length
    });
    
    return records;
  } catch (error) {
    await handleError(error, 'View Medical Record');
  }
}

// Main Test Runner
async function runCompleteWorkflowTest() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   COMPLETE MEDICAL RECORDS WORKFLOW TEST                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  try {
    await createPatient();
    await createDoctor();
    await createHospital();
    await createSession();
    await bookAppointment();
    await createMedicalRecord();
    await viewMedicalRecord();
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   ✅ ALL TESTS PASSED - WORKFLOW COMPLETE                 ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    
    console.log('\n📊 TEST SUMMARY & CREDENTIALS');
    console.log('═══════════════════════════════════════════════════════');
    
    console.log('\n👤 PATIENT CREDENTIALS:');
    console.log(`   Email: ${testData.patient.email}`);
    console.log(`   Password: ${testData.patient.password}`);
    console.log(`   Database ID: ${created.patient._id}`);
    console.log(`   UUID: ${created.patient.uuid}`);
    
    console.log('\n👨‍⚕️ DOCTOR CREDENTIALS:');
    console.log(`   Email: ${testData.doctor.email}`);
    console.log(`   Password: ${testData.doctor.password}`);
    console.log(`   Database ID: ${created.doctor._id}`);
    console.log(`   UUID: ${created.doctor.uuid}`);
    
    console.log('\n🏥 CREATED RECORDS:');
    console.log(`   Hospital ID: ${created.hospital._id}`);
    console.log(`   Session ID: ${created.session._id}`);
    console.log(`   Medical Record ID: ${created.record.recordId}`);
    
    console.log('\n🔑 AUTH TOKENS (for API testing):');
    console.log(`   Patient Token: ${created.tokens.patient?.substring(0, 30)}...`);
    console.log(`   Doctor Token: ${created.tokens.doctor?.substring(0, 30)}...`);
    
    console.log('\n📝 ALL DATABASE RECORDS PRESERVED FOR VERIFICATION');
    console.log('═══════════════════════════════════════════════════════\n');
    
    return {
      success: true,
      credentials: {
        patient: {
          email: testData.patient.email,
          password: testData.patient.password,
          id: created.patient._id
        },
        doctor: {
          email: testData.doctor.email,
          password: testData.doctor.password,
          id: created.doctor._id
        }
      },
      created
    };
    
  } catch (error) {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   ❌ TEST FAILED                                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.error('Error:', error.message);
    
    console.log('\n📊 PARTIAL DATA (for debugging):');
    console.log(JSON.stringify(created, null, 2));
    
    process.exit(1);
  }
}

// Run the test
runCompleteWorkflowTest()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
