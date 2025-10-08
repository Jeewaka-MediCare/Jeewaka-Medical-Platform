/**
 * Check Patient UUID Field
 * 
 * This script checks if patients in the database have the uuid field properly set
 */

import mongoose from 'mongoose';
import Patient from '../modules/patient/patientModel.js';
import 'dotenv/config';

async function checkPatientUUIDs() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI;
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get all patients
    const patients = await Patient.find().limit(10);
    
    console.log(`Found ${patients.length} patients in database\n`);
    console.log('Patient UUID Status:');
    console.log('═══════════════════════════════════════════════════════\n');

    for (const patient of patients) {
      console.log(`Patient: ${patient.name || 'Unknown'}`);
      console.log(`  Email: ${patient.email}`);
      console.log(`  MongoDB _id: ${patient._id}`);
      console.log(`  Firebase UUID: ${patient.uuid || '❌ MISSING'}`);
      console.log(`  Status: ${patient.uuid ? '✅ OK' : '❌ UUID NOT SET'}`);
      console.log('');
    }

    // Count patients without UUID
    const patientsWithoutUUID = await Patient.countDocuments({ $or: [{ uuid: null }, { uuid: { $exists: false } }] });
    const totalPatients = await Patient.countDocuments();

    console.log('═══════════════════════════════════════════════════════');
    console.log(`Summary:`);
    console.log(`  Total Patients: ${totalPatients}`);
    console.log(`  Patients WITH UUID: ${totalPatients - patientsWithoutUUID}`);
    console.log(`  Patients WITHOUT UUID: ${patientsWithoutUUID}`);
    
    if (patientsWithoutUUID > 0) {
      console.log(`\n⚠️  WARNING: ${patientsWithoutUUID} patient(s) are missing UUID!`);
      console.log(`   These patients cannot book appointments.`);
      console.log(`   Run the fix script or manually set their uuid field.`);
    } else {
      console.log(`\n✅ All patients have UUID set correctly!`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Database check complete\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkPatientUUIDs();
