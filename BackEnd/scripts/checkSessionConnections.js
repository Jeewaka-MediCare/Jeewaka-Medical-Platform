/**
 * Check Session-Patient-Payment Connections
 * 
 * This script checks if sessions have proper patient bookings and payment connections
 */

import mongoose from 'mongoose';
import Session from '../modules/session/sessionModel.js';
import Patient from '../modules/patient/patientModel.js';
import Doctor from '../modules/doctor/doctorModel.js';
import Hospital from '../modules/hospital/hospitalModel.js';
import 'dotenv/config';

async function checkSessionConnections() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI;
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get all sessions
    const sessions = await Session.find()
      .populate('doctorId', 'name email')
      .populate('hospital', 'name')
      .limit(20)
      .sort({ date: -1 });
    
    console.log(`Found ${sessions.length} recent sessions\n`);
    console.log('Session-Patient-Payment Status:');
    console.log('═══════════════════════════════════════════════════════\n');

    let sessionsWithBookings = 0;
    let sessionsWithPayments = 0;
    let totalBookings = 0;

    for (const session of sessions) {
      console.log(`Session ID: ${session._id}`);
      console.log(`  Doctor: ${session.doctorId?.name || 'Unknown'}`);
      console.log(`  Hospital: ${session.hospital?.name || 'Unknown'}`);
      console.log(`  Date: ${session.date}`);
      console.log(`  Time: ${session.startTime} - ${session.endTime}`);
      console.log(`  Type: ${session.type}`);
      
      // Check time slots
      if (session.timeSlots && session.timeSlots.length > 0) {
        console.log(`  Time Slots: ${session.timeSlots.length}`);
        
        let bookedSlots = 0;
        let slotsWithPayment = 0;
        
        for (let i = 0; i < session.timeSlots.length; i++) {
          const slot = session.timeSlots[i];
          if (slot.patientId) {
            bookedSlots++;
            totalBookings++;
            
            // Try to find patient
            let patient = null;
            try {
              patient = await Patient.findById(slot.patientId);
            } catch (e) {
              console.log(`    ⚠️  Slot ${i}: Invalid patient ID ${slot.patientId}`);
            }
            
            const patientName = patient ? patient.name : 'Unknown/Deleted';
            const hasPayment = slot.paymentIntentId ? '✅ Yes' : '❌ No';
            const paymentStatus = slot.paymentStatus || 'unknown';
            
            console.log(`    Slot ${i}: ${slot.startTime}-${slot.endTime}`);
            console.log(`      Patient: ${patientName} (${slot.patientId})`);
            console.log(`      Payment: ${hasPayment}`);
            console.log(`      Payment Status: ${paymentStatus}`);
            console.log(`      Payment Intent ID: ${slot.paymentIntentId || 'None'}`);
            console.log(`      Status: ${slot.status || 'unknown'}`);
            
            if (slot.paymentIntentId) {
              slotsWithPayment++;
            }
          } else {
            console.log(`    Slot ${i}: ${slot.startTime}-${slot.endTime} - Available`);
          }
        }
        
        if (bookedSlots > 0) {
          sessionsWithBookings++;
          console.log(`  ✅ Booked Slots: ${bookedSlots}/${session.timeSlots.length}`);
        }
        
        if (slotsWithPayment > 0) {
          sessionsWithPayments++;
          console.log(`  💳 Slots with Payment: ${slotsWithPayment}/${bookedSlots}`);
        }
      } else {
        console.log(`  ⚠️  No time slots defined`);
      }
      
      console.log('');
    }

    // Overall statistics
    const totalSessions = await Session.countDocuments();
    
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Summary:`);
    console.log(`  Total Sessions (all time): ${totalSessions}`);
    console.log(`  Sessions Checked: ${sessions.length}`);
    console.log(`  Sessions with Bookings: ${sessionsWithBookings}`);
    console.log(`  Sessions with Payments: ${sessionsWithPayments}`);
    console.log(`  Total Bookings Found: ${totalBookings}`);
    
    if (totalBookings === 0) {
      console.log(`\n⚠️  WARNING: No bookings found in recent sessions!`);
      console.log(`   Either no one has booked yet, or there's a booking issue.`);
    } else {
      console.log(`\n✅ Found ${totalBookings} booking(s) in recent sessions`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Database check complete\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkSessionConnections();
