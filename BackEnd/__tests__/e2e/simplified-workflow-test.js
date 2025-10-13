/**
 * Simplified Medical Records Workflow Test
 * 
 * This test bypasses authentication by directly inserting records into MongoDB
 * to test the medical records functionality end-to-end.
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import admin from '../config/fireBaseAdmin.js';
import mongoose from 'mongoose';
import Patient from '../modules/patient/patientModel.js';
import Doctor from '../modules/doctor/doctorModel.js';
import Hospital from '../modules/hospital/hospitalModel.js';
import Session from '../modules/session/sessionModel.js';

const BASE_URL = 'http://localhost:5000';
const api = axios.create({ baseURL: BASE_URL });

// Generate unique identifiers
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
    regNo: `SLMC${testRunId}`,
    consultationFee: 5000
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

// Connect to MongoDB
async function connectDB() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/medAI';
    await mongoose.connect(mongoUri);
    log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
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
    
    // Set role
    await api.post('/api/auth/role', { uid: uuid, role: 'patient' });
    log('✅ Role Set: patient');
    
    // Create patient in MongoDB directly
    const patient = new Patient({
      name: testData.patient.name,
      email: testData.patient.email,
      uuid: uuid,
      dob: new Date(testData.patient.dob),
      sex: testData.patient.sex,
      phone: testData.patient.phone
    });
    
    await patient.save();
    created.patient = patient;
    created.patient.firebaseUid = uuid;
    
    // Get custom token for API calls
    created.tokens.patient = await admin.auth().createCustomToken(uuid);
    
    log('✅ Patient Created:', {
      id: patient._id.toString(),
      email: patient.email,
      name: patient.name,
      uuid: uuid
    });
    
    return patient;
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
    
    // Set role
    await api.post('/api/auth/role', { uid: uuid, role: 'doctor' });
    log('✅ Role Set: doctor');
    
    // Create doctor in MongoDB directly
    const doctor = new Doctor({
      name: testData.doctor.name,
      email: testData.doctor.email,
      uuid: uuid,
      dob: new Date('1985-03-20'),
      gender: testData.doctor.gender,
      phone: testData.doctor.phone,
      specialization: testData.doctor.specialization,
      regNo: testData.doctor.regNo,
      consultationFee: testData.doctor.consultationFee,
      qualifications: ['MBBS', 'MD'],
      yearsOfExperience: 8,
      languagesSpoken: ['English', 'Sinhala']
    });
    
    await doctor.save();
    created.doctor = doctor;
    created.doctor.firebaseUid = uuid;
    
    // Get custom token for API calls
    created.tokens.doctor = await admin.auth().createCustomToken(uuid);
    
    log('✅ Doctor Created:', {
      id: doctor._id.toString(),
      email: doctor.email,
      name: doctor.name,
      uuid: uuid
    });
    
    return doctor;
  } catch (error) {
    await handleError(error, 'Create Doctor');
  }
}

// 3. Get Hospital
async function getHospital() {
  try {
    log('📝 Step 3: Getting Hospital...');
    
    // Get first hospital
    const hospital = await Hospital.findOne();
    
    if (!hospital) {
      throw new Error('No hospitals found in database. Please create a hospital first.');
    }
    
    created.hospital = hospital;
    log('✅ Hospital Found:', {
      id: hospital._id.toString(),
      name: hospital.name
    });
    
    return hospital;
  } catch (error) {
    await handleError(error, 'Get Hospital');
  }
}

// 4. Create Session
async function createSession() {
  try {
    log('📝 Step 4: Creating Session...');
    
    // Create session in MongoDB directly
    const session = new Session({
      doctorId: created.doctor._id,
      hospital: created.hospital._id,
      date: new Date('2025-10-15'),
      startTime: '10:00',
      endTime: '12:00',
      type: 'in-person',
      maxPatients: 5,
      timeSlots: [],
      bookedPatients: []
    });
    
    await session.save();
    created.session = session;
    
    log('✅ Session Created:', {
      id: session._id.toString(),
      date: session.date,
      time: `${session.startTime} - ${session.endTime}`
    });
    
    return session;
  } catch (error) {
    await handleError(error, 'Create Session');
  }
}

// 5. Book Appointment (simplified - add patient to session)
async function bookAppointment() {
  try {
    log('📝 Step 5: Booking Appointment (Simulated)...');
    
    // Update session to add booked patient
    created.session.bookedPatients.push({
      patientId: created.patient._id,
      timeSlot: '10:00',
      status: 'booked',
      paymentStatus: 'completed',
      paymentIntentId: 'test_pi_' + testRunId
    });
    
    await created.session.save();
    
    log('✅ Appointment Booked:', {
      sessionId: created.session._id.toString(),
      patientId: created.patient._id.toString(),
      timeSlot: '10:00'
    });
    
    return created.session;
  } catch (error) {
    await handleError(error, 'Book Appointment');
  }
}

// 6. Doctor Creates Medical Record
async function createMedicalRecord() {
  try {
    log('📝 Step 6: Doctor Creating Medical Record...');
    
    // Exchange custom token for ID token would be complex,
    // so we'll create a temporary ID token using admin SDK
    const idToken = await admin.auth().createCustomToken(created.doctor.firebaseUid, {
      role: 'doctor'
    });
    
    const response = await api.post(
      `/api/patients/${created.patient._id}/records`,
      testData.medicalRecord,
      {
        headers: { Authorization: `Bearer ${idToken}` }
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

// 7. Patient Views Medical Record
async function viewMedicalRecord() {
  try {
    log('📝 Step 7: Patient Viewing Medical Records...');
    
    const idToken = await admin.auth().createCustomToken(created.patient.firebaseUid, {
      role: 'patient'
    });
    
    const response = await api.get(
      `/api/patients/${created.patient._id}/records`,
      {
        headers: { Authorization: `Bearer ${idToken}` }
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
    
    return records;
  } catch (error) {
    await handleError(error, 'View Medical Record');
  }
}

// Main Test Runner
async function runWorkflowTest() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   MEDICAL RECORDS WORKFLOW TEST                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  try {
    await connectDB();
    await createPatient();
    await createDoctor();
    await getHospital();
    await createSession();
    await bookAppointment();
    await createMedicalRecord();
    await viewMedicalRecord();
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   ✅ ALL TESTS PASSED - WORKFLOW COMPLETE                 ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    
    console.log('\n📊 TEST CREDENTIALS & DATABASE RECORDS');
    console.log('═══════════════════════════════════════════════════════');
    
    console.log('\n👤 PATIENT CREDENTIALS:');
    console.log(`   Email: ${testData.patient.email}`);
    console.log(`   Password: ${testData.patient.password}`);
    console.log(`   MongoDB ID: ${created.patient._id}`);
    console.log(`   Firebase UID: ${created.patient.firebaseUid}`);
    
    console.log('\n👨‍⚕️ DOCTOR CREDENTIALS:');
    console.log(`   Email: ${testData.doctor.email}`);
    console.log(`   Password: ${testData.doctor.password}`);
    console.log(`   MongoDB ID: ${created.doctor._id}`);
    console.log(`   Firebase UID: ${created.doctor.firebaseUid}`);
    
    console.log('\n🏥 CREATED DATABASE RECORDS:');
    console.log(`   Hospital ID: ${created.hospital._id}`);
    console.log(`   Session ID: ${created.session._id}`);
    console.log(`   Medical Record ID: ${created.record.recordId}`);
    
    console.log('\n✅ ALL DATA PRESERVED IN DATABASE FOR VERIFICATION');
    console.log('═══════════════════════════════════════════════════════\n');
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   ❌ TEST FAILED                                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.error('Error:', error.message);
    
    await mongoose.disconnect();
    process.exit(1);
  }
}

runWorkflowTest();
