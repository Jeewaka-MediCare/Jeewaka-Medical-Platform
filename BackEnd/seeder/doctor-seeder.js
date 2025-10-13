import "dotenv/config";
import { connectDB } from "../shared/database.js";
import Doctor from "../modules/doctor/doctorModel.js";
import { generateVertexEmbedding } from "../utils/vertexAI.js";
import { v4 as uuidv4 } from 'uuid';

// Profile images
const MALE_PROFILE = "https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg";
const FEMALE_PROFILE = "https://images.pexels.com/photos/3781557/pexels-photo-3781557.jpeg";

// Medical specializations and related data
const specializations = [
  "Cardiology", "Dermatology", "Endocrinology", "Gastroenterology", 
  "Hematology", "Neurology", "Oncology", "Ophthalmology", 
  "Orthopedics", "Pediatrics", "Psychiatry", "Pulmonology",
  "Radiology", "Rheumatology", "Urology", "Emergency Medicine",
  "Family Medicine", "Internal Medicine", "Obstetrics and Gynecology",
  "Anesthesiology", "Pathology", "Surgery", "Dentistry", "ENT"
];

const subSpecializations = {
  "Cardiology": ["Interventional Cardiology", "Electrophysiology", "Heart Failure", "Preventive Cardiology"],
  "Dermatology": ["Cosmetic Dermatology", "Pediatric Dermatology", "Dermatopathology", "Mohs Surgery"],
  "Endocrinology": ["Diabetes Management", "Thyroid Disorders", "Reproductive Endocrinology", "Pediatric Endocrinology"],
  "Gastroenterology": ["Hepatology", "Inflammatory Bowel Disease", "Endoscopy", "Colorectal Cancer Screening"],
  "Neurology": ["Stroke Medicine", "Epilepsy", "Movement Disorders", "Pediatric Neurology"],
  "Oncology": ["Medical Oncology", "Radiation Oncology", "Surgical Oncology", "Pediatric Oncology"],
  "Orthopedics": ["Sports Medicine", "Joint Replacement", "Spine Surgery", "Pediatric Orthopedics"],
  "Pediatrics": ["Neonatology", "Pediatric Cardiology", "Pediatric Emergency Medicine", "Developmental Pediatrics"],
  "Psychiatry": ["Child Psychiatry", "Addiction Medicine", "Geriatric Psychiatry", "Forensic Psychiatry"],
  "Surgery": ["General Surgery", "Cardiac Surgery", "Neurosurgery", "Plastic Surgery"],
  "Obstetrics and Gynecology": ["Maternal-Fetal Medicine", "Reproductive Endocrinology", "Gynecologic Oncology", "Urogynecology"]
};

const qualifications = [
  "MBBS", "MD", "MS", "FRCS", "MRCP", "FRCOG", "FRCR", "FCPS",
  "DM", "MCh", "DNB", "DOMS", "DCH", "DGO", "DA", "DTCD"
];

const languages = ["English", "Sinhala", "Tamil", "Hindi", "Spanish", "French", "German", "Mandarin"];

const cities = [
  "Colombo", "Kandy", "Galle", "Jaffna", "Negombo", "Anuradhapura", 
  "Trincomalee", "Batticaloa", "Matara", "Kurunegala", "Ratnapura", "Badulla"
];

// Generate comprehensive bio descriptions
const generateBio = (doctor) => {
  const templates = [
    `Dr. ${doctor.name} is a highly experienced ${doctor.specialization} specialist with ${doctor.yearsOfExperience} years of dedicated practice. Specializing in ${doctor.subSpecializations.join(', ')}, Dr. ${doctor.name} has built a reputation for providing compassionate, evidence-based care. ${doctor.gender === 'Male' ? 'He' : 'She'} believes in a patient-centered approach, ensuring each individual receives personalized treatment tailored to their unique needs. Dr. ${doctor.name} stays current with the latest medical advances and is committed to excellence in patient care.`,
    
    `With ${doctor.yearsOfExperience} years in ${doctor.specialization}, Dr. ${doctor.name} brings extensive expertise to the field. ${doctor.gender === 'Male' ? 'His' : 'Her'} areas of special interest include ${doctor.subSpecializations.join(' and ')}. Dr. ${doctor.name} is known for ${doctor.gender === 'Male' ? 'his' : 'her'} thorough diagnostic approach and commitment to patient education. ${doctor.gender === 'Male' ? 'He' : 'She'} works closely with patients to develop comprehensive treatment plans that address both immediate concerns and long-term health goals.`,
    
    `Dr. ${doctor.name} is a dedicated ${doctor.specialization} physician with a passion for improving patient outcomes. Over ${doctor.yearsOfExperience} years of practice, ${doctor.gender === 'Male' ? 'he' : 'she'} has developed expertise in ${doctor.subSpecializations.join(', ')}. Dr. ${doctor.name} combines clinical excellence with a warm, empathetic approach, making patients feel comfortable and well-cared for. ${doctor.gender === 'Male' ? 'He' : 'She'} is committed to staying at the forefront of medical knowledge and technology to provide the best possible care.`,
    
    `As a board-certified ${doctor.specialization} specialist, Dr. ${doctor.name} has been serving patients for ${doctor.yearsOfExperience} years. ${doctor.gender === 'Male' ? 'His' : 'Her'} clinical interests focus on ${doctor.subSpecializations.join(' and ')}. Dr. ${doctor.name} is recognized for ${doctor.gender === 'Male' ? 'his' : 'her'} analytical skills and attention to detail in diagnosis and treatment. ${doctor.gender === 'Male' ? 'He' : 'She'} values building strong doctor-patient relationships and believes in involving patients in their healthcare decisions.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
};

// Static list of 50 doctors with diverse profiles
const doctors = [
  { name: "Dr. Amara Wijesinghe", gender: "Female", specialization: "Cardiology", city: "Colombo" },
  { name: "Dr. Saman Perera", gender: "Male", specialization: "Neurology", city: "Kandy" },
  { name: "Dr. Nimesha Fernando", gender: "Female", specialization: "Pediatrics", city: "Galle" },
  { name: "Dr. Rohan Silva", gender: "Male", specialization: "Orthopedics", city: "Colombo" },
  { name: "Dr. Priyanka Jayawardena", gender: "Female", specialization: "Dermatology", city: "Negombo" },
  { name: "Dr. Lasith Gunasekara", gender: "Male", specialization: "Emergency Medicine", city: "Jaffna" },
  { name: "Dr. Chathurika Mendis", gender: "Female", specialization: "Obstetrics and Gynecology", city: "Kandy" },
  { name: "Dr. Udara Rathnayake", gender: "Male", specialization: "Surgery", city: "Colombo" },
  { name: "Dr. Kavinda Wickramasinghe", gender: "Male", specialization: "Internal Medicine", city: "Anuradhapura" },
  { name: "Dr. Thilini Rajapaksa", gender: "Female", specialization: "Psychiatry", city: "Galle" },
  { name: "Dr. Nuwan Bandara", gender: "Male", specialization: "Radiology", city: "Trincomalee" },
  { name: "Dr. Sachini Amarasinghe", gender: "Female", specialization: "Endocrinology", city: "Colombo" },
  { name: "Dr. Dinesh Karunaratne", gender: "Male", specialization: "Gastroenterology", city: "Batticaloa" },
  { name: "Dr. Yashodha Senanayake", gender: "Female", specialization: "Oncology", city: "Matara" },
  { name: "Dr. Chamara Dissanayake", gender: "Male", specialization: "Urology", city: "Kurunegala" },
  { name: "Dr. Ruvini Weerasinghe", gender: "Female", specialization: "Ophthalmology", city: "Colombo" },
  { name: "Dr. Kasun Liyanage", gender: "Male", specialization: "Pulmonology", city: "Ratnapura" },
  { name: "Dr. Mihiri Cooray", gender: "Female", specialization: "Rheumatology", city: "Kandy" },
  { name: "Dr. Buddhika Herath", gender: "Male", specialization: "Anesthesiology", city: "Badulla" },
  { name: "Dr. Chathura Ratnayake", gender: "Male", specialization: "Family Medicine", city: "Galle" },
  { name: "Dr. Nilushi Pathirana", gender: "Female", specialization: "Hematology", city: "Colombo" },
  { name: "Dr. Mahesh Wickramarachchi", gender: "Male", specialization: "ENT", city: "Jaffna" },
  { name: "Dr. Dilani Samaraweera", gender: "Female", specialization: "Pathology", city: "Negombo" },
  { name: "Dr. Janaka Abeysekara", gender: "Male", specialization: "Dentistry", city: "Anuradhapura" },
  { name: "Dr. Sanduni Gamage", gender: "Female", specialization: "Cardiology", city: "Trincomalee" },
  { name: "Dr. Tharindu Jayasuriya", gender: "Male", specialization: "Neurology", city: "Batticaloa" },
  { name: "Dr. Hasini Wickramasinghe", gender: "Female", specialization: "Pediatrics", city: "Matara" },
  { name: "Dr. Asanka Fernando", gender: "Male", specialization: "Orthopedics", city: "Kurunegala" },
  { name: "Dr. Madhavi Wijesundara", gender: "Female", specialization: "Dermatology", city: "Ratnapura" },
  { name: "Dr. Gayan Mendis", gender: "Male", specialization: "Emergency Medicine", city: "Badulla" },
  { name: "Dr. Anusha Dias", gender: "Female", specialization: "Obstetrics and Gynecology", city: "Colombo" },
  { name: "Dr. Shaminda Rajapaksa", gender: "Male", specialization: "Surgery", city: "Kandy" },
  { name: "Dr. Nimali Karunaratne", gender: "Female", specialization: "Internal Medicine", city: "Galle" },
  { name: "Dr. Ravindu Silva", gender: "Male", specialization: "Psychiatry", city: "Jaffna" },
  { name: "Dr. Ishara Bandara", gender: "Male", specialization: "Radiology", city: "Negombo" },
  { name: "Dr. Lakshika Gunasekara", gender: "Female", specialization: "Endocrinology", city: "Anuradhapura" },
  { name: "Dr. Prasad Wickramasinghe", gender: "Male", specialization: "Gastroenterology", city: "Trincomalee" },
  { name: "Dr. Oshadi Perera", gender: "Female", specialization: "Oncology", city: "Batticaloa" },
  { name: "Dr. Chathura Herath", gender: "Male", specialization: "Urology", city: "Matara" },
  { name: "Dr. Malsha Cooray", gender: "Female", specialization: "Ophthalmology", city: "Kurunegala" },
  { name: "Dr. Supun Liyanage", gender: "Male", specialization: "Pulmonology", city: "Ratnapura" },
  { name: "Dr. Chathurani Dissanayake", gender: "Female", specialization: "Rheumatology", city: "Badulla" },
  { name: "Dr. Dhanushka Rajapaksa", gender: "Male", specialization: "Anesthesiology", city: "Colombo" },
  { name: "Dr. Kavitha Senanayake", gender: "Female", specialization: "Family Medicine", city: "Kandy" },
  { name: "Dr. Amila Weerasinghe", gender: "Male", specialization: "Hematology", city: "Galle" },
  { name: "Dr. Darshika Amarasinghe", gender: "Female", specialization: "ENT", city: "Jaffna" },
  { name: "Dr. Thushara Karunaratne", gender: "Male", specialization: "Pathology", city: "Negombo" },
  { name: "Dr. Sandamali Fernando", gender: "Female", specialization: "Dentistry", city: "Anuradhapura" },
  { name: "Dr. Chaminda Silva", gender: "Male", specialization: "Cardiology", city: "Trincomalee" },
  { name: "Dr. Iresha Pathirana", gender: "Female", specialization: "Neurology", city: "Batticaloa" }
];

// Generate random consultation fees based on specialization
const getConsultationFee = (specialization) => {
  const feeRanges = {
    "Cardiology": [8000, 15000],
    "Neurology": [7000, 12000],
    "Surgery": [10000, 20000],
    "Orthopedics": [6000, 12000],
    "Dermatology": [4000, 8000],
    "Pediatrics": [3000, 6000],
    "Emergency Medicine": [5000, 8000],
    "Family Medicine": [2500, 5000],
    "Internal Medicine": [4000, 7000],
    "Psychiatry": [5000, 10000],
    "Obstetrics and Gynecology": [6000, 12000],
    "Radiology": [7000, 12000],
    "Endocrinology": [6000, 10000],
    "Gastroenterology": [7000, 12000],
    "Oncology": [10000, 18000],
    "Urology": [6000, 11000],
    "Ophthalmology": [5000, 9000],
    "Pulmonology": [6000, 10000],
    "Rheumatology": [6000, 10000],
    "Anesthesiology": [8000, 15000],
    "Hematology": [7000, 12000],
    "ENT": [4000, 8000],
    "Pathology": [3000, 6000],
    "Dentistry": [2000, 5000]
  };
  
  const range = feeRanges[specialization] || [3000, 7000];
  return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
};

// Generate random email from name
const generateEmail = (name) => {
  const cleanName = name.replace("Dr. ", "").toLowerCase().replace(/\s+/g, ".");
  const domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${cleanName}@${domain}`;
};

// Generate random phone number
const generatePhone = () => {
  const prefixes = ["070", "071", "072", "075", "076", "077", "078"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return `${prefix}${number}`;
};

// Generate random date of birth (30-70 years old)
const generateDOB = () => {
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - Math.floor(Math.random() * 40 + 30); // 30-70 years old
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * 28) + 1;
  return new Date(birthYear, month, day);
};

// Generate registration number
const generateRegNo = () => {
  const year = Math.floor(Math.random() * 25) + 2000; // 2000-2024
  const number = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `SLMC${year}${number}`;
};

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();

    // Test embedding generation first before proceeding
    console.log("🔍 Testing Vertex AI embedding generation...");
    try {
      const testText = "Test doctor: Dr. John Smith, Cardiology specialist with 10 years experience";
      const testEmbedding = await generateVertexEmbedding(testText);
      console.log(`✅ Embedding test successful! Vector length: ${testEmbedding.length}`);
    } catch (error) {
      console.error("❌ Embedding generation failed:", error.message);
      console.error("⚠️ Cannot proceed with seeding without embedding capability");
      console.error("Please ensure Vertex AI is properly configured and accessible");
      process.exit(1);
    }

    // Clear existing doctor data
    await Doctor.deleteMany({});
    console.log("Cleared existing doctor data");

    // Process doctors and generate embeddings ONE BY ONE
    console.log(`\n📊 Starting to process ${doctors.length} doctors individually...`);
    let successCount = 0;
    let failedCount = 0;
    const createdDoctorIds = [];

    for (let i = 0; i < doctors.length; i++) {
      const doctor = doctors[i];
      try {
        console.log(`\n[${i + 1}/${doctors.length}] Processing doctor: ${doctor.name}`);
        
        // Generate random details
        const yearsOfExperience = Math.floor(Math.random() * 25) + 5; // 5-30 years
        const selectedSubSpecs = subSpecializations[doctor.specialization] || [];
        const doctorSubSpecs = selectedSubSpecs.slice(0, Math.floor(Math.random() * 3) + 1);
        const doctorQualifications = qualifications
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.floor(Math.random() * 4) + 2); // 2-5 qualifications
        const doctorLanguages = languages
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.floor(Math.random() * 3) + 2); // 2-4 languages
        
        const doctorDetails = {
          name: doctor.name,
          email: generateEmail(doctor.name),
          phone: generatePhone(),
          uuid: uuidv4(),
          gender: doctor.gender,
          profile: doctor.gender === "Male" ? MALE_PROFILE : FEMALE_PROFILE,
          dob: generateDOB(),
          specialization: doctor.specialization,
          subSpecializations: doctorSubSpecs,
          regNo: generateRegNo(),
          qualifications: doctorQualifications,
          yearsOfExperience: yearsOfExperience,
          languagesSpoken: doctorLanguages,
          consultationFee: getConsultationFee(doctor.specialization),
          sessions: []
        };

        // Generate bio
        doctorDetails.bio = generateBio(doctorDetails);

        // Generate comprehensive embedding for searchability using all relevant fields
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
          Location: ${doctor.city}
        `.trim();
        
        try {
          const embedding = await generateVertexEmbedding(embeddingText);
          doctorDetails.embedding = embedding;
          console.log(`   ✅ Generated embedding (${embedding.length} dimensions)`);
        } catch (error) {
          if (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('Quota exceeded')) {
            console.warn(`   ⚠️ Quota exhausted for ${doctor.name}. Waiting 1m 20s before retry...`);
            await new Promise(resolve => setTimeout(resolve, 80000)); // 80 seconds = 1m 20s
            
            // Retry after waiting
            try {
              console.log(`   🔄 Retrying embedding generation for ${doctor.name}...`);
              const embedding = await generateVertexEmbedding(embeddingText);
              doctorDetails.embedding = embedding;
              console.log(`   ✅ Generated embedding after retry (${embedding.length} dimensions)`);
            } catch (retryError) {
              console.error(`   ❌ Retry failed for ${doctor.name}: ${retryError.message}`);
              throw retryError;
            }
          } else {
            throw error; // Re-throw other types of errors
          }
        }

        // Save individual doctor to database
        const createdDoctor = await Doctor.create(doctorDetails);
        createdDoctorIds.push(createdDoctor._id);
        successCount++;
        console.log(`   ✅ Saved to database (ID: ${createdDoctor._id})`);

      } catch (error) {
        failedCount++;
        console.error(`   ❌ Failed to process ${doctor.name}: ${error.message}`);
        
        // If it's a quota error, stop the entire process
        if (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('Quota exceeded')) {
          break;
        }
        
        // For other errors, continue with next doctor
        console.log(`   ⏭️ Continuing with next doctor...`);
      }
    }

    // Final summary
    const totalInDatabase = await Doctor.countDocuments();
    console.log("\n" + "=".repeat(60));
    console.log("📊 DOCTOR SEEDING SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Successfully processed: ${successCount} doctors`);
    console.log(`❌ Failed to process: ${failedCount} doctors`);
    console.log(`📊 Total doctors now in database: ${totalInDatabase}`);
    console.log(`🆔 Created doctor IDs: [${createdDoctorIds.slice(0, 5).join(', ')}${createdDoctorIds.length > 5 ? '...' : ''}]`);
    
    if (successCount > 0) {
      console.log("\n🎉 Seeding completed with some success!");
      console.log("💡 To continue seeding remaining doctors, you can:");
      console.log("   1. Wait for quota reset (usually 24 hours)");
      console.log("   2. Request quota increase from Google Cloud Console");
      console.log("   3. Modify the seeder to start from position", successCount + failedCount + 1);
    } else {
      console.log("\n⚠️ No doctors were successfully seeded.");
    }
    process.exit(0);
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

// Run the seed script
seedDatabase();
