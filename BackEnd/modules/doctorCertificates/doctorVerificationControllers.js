import adminVerificationSchema from "./doctorCertificateModel.js";
import storageService from "../../services/supabaseStorageService.js";
import multer from "multer";
import path from "path";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, PNG, DOC, DOCX files are allowed.'));
    }
  }
});

// Export upload middleware
export const uploadMiddleware = upload.single('document');

export const createVerification = async (req, res) => {
    
    try {
        const { doctorId, certificates } = req.body;
    
        // Check if a verification request already exists for this doctor
        const existingRequest = await adminVerificationSchema.findOne({ doctorId });
        if (existingRequest) {
        return res.status(400).json({ message: "Verification request already exists for this doctor." });
        }
    
        const newVerification = new adminVerificationSchema({
        doctorId,
        certificates,
        });
    
        await newVerification.save();
        res.status(201).json({ message: "Verification request created successfully.", verification: newVerification });
    } catch (error) {
        console.error("Error creating verification request:", error);
        res.status(500).json({ message: "Server error", error });
    }
}

export const getAllVerifications = async (req, res) => {
    try {
        const verifications = await adminVerificationSchema.find().populate('doctorId')
        .populate('doctorId', 'name email'); // Populate doctor details (name and email)
        res.status(200).json(verifications);
    } catch (error) {
        console.error("Error fetching verification requests:", error);
        res.status(500).json({ message: "Server error", error });
    }
}
export const updateVerificationStatus = async (req, res) => {
    const { doctorId } = req.params; // doctor ID from route
  const updates = req.body;         // fields to update

  try {
    // Find the document by doctorId and update
    const updatedCertificate = await DoctorCertificate.findOneAndUpdate(
      { doctorId },
      { $set: updates },
      { new: true, runValidators: true } // return updated doc
    );

    if (!updatedCertificate) {
      return res.status(404).json({ message: "Doctor certificate not found" });
    }

    res.status(200).json(updatedCertificate);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating certificate", error });
  }
}

// Upload doctor verification document
export const uploadDoctorDocument = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!doctorId) {
      return res.status(400).json({ message: "Doctor ID is required" });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = path.extname(file.originalname);
    const filename = `${file.originalname.replace(fileExt, '')}_${timestamp}${fileExt}`;

    // Upload to Supabase storage
    const uploadResult = await storageService.uploadDoctorDocument(
      doctorId,
      file.buffer,
      filename
    );

    res.status(200).json({
      message: "Document uploaded successfully",
      document: uploadResult
    });

  } catch (error) {
    console.error("Error uploading doctor document:", error);
    res.status(500).json({ 
      message: "Failed to upload document", 
      error: error.message 
    });
  }
};

export const getVerificationByDoctorId = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!doctorId) {
      return res.status(400).json({ message: "Doctor ID is required" });
    }

    const verification = await adminVerificationSchema.find({"doctorId":doctorId});

    if (!verification) {
      
      return res.status(404).json({ message: "Verification not found" });


    }
    res.status(200).json(verification);
  } catch (error) {
    console.error("Error getting verification:", error);
    res.status(500).json({ message: "Failed to get verification", error: error.message });
  }
};

// Get all documents for a doctor
export const getDoctorDocuments = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!doctorId) {
      return res.status(400).json({ message: "Doctor ID is required" });
    }

    const documents = await storageService.listDoctorDocuments(doctorId);

    res.status(200).json({
      message: "Documents retrieved successfully",
      documents
    });

  } catch (error) {
    console.error("Error getting doctor documents:", error);
    res.status(500).json({ 
      message: "Failed to retrieve documents", 
      error: error.message 
    });
  }
};

// Delete a doctor document
export const deleteDoctorDocument = async (req, res) => {
  try {
    const { doctorId, filename } = req.params;

    if (!doctorId || !filename) {
      return res.status(400).json({ message: "Doctor ID and filename are required" });
    }

    const result = await storageService.deleteDoctorDocument(doctorId, filename);

    res.status(200).json({
      message: "Document deleted successfully",
      result
    });

  } catch (error) {
    console.error("Error deleting doctor document:", error);
    res.status(500).json({ 
      message: "Failed to delete document", 
      error: error.message 
    });
  }
};
