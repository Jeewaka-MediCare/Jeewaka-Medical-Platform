import mongoose from 'mongoose';
import dotenv from 'dotenv'

dotenv.config()

export const connectDB = async () => {

    console.log(process.env.MONGO_URI)
  try {

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};
