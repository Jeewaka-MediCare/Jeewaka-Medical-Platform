/**
 * Check Specific Patient by Firebase UID
 */

import mongoose from 'mongoose';
import Patient from '../modules/patient/patientModel.js';
import 'dotenv/config';

async function checkPatient() {
  try {
    const mongoUri = process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const firebaseUid = 'RZ5cqX1QTgOLub6xVCdKt638URg2';
    
    console.log(`Searching for patient with Firebase UID: ${firebaseUid}\n`);
    
    const patient = await Patient.findOne({ uuid: firebaseUid });
    
    if (patient) {
      console.log('✅ PATIENT FOUND:');
      console.log('  MongoDB _id:', patient._id);
      console.log('  Firebase UUID:', patient.uuid);
      console.log('  Name:', patient.name);
      console.log('  Email:', patient.email);
      console.log('  Phone:', patient.phone);
      console.log('  Created:', patient.createdAt || 'N/A');
    } else {
      console.log('❌ PATIENT NOT FOUND!');
      console.log('\nThis user is authenticated with Firebase but has no patient profile.');
      console.log('They need to complete registration or create a patient profile.');
      
      // Check if maybe the UUID is stored differently
      console.log('\nSearching by partial match...');
      const similarPatients = await Patient.find({ 
        $or: [
          { uuid: { $regex: 'RZ5cqX', $options: 'i' } },
          { email: { $regex: '@', $options: 'i' } }
        ]
      }).limit(5);
      
      if (similarPatients.length > 0) {
        console.log('\nSimilar patients found:');
        similarPatients.forEach(p => {
          console.log(`  - ${p.name} (${p.email}) - UUID: ${p.uuid}`);
        });
      }
    }

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkPatient();
