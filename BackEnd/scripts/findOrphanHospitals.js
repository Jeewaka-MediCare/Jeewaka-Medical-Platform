/*
  findOrphanHospitals.js
  Usage: set MONGO_URI="mongodb://..."; node backend/scripts/findOrphanHospitals.js
  This script is read-only: it lists session.hospital ObjectIds that don't exist in hospitals collection.
*/

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb+srv://gt202054194:Vihanga516@cluster0.wjunv6a.mongodb.net/medAI?retryWrites=true&w=majority&appName=Cluster0';

async function main() {
  console.log('Connecting to', mongoUri);
  await mongoose.connect(mongoUri, { autoIndex: false });

  const Session = mongoose.model('Session', new mongoose.Schema({}, { strict: false }), 'sessions');
  const Hospital = mongoose.model('Hospital', new mongoose.Schema({}, { strict: false }), 'hospitals');

  // Get distinct hospital ids referenced by sessions
  const hospitalIds = await Session.distinct('hospital');
  console.log(`Found ${hospitalIds.length} distinct hospital ids referenced by sessions`);

  const orphanIds = [];
  for (const hid of hospitalIds) {
    if (!hid) continue;
    let exists = null;
    try {
      exists = await Hospital.findById(hid).lean();
    } catch (e) {
      // In case hid is not a valid ObjectId string
      console.warn('Error finding hospital for id', hid, e.message || e);
    }
    if (!exists) orphanIds.push(hid);
  }

  if (orphanIds.length === 0) {
    console.log('No orphaned hospital references found.');
  } else {
    console.log(`Found ${orphanIds.length} orphaned hospital id(s):`);
    orphanIds.forEach((id, i) => console.log(`${i + 1}. ${id}`));

    // Show example sessions for the first orphan id
    const sampleOrphan = orphanIds[0];
    console.log('\nExample sessions referencing the first orphan id:');
    const sessions = await Session.find({ hospital: sampleOrphan }).limit(10).lean();
    sessions.forEach(s => console.log(`- session _id: ${s._id}, date: ${s.date}, doctorId: ${s.doctorId}`));
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Script error:', err);
  process.exit(1);
});
