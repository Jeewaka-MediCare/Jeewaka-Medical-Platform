import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from '../../shared/database.js';
import medicalRecordsRouter from '../../modules/records/recordsRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3001; // Different port for testing

// Middleware
app.use(cors());
app.use(express.json());

// Mock auth middleware for testing
const mockAuthMiddleware = (req, res, next) => {
  // Simulate a doctor user
  req.user = {
    id: '507f1f77bcf86cd799439011', // Mock ObjectId
    type: 'DOCTOR',
    name: 'Dr. Test User'
  };
  next();
};

// Apply mock auth to medical records routes
app.use('/api/medical-records', mockAuthMiddleware, medicalRecordsRouter);

// Health check route
app.get('/test-health', (req, res) => {
  res.json({ 
    message: 'Medical Records API Test Server Running',
    timestamp: new Date().toISOString(),
    routes: {
      health: '/api/medical-records/health',
      search: '/api/medical-records/search',
      patientRecords: '/api/medical-records/patients/:patientId/records',
      specificRecord: '/api/medical-records/records/:recordId'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ 
    error: 'Server Error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start test server
const startTestServer = async () => {
  try {
    console.log('🧪 Starting Medical Records API Test Server...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Test server running on http://localhost:${PORT}`);
      console.log('📋 Available routes:');
      console.log(`   Health Check: http://localhost:${PORT}/test-health`);
      console.log(`   Medical Records Health: http://localhost:${PORT}/api/medical-records/health`);
      console.log(`   Search Records: http://localhost:${PORT}/api/medical-records/search`);
      console.log('\n✅ Medical Records API is ready for testing!');
      
      // Graceful shutdown
      process.on('SIGTERM', () => {
        console.log('\n🛑 Shutting down test server...');
        server.close(() => {
          console.log('✅ Test server stopped');
          process.exit(0);
        });
      });
    });
    
  } catch (error) {
    console.error('❌ Failed to start test server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Start the test server
startTestServer();