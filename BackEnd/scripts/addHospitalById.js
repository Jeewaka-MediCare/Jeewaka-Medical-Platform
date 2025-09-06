/**
 * addHospitalById.js
 * Usage: set MONGO_URI='...'; node backend/scripts/addHospitalById.js
 * This script inserts a hospital document with a specified _id if it does not exist.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb+srv://gt202054194:Vihanga516@cluster0.wjunv6a.mongodb.net/medAI?retryWrites=true&w=majority&appName=Cluster0';

async function main() {
  await mongoose.connect(mongoUri, { autoIndex: false });
  console.log('Connected to', mongoUri);

  const hospitalSchema = new mongoose.Schema({}, { strict: false });
  const Hospital = mongoose.model('Hospital', hospitalSchema, 'hospitals');

  const targetId = '687d15a166f108143c4e074e';
  const name = 'Teaching Hospital Peradeniya';
  const location = 'Peradeniya';

  // Check if hospital already exists
  const existing = await Hospital.findById(targetId).lean();
  if (existing) {
    console.log(`Hospital with id ${targetId} already exists:`, existing.name || existing);
    await mongoose.disconnect();
    process.exit(0);
  }

  // Insert hospital with the given _id
  try {
    const doc = {
      _id: new mongoose.Types.ObjectId(targetId),
      name,
      location,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0
    };

    const res = await Hospital.create(doc);
    console.log('Inserted hospital:', res);
  } catch (err) {
    console.error('Error inserting hospital:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});
