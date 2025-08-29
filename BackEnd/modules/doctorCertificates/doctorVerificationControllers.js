import adminVerificationSchema from "./doctorCertificateModel.js";

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
