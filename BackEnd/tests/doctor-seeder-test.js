import dotenv from "dotenv";
import { connectDB } from "../shared/database.js";
import Doctor from "../modules/doctor/doctorModel.js";
import { generateVertexEmbedding } from "../utils/vertexAI.js";
import { v4 as uuidv4 } from 'uuid';

// Load environment variables from the BackEnd directory
dotenv.config({ path: './.env' });

// Profile images
const MALE_PROFILE = "https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg";
const FEMALE_PROFILE = "https://images.pexels.com/photos/3781557/pexels-photo-3781557.jpeg";

// Test doctor data
const testDoctor = {
  name: "Dr. Amara Wijesinghe",
  gender: "Female",
  specialization: "Cardiology",
  city: "Colombo"
};

// Medical data arrays (same as seeder)
const subSpecializations = {
  "Cardiology": ["Interventional Cardiology", "Electrophysiology", "Heart Failure", "Preventive Cardiology"]
};

const qualifications = [
  "MBBS", "MD", "MS", "FRCS", "MRCP", "FRCOG", "FRCR", "FCPS",
  "DM", "MCh", "DNB", "DOMS", "DCH", "DGO", "DA", "DTCD"
];

const languages = ["English", "Sinhala", "Tamil", "Hindi"];

// Helper functions (same as seeder)
const getConsultationFee = (specialization) => {
  const feeRanges = {
    "Cardiology": [8000, 15000],
    "Neurology": [7000, 12000],
    "Surgery": [10000, 20000],
    "Orthopedics": [6000, 12000]
  };
  
  const range = feeRanges[specialization] || [3000, 7000];
  return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
};

const generateEmail = (name) => {
  const cleanName = name.replace("Dr. ", "").toLowerCase().replace(/\s+/g, ".");
  return `${cleanName}@test.com`;
};

const generatePhone = () => {
  const prefixes = ["070", "071", "072"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return `${prefix}${number}`;
};

const generateDOB = () => {
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - 45; // Fixed age for test consistency
  return new Date(birthYear, 5, 15); // June 15th
};

const generateRegNo = () => {
  return `SLMC2020TEST001`;
};

const generateBio = (doctor) => {
  return `Dr. ${doctor.name} is a highly experienced ${doctor.specialization} specialist with ${doctor.yearsOfExperience} years of dedicated practice. Specializing in ${doctor.subSpecializations.join(', ')}, Dr. ${doctor.name} has built a reputation for providing compassionate, evidence-based care. She believes in a patient-centered approach, ensuring each individual receives personalized treatment tailored to their unique needs. Dr. ${doctor.name} stays current with the latest medical advances and is committed to excellence in patient care.`;
};

/**
 * Test function to create a single doctor account with full validation
 */
const testCreateDoctorAccount = async () => {
  console.log("🧪 DOCTOR ACCOUNT CREATION TEST");
  console.log("=".repeat(50));
  
  // Debug environment variables
  console.log("🔧 Environment Check:");
  console.log(`   MONGO_URI: ${process.env.MONGO_URI ? 'Set' : 'Missing'}`);
  console.log(`   GOOGLE_CLOUD_PROJECT_ID: ${process.env.GOOGLE_CLOUD_PROJECT_ID ? 'Set' : 'Missing'}`);
  console.log(`   GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'Set' : 'Missing'}`);
  console.log("");
  
  try {
    // Step 1: Connect to database
    console.log("📡 Connecting to database...");
    await connectDB();
    console.log("✅ Database connected successfully");

    // Step 2: Test embedding generation first
    console.log("\n🔍 Testing Vertex AI embedding generation...");
    try {
      const testText = "Test doctor: Dr. John Smith, Cardiology specialist with 10 years experience";
      const testEmbedding = await generateVertexEmbedding(testText);
      console.log(`✅ Embedding test successful! Vector length: ${testEmbedding.length}`);
    } catch (error) {
      console.error("❌ Embedding generation failed:", error.message);
      console.error("⚠️ Cannot proceed with test without embedding capability");
      process.exit(1);
    }

    // Step 3: Clean up any existing test doctor
    console.log("\n🧹 Cleaning up existing test data...");
    await Doctor.deleteOne({ regNo: generateRegNo() });
    console.log("✅ Cleanup completed");

    // Step 4: Generate doctor details
    console.log("\n👨‍⚕️ Generating doctor details...");
    const yearsOfExperience = 12; // Fixed for test consistency
    const selectedSubSpecs = subSpecializations[testDoctor.specialization] || [];
    const doctorSubSpecs = selectedSubSpecs.slice(0, 2); // Take first 2
    const doctorQualifications = ["MBBS", "MD", "MRCP"]; // Fixed qualifications
    const doctorLanguages = ["English", "Sinhala", "Tamil"]; // Fixed languages
    
    const doctorDetails = {
      name: testDoctor.name,
      email: generateEmail(testDoctor.name),
      phone: generatePhone(),
      uuid: uuidv4(),
      gender: testDoctor.gender,
      profile: testDoctor.gender === "Male" ? MALE_PROFILE : FEMALE_PROFILE,
      dob: generateDOB(),
      specialization: testDoctor.specialization,
      subSpecializations: doctorSubSpecs,
      regNo: generateRegNo(),
      qualifications: doctorQualifications,
      yearsOfExperience: yearsOfExperience,
      languagesSpoken: doctorLanguages,
      consultationFee: getConsultationFee(testDoctor.specialization),
      sessions: []
    };

    // Generate bio
    doctorDetails.bio = generateBio(doctorDetails);

    console.log("✅ Doctor details generated:");
    console.log(`   Name: ${doctorDetails.name}`);
    console.log(`   Email: ${doctorDetails.email}`);
    console.log(`   Phone: ${doctorDetails.phone}`);
    console.log(`   Specialization: ${doctorDetails.specialization}`);
    console.log(`   Sub-specializations: ${doctorDetails.subSpecializations.join(', ')}`);
    console.log(`   Registration: ${doctorDetails.regNo}`);
    console.log(`   Experience: ${doctorDetails.yearsOfExperience} years`);
    console.log(`   Consultation Fee: LKR ${doctorDetails.consultationFee}`);

    // Step 5: Generate comprehensive embedding
    console.log("\n🤖 Generating AI embedding...");
    const embeddingText = `
      Name: ${doctorDetails.name}
      Email: ${doctorDetails.email}
      Phone: ${doctorDetails.phone}
      UUID: ${doctorDetails.uuid}
      Gender: ${doctorDetails.gender}
      Date of Birth: ${doctorDetails.dob.toISOString().split('T')[0]}
      Specialization: ${doctorDetails.specialization}
      Sub-specializations: ${doctorDetails.subSpecializations.join(', ')}
      Registration Number: ${doctorDetails.regNo}
      Qualifications: ${doctorDetails.qualifications.join(', ')}
      Years of Experience: ${doctorDetails.yearsOfExperience} years
      Languages Spoken: ${doctorDetails.languagesSpoken.join(', ')}
      Bio: ${doctorDetails.bio}
      Consultation Fee: ${doctorDetails.consultationFee} LKR
      Location: ${testDoctor.city}
    `.trim();

    try {
      const embedding = await generateVertexEmbedding(embeddingText);
      doctorDetails.embedding = embedding;
      console.log(`✅ Generated embedding with ${embedding.length} dimensions`);
    } catch (error) {
      console.error(`❌ Failed to generate embedding:`, error.message);
      throw new Error(`Embedding generation failed. Aborting test.`);
    }

    // Step 6: Save to database
    console.log("\n💾 Saving doctor to database...");
    const createdDoctor = await Doctor.create(doctorDetails);
    console.log(`✅ Doctor account created successfully!`);
    console.log(`   Database ID: ${createdDoctor._id}`);
    console.log(`   Created at: ${createdDoctor.createdAt}`);

    // Step 7: Verify the created doctor
    console.log("\n🔍 Verifying created doctor...");
    const verifyDoctor = await Doctor.findOne({ regNo: doctorDetails.regNo });
    
    if (!verifyDoctor) {
      throw new Error("Doctor not found in database after creation");
    }

    console.log("✅ Doctor verification successful:");
    console.log(`   Found doctor: ${verifyDoctor.name}`);
    console.log(`   Embedding dimensions: ${verifyDoctor.embedding ? verifyDoctor.embedding.length : 'No embedding'}`);
    console.log(`   All required fields present: ${
      verifyDoctor.name && 
      verifyDoctor.email && 
      verifyDoctor.phone && 
      verifyDoctor.specialization && 
      verifyDoctor.regNo ? 'Yes' : 'No'
    }`);

    // Step 8: Test summary
    console.log("\n" + "=".repeat(50));
    console.log("🎉 DOCTOR ACCOUNT CREATION TEST COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(50));
    console.log("✅ Database connection established");
    console.log("✅ Vertex AI embedding generation working");
    console.log("✅ Doctor account created with all fields");
    console.log("✅ Comprehensive embedding generated and stored");
    console.log("✅ Database verification passed");
    console.log("\n📋 Test Results:");
    console.log(`   Doctor ID: ${createdDoctor._id}`);
    console.log(`   Registration: ${createdDoctor.regNo}`);
    console.log(`   Embedding Size: ${createdDoctor.embedding.length} dimensions`);
    console.log(`   Created: ${createdDoctor.createdAt}`);

    process.exit(0);

  } catch (error) {
    console.error("\n❌ DOCTOR ACCOUNT CREATION TEST FAILED!");
    console.error("=".repeat(50));
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
};

// Run the test
testCreateDoctorAccount();