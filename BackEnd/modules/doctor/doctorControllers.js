import Doctor from './doctorModel.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateVertexEmbedding } from '../../utils/vertexAI.js';
import { registrationEmail } from '../email/templates/registrationEmail.js';


import Session from '../session/sessionModel.js';
import Rating from '../ratings/ratingModel.js';
import mongoose from 'mongoose';
import adminVerificationSchema from '../doctorCertificates/doctorCertificateModel.js';
import { sendRegistrationEmail } from '../email/emailService.js';


// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });



export const createDoctor = async (req, res) => {
  try {
    const data = req.body;

    const { email, name } = Array.isArray(data) ? data[0] : data;
    // Check if the request body is an array or single object
    if (Array.isArray(data)) {
      // Insert multiple doctors
      const insertedDoctors = await Doctor.insertMany(data);
      return res.status(201).json({
        message: "Doctors inserted successfully.",
        count: insertedDoctors.length,
        doctors: insertedDoctors
      });
    } else {
      // Insert a single doctor
      const newDoctor = new Doctor(data);
      const savedDoctor = await newDoctor.save();
      const email = savedDoctor.email;
      const name = savedDoctor.name;
      try {
        await sendRegistrationEmail(savedDoctor.email, savedDoctor.name, 'doctor');
      } catch (emailError) {
        console.error('⚠️ Doctor created but failed to send email:', emailError.message);
      }

      return res.status(201).json({
        message: "Doctor inserted successfully.",
        doctor: savedDoctor
      });
    }
  } catch (error) {
    console.error('Insert Doctors Error:', error.message);
    return res.status(500).json({ error: "Failed to insert doctor(s)", details: error.message });
  }
};


// Get all doctors
export const getDoctors = async (req, res) => {
  try {
    //const doctors = await Doctor.find();
    const doctors = await adminVerificationSchema.find().populate('doctorId');
    console.log("doctors",doctors)

    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDoctorByUuid = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ uuid: req.params.uuid });
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Search doctors with multiple filters
export const searchDoctors = async (req, res) => {
  try {
    const { 
      name, 
      specialization, 
      subSpecialization, 
      minExperience, 
      maxExperience, 
      language,
      minFee,
      maxFee,
      gender,
      page = 1, 
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build search query
    let searchQuery = {};

    // Name search (case-insensitive regex)
    if (name) {
      searchQuery.name = { $regex: name, $options: 'i' };
    }

    // Specialization search (case-insensitive regex)
    if (specialization) {
      searchQuery.specialization = { $regex: specialization, $options: 'i' };
    }

    // Sub-specialization search (case-insensitive regex)
    if (subSpecialization) {
      searchQuery.subSpecializations = { 
        $elemMatch: { $regex: subSpecialization, $options: 'i' } 
      };
    }

    // Years of experience filter
    if (minExperience || maxExperience) {
      searchQuery.yearsOfExperience = {};
      if (minExperience) searchQuery.yearsOfExperience.$gte = parseInt(minExperience);
      if (maxExperience) searchQuery.yearsOfExperience.$lte = parseInt(maxExperience);
    }

    // Language search (case-insensitive regex)
    if (language) {
      searchQuery.languagesSpoken = { 
        $elemMatch: { $regex: language, $options: 'i' } 
      };
    }

    // Consultation fee filter
    if (minFee || maxFee) {
      searchQuery.consultationFee = {};
      if (minFee) searchQuery.consultationFee.$gte = parseFloat(minFee);
      if (maxFee) searchQuery.consultationFee.$lte = parseFloat(maxFee);
    }

    // Gender filter
    if (gender) {
      searchQuery.gender = { $regex: gender, $options: 'i' };
    }

    // Sorting configuration
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute search query
    const doctors = await Doctor.find(searchQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v'); // Exclude version field

    // Get total count for pagination
    const totalDoctors = await Doctor.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalDoctors / parseInt(limit));

    // Response
    res.json({
      success: true,
      data: {
        doctors,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalDoctors,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1,
          limit: parseInt(limit)
        },
        filters: {
          name,
          specialization,
          subSpecialization,
          minExperience,
          maxExperience,
          language,
          minFee,
          maxFee,
          gender
        }
      }
    });

  } catch (error) {
    console.error('Search Doctors Error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: "Failed to search doctors", 
      details: error.message 
    });
  }
}

// Get unique values for filter dropdowns
export const getFilterOptions = async (req, res) => {
  try {
    const [specializations, subSpecializations, languages] = await Promise.all([
      Doctor.distinct('specialization').then(results => results.filter(Boolean)),
      Doctor.distinct('subSpecializations').then(results => results.filter(Boolean)),
      Doctor.distinct('languagesSpoken').then(results => results.filter(Boolean))
    ]);

    // Get experience range
    const experienceStats = await Doctor.aggregate([
      {
        $group: {
          _id: null,
          minExperience: { $min: '$yearsOfExperience' },
          maxExperience: { $max: '$yearsOfExperience' }
        }
      }
    ]);

    // Get fee range
    const feeStats = await Doctor.aggregate([
      {
        $group: {
          _id: null,
          minFee: { $min: '$consultationFee' },
          maxFee: { $max: '$consultationFee' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        specializations: specializations.sort(),
        subSpecializations: subSpecializations.sort(),
        languages: languages.sort(),
        experienceRange: experienceStats[0] || { minExperience: 0, maxExperience: 0 },
        feeRange: feeStats[0] || { minFee: 0, maxFee: 0 },
        genders: ['Male', 'Female', 'Other']
      }
    });

  } catch (error) {
    console.error('Get Filter Options Error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: "Failed to get filter options", 
      details: error.message 
    });
  }
}

// Get doctor by ID
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update doctor
export const updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.json({success:true , doctor:doctor});
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete doctor
export const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.json({ message: 'Doctor deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// AI-powered doctor search endpoint
export const aiSearchDoctors = async (req, res) => {
  try {
    const searchQuery = req.query.query;
    if (!searchQuery) {
      return res.status(400).json({ success: false, message: "Query is required" });
    }

    console.log("AI Search Query:", searchQuery);

    // 1. Generate embedding for the query
    const queryEmbedding = await generateVertexEmbedding(searchQuery);
    console.log("Query Embedding:", queryEmbedding);

    // 2. Run MongoDB vector search
    const matchedDoctors = await Doctor.aggregate([
      {
        $vectorSearch: {
          index: "doctor_index",       // your Atlas vector index
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 50,
          limit: 10
        }
      },
      {
        $project: {
          name: 1,
          specialization: 1,
          subSpecializations: 1,
          qualifications: 1,
          yearsOfExperience: 1,
          consultationFee: 1,
          bio: 1,
          score: { $meta: "vectorSearchScore" }
        }
      }
    ]);

    // 3. For each matched doctor, fetch sessions, ratings, etc.
    const doctorCards = await Promise.all(
      matchedDoctors.map(async (doc) => {
        const sessions = await Session.find({ doctorId: doc._id })
          .populate('hospital', 'name location')
          .lean();

        const ratingStats = await Rating.aggregate([
          { $match: { doctor: new mongoose.Types.ObjectId(doc._id) } },
          {
            $group: {
              _id: '$doctor',
              avgRating: { $avg: '$rating' },
              totalReviews: { $sum: 1 },
            },
          },
        ]);

        const ratingsWithComments = await Rating.find({ doctor: doc._id })
          .populate('patient', 'name')
          .select('rating comment createdAt patient')
          .sort({ createdAt: -1 })
          .lean();

        const avgRating = ratingStats.length > 0 ? ratingStats[0].avgRating : 0;
        const totalReviews = ratingStats.length > 0 ? ratingStats[0].totalReviews : 0;

        const safeSessions = sessions.map(s => ({
          ...s,
          hospital: s.hospital || { name: 'Unknown hospital', location: '' }
        }));

        return {
          doctor: doc,
          sessions: safeSessions,
          ratingSummary: {
            avgRating: parseFloat(avgRating.toFixed(1)),
            totalReviews,
            allRatings: ratingsWithComments,
          },
        };
      })
    );
    console.log("AI Matched Doctors Count:", doctorCards.length);
    console.log("doctrsare",doctorCards)

    res.status(200).json({ success: true, query: searchQuery, doctorCards });
    
  } catch (error) {
    console.error("AI Doctor Cards Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// AI interpretation function using Gemini
async function interpretSearchQuery(userQuery) {
  const prompt = `
You are a medical search assistant helping patients find doctors. Convert the following natural language query into structured search parameters.

Available database fields and their possible values:
- name: doctor's name (string)
- specialization: medical specialization (e.g., "Cardiology", "Oncology", "Pediatrics", "Dermatology", "Orthopedics", "Neurology", "Gynecology", "ENT", "Psychiatry")
- subSpecialization: array of subspecializations (e.g., "Radiation Oncology", "Interventional Cardiology")
- minExperience/maxExperience: years of experience (numbers)
- language: languages spoken (e.g., "English", "Tamil", "Sinhala")
- minFee/maxFee: consultation fee range (numbers)
- gender: "Male", "Female", "Other"

Common symptom to specialization mappings:
- Heart problems, chest pain, heartache → Cardiology
- Cancer, tumors → Oncology
- Skin issues, rashes → Dermatology
- Bone, joint pain → Orthopedics
- Brain, nerve issues → Neurology
- Women's health → Gynecology
- Ear, nose, throat → ENT
- Mental health, depression → Psychiatry
- Children's health → Pediatrics
- Nausea, bleeding, stomach issues → Internal Medicine or Gastroenterology

Location mentions like "around Badulla", "near Colombo" should be noted but can't be filtered (not in database).

User Query: "${userQuery}"

Respond in JSON format:
{
  "parameters": {
    // Only include parameters that can be determined from the query
    // Use exact field names: name, specialization, subSpecialization, minExperience, maxExperience, language, minFee, maxFee, gender
  },
  "interpretation": "Human-readable explanation of what was understood",
  "locationNote": "Any location mentions that couldn't be processed",
  "confidence": "high|medium|low"
}

Examples:
Query: "I need a female heart doctor"
Response: {"parameters": {"specialization": "Cardiology", "gender": "Female"}, "interpretation": "Looking for a female cardiologist", "confidence": "high"}

Query: "Tamil speaking oncologist with experience"
Response: {"parameters": {"specialization": "Oncology", "language": "Tamil", "minExperience": 5}, "interpretation": "Looking for an experienced Tamil-speaking oncologist", "confidence": "high"}

Query: "cheap consultation under 20 dollars"
Response: {"parameters": {"maxFee": 20}, "interpretation": "Looking for doctors with consultation fees under $20", "confidence": "high"}
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  try {
    // Handle markdown-wrapped JSON responses
    let jsonText = text;
    
    // Remove markdown JSON code blocks if present
    if (jsonText.includes('```json')) {
      jsonText = jsonText.replace(/```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.includes('```')) {
      jsonText = jsonText.replace(/```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Trim whitespace
    jsonText = jsonText.trim();
    
    const jsonResponse = JSON.parse(jsonText);
    return jsonResponse;
  } catch (parseError) {
    console.error('Failed to parse AI response:', text);
    throw new Error('Failed to parse AI response');
  }
}

// Basic fallback when AI fails
function basicKeywordFallback(query) {
  const searchParams = {};
  const lowerQuery = query.toLowerCase();

  // Basic specialization mapping
  const specializationMap = {
    'heart': 'Cardiology',
    'cardiology': 'Cardiology',
    'cardiologist': 'Cardiology',
    'cancer': 'Oncology',
    'oncology': 'Oncology',
    'oncologist': 'Oncology',
    'skin': 'Dermatology',
    'dermatology': 'Dermatology',
    'bone': 'Orthopedics',
    'joint': 'Orthopedics',
    'orthopedic': 'Orthopedics',
    'brain': 'Neurology',
    'neuro': 'Neurology',
    'mental': 'Psychiatry',
    'psychiatry': 'Psychiatry',
    'children': 'Pediatrics',
    'pediatric': 'Pediatrics',
    'women': 'Gynecology',
    'gynecology': 'Gynecology'
  };

  // Check for specializations
  for (const [keyword, specialization] of Object.entries(specializationMap)) {
    if (lowerQuery.includes(keyword)) {
      searchParams.specialization = specialization;
      break;
    }
  }

  // Check for gender
  if (lowerQuery.includes('female') || lowerQuery.includes('woman')) {
    searchParams.gender = 'Female';
  } else if (lowerQuery.includes('male') || lowerQuery.includes('man')) {
    searchParams.gender = 'Male';
  }

  // Check for languages
  if (lowerQuery.includes('tamil')) {
    searchParams.language = 'Tamil';
  } else if (lowerQuery.includes('sinhala') || lowerQuery.includes('sinhalese')) {
    searchParams.language = 'Sinhala';
  } else if (lowerQuery.includes('english')) {
    searchParams.language = 'English';
  }

  // Check for fee-related terms
  if (lowerQuery.includes('cheap') || lowerQuery.includes('affordable')) {
    searchParams.maxFee = 25;
  } else if (lowerQuery.includes('expensive') || lowerQuery.includes('premium')) {
    searchParams.minFee = 50;
  }

  // Extract numbers for potential fee limits
  const numbers = query.match(/\d+/g);
  if (numbers && (lowerQuery.includes('under') || lowerQuery.includes('below'))) {
    searchParams.maxFee = parseInt(numbers[0]);
  } else if (numbers && (lowerQuery.includes('above') || lowerQuery.includes('over'))) {
    searchParams.minFee = parseInt(numbers[0]);
  }

  // Check for experience
  if (lowerQuery.includes('experienced') || lowerQuery.includes('senior')) {
    searchParams.minExperience = 5;
  } else if (lowerQuery.includes('new') || lowerQuery.includes('junior')) {
    searchParams.maxExperience = 3;
  }

  return searchParams;
}

// Get AI search suggestions (optional endpoint for autocomplete)
export const getAISearchSuggestions = async (req, res) => {
  try {
    const { partialQuery } = req.query;

    if (!partialQuery || partialQuery.length < 2) {
      return res.json({
        success: true,
        data: {
          suggestions: []
        }
      });
    }

    const prompt = `
Based on the partial search query "${partialQuery}", suggest 3-5 complete search phrases that patients might be looking for when searching for doctors.

Consider these categories:
- Symptoms (heart pain, skin problems, etc.)
- Specializations (cardiologist, oncologist, etc.)
- Demographics (female doctor, experienced doctor, etc.)
- Languages (Tamil speaking, English speaking, etc.)
- Price ranges (affordable, under $30, etc.)

Return only a JSON array of suggestion strings:
["suggestion 1", "suggestion 2", "suggestion 3"]
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      // Handle markdown-wrapped JSON responses
      let jsonText = text;
      
      // Remove markdown JSON code blocks if present
      if (jsonText.includes('```json')) {
        jsonText = jsonText.replace(/```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.includes('```')) {
        jsonText = jsonText.replace(/```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Trim whitespace
      jsonText = jsonText.trim();
      
      const suggestions = JSON.parse(jsonText);
      res.json({
        success: true,
        data: {
          suggestions: Array.isArray(suggestions) ? suggestions : []
        }
      });
    } catch (parseError) {
      res.json({
        success: true,
        data: {
          suggestions: []
        }
      });
    }

  } catch (error) {
    console.error('AI Suggestions Error:', error.message);
    
    // Provide fallback suggestions when AI is unavailable
    const fallbackSuggestions = getFallbackSuggestions(partialQuery);
    
    res.json({
      success: true,
      data: {
        suggestions: fallbackSuggestions
      }
    });
  }
};

// Fallback suggestions when AI is unavailable
function getFallbackSuggestions(partialQuery) {
  const lowerQuery = partialQuery.toLowerCase();
  
  const commonSuggestions = [
    "heart doctor",
    "female doctor", 
    "Tamil speaking doctor",
    "cheap consultation under 30 dollars",
    "experienced cardiologist",
    "skin specialist",
    "brain doctor with experience",
    "children's doctor",
    "women's health doctor",
    "mental health specialist",
    "bone doctor",
    "cancer specialist",
    "eye doctor",
    "ENT specialist"
  ];

  // Filter suggestions based on partial query
  const filtered = commonSuggestions.filter(suggestion => 
    suggestion.toLowerCase().includes(lowerQuery) ||
    lowerQuery.split(' ').some(word => 
      word.length > 2 && suggestion.toLowerCase().includes(word)
    )
  );

  // If no filtered matches, return general suggestions
  if (filtered.length === 0) {
    return commonSuggestions.slice(0, 5);
  }

  return filtered.slice(0, 5);
}
