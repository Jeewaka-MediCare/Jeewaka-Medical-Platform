import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Patient from '../modules/patient/patientModel.js';

dotenv.config();

/**
 * Creates a patient profile for a Firebase user who is authenticated
 * but missing their MongoDB patient profile.
 * 
 * This happens when:
 * - Firebase registration succeeded but backend API call failed
 * - User was created manually in Firebase console
 * - Registration was interrupted before completion
 */
async function createMissingPatientProfile() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const firebaseUid = 'RZ5cqX1QTgOLub6xVCdKt638URg2';
    
    // Check if patient already exists (shouldn't, but verify)
    const existingPatient = await Patient.findOne({ uuid: firebaseUid });
    if (existingPatient) {
      console.log('⚠️  Patient already exists!');
      console.log('Name:', existingPatient.name);
      console.log('Email:', existingPatient.email);
      console.log('ID:', existingPatient._id);
      return;
    }

    console.log('Creating patient profile for Firebase UID:', firebaseUid);
    console.log('Email: vishva@gmail.com\n');

    // Create patient with real email from Firebase
    // User should complete their profile after logging in
    const newPatient = new Patient({
      name: 'Vishva (Please Update Profile)', // User should update their full name
      email: 'vishva@gmail.com', // Real email from Firebase
      uuid: firebaseUid, // CRITICAL: Firebase UID for authentication
      dob: new Date('2000-01-01'), // Placeholder - user should update
      sex: 'other', // Placeholder - user should update
      phone: '0000000000', // Placeholder - user should update
      bloodGroup: 'Unknown',
      weight: 0,
      height: 0,
      address: '',
      emergencyContact: ''
    });

    await newPatient.save();
    
    console.log('✅ Patient profile created successfully!\n');
    console.log('Patient ID:', newPatient._id);
    console.log('Name:', newPatient.name);
    console.log('Email:', newPatient.email);
    console.log('UUID:', newPatient.uuid);
    console.log('\n⚠️  IMPORTANT: User should update their profile with real information');
    console.log('⚠️  They can now log in and make payments');

  } catch (error) {
    console.error('❌ Error creating patient profile:', error.message);
    if (error.code === 11000) {
      console.error('Duplicate key error - patient may already exist');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

createMissingPatientProfile();
