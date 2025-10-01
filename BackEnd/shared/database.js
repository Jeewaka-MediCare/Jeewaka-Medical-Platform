import mongoose from 'mongoose';
import dotenv from 'dotenv'
import dns from 'dns';

dotenv.config()

export const connectDB = async () => {
    console.log('🔄 Attempting MongoDB connection...');
    console.log('MongoDB URI:', process.env.MONGO_URI?.substring(0, 30) + '...');
    
    try {
        // Try to set DNS to use Google's DNS servers to resolve MongoDB SRV records
        dns.setServers(['8.8.8.8', '8.8.4.4']);
        
        // Add connection options for better reliability (removed deprecated options)
        const options = {
            serverSelectionTimeoutMS: 15000, // 15 second timeout
            socketTimeoutMS: 45000, // 45 second socket timeout
            bufferCommands: false,
            maxPoolSize: 10,
            family: 4, // Force IPv4
        };

        await mongoose.connect(process.env.MONGO_URI, options);
        console.log('✅ MongoDB Connected successfully');
        return true;
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
        
        // Check if it's an IP whitelist issue
        if (err.message.includes('IP that isn\'t whitelisted') || err.message.includes('Could not connect to any servers')) {
            console.log('⚠️  IP Address not whitelisted in MongoDB Atlas');
            console.log('📝 To fix: Add your current IP to MongoDB Atlas Network Access');
        }
        
        console.log('⚠️  Server will continue running without database for AI testing...');
        return false;
    }
};
