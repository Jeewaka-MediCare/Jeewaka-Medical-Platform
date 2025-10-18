import Rating from "./ratingModel.js";
import mongoose from "mongoose";

// Create or update a review
export const createOrUpdateReview = async (req, res) => {
  console.log("Received review data:", req.body); // Debugging line
  const { doctor, patient, rating, comment, createdAt } = req.body;

  try {
    

   

      // Create new review without appointment reference
      const newReview = await Rating.create({
        doctor: doctor,
        patient: patient,
        rating,
        comment,
      });

      return res
        .status(201)
        .json({ message: "Review created successfully", review: newReview , succuess: true});
    
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get all reviews for a doctor
export const getDoctorReviews = async (req, res) => {
  const { doctorId } = req.params;

  try {
    const reviews = await Rating.find({ doctor: doctorId }).populate(
      "patient",
      "name"
    );
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get average rating for a doctor
export const getDoctorAverageRating = async (req, res) => {
  const { doctorId } = req.params;

  try {
    const result = await Rating.aggregate([
      { $match: { doctor: new mongoose.Types.ObjectId(doctorId) } },
      {
        $group: {
          _id: "$doctor",
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    if (result.length > 0) {
      res.status(200).json(result[0]);
    } else {
      res.status(200).json({ avgRating: 0, totalReviews: 0 });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get review for a specific appointment
export const getAppointmentReview = async (req, res) => {
  const { appointmentId, patientId } = req.params;

  try {
    // Use the full appointmentId as unique identifier for time slot
    // This supports composite IDs like "sessionId_startTime_endTime" which uniquely identify each time slot
    const review = await Rating.findOne({
      appointment: appointmentId,
      patient: patientId,
    }).populate("patient", "name");

    res.status(200).json(review);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
