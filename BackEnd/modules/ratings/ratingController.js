import Rating from "./ratingModel.js";
import mongoose from "mongoose";


// Create or update a review
export const createOrUpdateReview = async (req, res) => {
  const { doctorId, patientId, rating, comment } = req.body;

  try {
    const existingReview = await Rating.findOne({ doctor: doctorId, patient: patientId });

    if (existingReview) {
      // Update existing review
      existingReview.rating = rating;
      existingReview.comment = comment;
      await existingReview.save();
      return res.status(200).json({ message: 'Review updated successfully', review: existingReview });
    }

    // Create new review
    const newReview = await Rating.create({
      doctor: doctorId,
      patient: patientId,
      rating,
      comment,
    });

    res.status(201).json({ message: 'Review created successfully', review: newReview });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get all reviews for a doctor
export const getDoctorReviews = async (req, res) => {
  const { doctorId } = req.params;

  try {
    const reviews = await Rating.find({ doctor: doctorId }).populate('patient', 'name');
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get average rating for a doctor
export const getDoctorAverageRating = async (req, res) => {
  const { doctorId } = req.params;

  try {
    const result = await Rating.aggregate([
      { $match: { doctor: new mongoose.Types.ObjectId(doctorId) } },
      { $group: {
          _id: '$doctor',
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    if (result.length > 0) {
      res.status(200).json(result[0]);
    } else {
      res.status(200).json({ avgRating: 0, totalReviews: 0 });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
