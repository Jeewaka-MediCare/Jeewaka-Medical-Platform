import Doctor from './doctorModel.js';



export const createDoctor = async (req, res) => {
  try {
    const data = req.body;

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
    const doctors = await Doctor.find();
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
