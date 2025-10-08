import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Patient from '../modules/patient/patientModel.js';
import admin from '../config/fireBaseAdmin.js';

dotenv.config();

/**
 * Check both Firebase and MongoDB for user: Ts4rfl9iPsh0oEBZhrNqsyNjfPw1
 */
async function checkUser() {
  try {
    const firebaseUid = 'Ts4rfl9iPsh0oEBZhrNqsyNjfPw1';
    
    console.log('='.repeat(60));
    console.log('CHECKING USER:', firebaseUid);
    console.log('='.repeat(60));
    
    // Check Firebase
    console.log('\n📱 FIREBASE CHECK:');
    try {
      const userRecord = await admin.auth().getUser(firebaseUid);
      console.log('✅ Firebase User Found:');
      console.log('   Email:', userRecord.email);
      console.log('   Display Name:', userRecord.displayName || '(not set)');
      console.log('   Email Verified:', userRecord.emailVerified);
      console.log('   Created:', new Date(userRecord.metadata.creationTime).toLocaleString());
      console.log('   Last Sign In:', new Date(userRecord.metadata.lastSignInTime).toLocaleString());
      console.log('   Custom Claims:', userRecord.customClaims || '(none)');
    } catch (error) {
      console.log('❌ Firebase User NOT FOUND');
      console.log('   Error:', error.message);
    }

    // Check MongoDB
    console.log('\n💾 MONGODB CHECK:');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const patient = await Patient.findOne({ uuid: firebaseUid });
    
    if (patient) {
      console.log('✅ Patient Profile Found:');
      console.log('   MongoDB _id:', patient._id);
      console.log('   Name:', patient.name);
      console.log('   Email:', patient.email);
      console.log('   DOB:', patient.dob ? new Date(patient.dob).toLocaleDateString() : '(not set)');
      console.log('   Sex:', patient.sex || '(not set)');
      console.log('   Phone:', patient.phone || '(not set)');
    } else {
      console.log('❌ Patient Profile NOT FOUND');
      console.log('\n⚠️  This user has Firebase account but NO MongoDB profile!');
      console.log('⚠️  Registration was incomplete.');
      console.log('\n💡 Solutions:');
      console.log('   1. User should re-register (recommended)');
      console.log('   2. Run createPatientForFirebaseUser.js to create profile manually');
    }

    console.log('\n' + '='.repeat(60));
    console.log('DIAGNOSIS:');
    console.log('='.repeat(60));
    
    if (patient) {
      console.log('✅ User has COMPLETE profile');
      console.log('✅ Should be able to book appointments and make payments');
    } else {
      console.log('❌ User has INCOMPLETE profile');
      console.log('❌ Will be BLOCKED from booking appointments');
      console.log('❌ ProtectedRoute will show ProfileIncompleteWarning');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkUser();
