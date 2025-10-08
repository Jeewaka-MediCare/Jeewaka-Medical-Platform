import dotenv from 'dotenv';
import admin from '../config/fireBaseAdmin.js';

dotenv.config();

/**
 * Retrieves Firebase user information to help create the missing patient profile
 */
async function getFirebaseUserInfo() {
  try {
    const firebaseUid = 'RZ5cqX1QTgOLub6xVCdKt638URg2';
    
    console.log('Fetching Firebase user info for UID:', firebaseUid);
    console.log('');

    const userRecord = await admin.auth().getUser(firebaseUid);
    
    console.log('✅ Firebase User Found:\n');
    console.log('UID:', userRecord.uid);
    console.log('Email:', userRecord.email);
    console.log('Email Verified:', userRecord.emailVerified);
    console.log('Display Name:', userRecord.displayName || '(not set)');
    console.log('Phone:', userRecord.phoneNumber || '(not set)');
    console.log('Created:', new Date(userRecord.metadata.creationTime).toLocaleString());
    console.log('Last Sign In:', new Date(userRecord.metadata.lastSignInTime).toLocaleString());
    
    // Check custom claims
    if (userRecord.customClaims) {
      console.log('\nCustom Claims:', userRecord.customClaims);
    } else {
      console.log('\nCustom Claims: (none)');
    }

    console.log('\n📝 Use this information to create the patient profile with correct details.');

  } catch (error) {
    console.error('❌ Error fetching Firebase user:', error.message);
    if (error.code === 'auth/user-not-found') {
      console.error('This Firebase UID does not exist!');
    }
  }
}

getFirebaseUserInfo();
