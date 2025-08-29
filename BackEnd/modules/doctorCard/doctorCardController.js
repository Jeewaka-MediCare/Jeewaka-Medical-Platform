// controller: doctorCardController.js

import Doctor from '../doctor/doctorModel.js';
import Session from '../session/sessionModel.js';
import Rating from '../ratings/ratingModel.js';
import mongoose from 'mongoose';

export const getAllDoctorCards = async (req, res) => {
  try {
    const doctors = await Doctor.find().lean();

    const doctorCards = await Promise.all(
      doctors.map(async (doctor) => {
        const sessions = await Session.find({ doctorId: doctor._id })
          .populate('hospital', 'name location')
          .lean();

        // Get average rating and total reviews
        const ratingStats = await Rating.aggregate([
          { $match: { doctor: new mongoose.Types.ObjectId(doctor._id) } },
          {
            $group: {
              _id: '$doctor',
              avgRating: { $avg: '$rating' },
              totalReviews: { $sum: 1 },
            },
          },
        ]);

        // Get all ratings with comments and patient info
        const ratingsWithComments = await Rating.find({ doctor: doctor._id })
          .populate('patient', 'name') // if you want to show who made the comment
          .select('rating comment createdAt patient')
          .sort({ createdAt: -1 }) // newest first
          .lean();

        const avgRating = ratingStats.length > 0 ? ratingStats[0].avgRating : 0;
        const totalReviews = ratingStats.length > 0 ? ratingStats[0].totalReviews : 0;

        // Ensure sessions have a safe hospital object when population fails
        const safeSessions = sessions.map(s => ({
          ...s,
          hospital: s.hospital || { name: 'Unknown hospital', location: '' }
        }));

        return {
          doctor,
          sessions: safeSessions,
          ratingSummary: {
            avgRating: parseFloat(avgRating.toFixed(1)),
            totalReviews,
            allRatings: ratingsWithComments, // all rating + comment list
          },
        };
      })
    );

    res.status(200).json(doctorCards);
  } catch (error) {
    console.error("Error fetching doctor cards:", error);
    res.status(500).json({ message: "Server error", error });
  }
};


export const getDoctorCardById = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: 'Invalid doctor ID' });
    }

    const doctor = await Doctor.findById(doctorId).lean();
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    let sessions = await Session.find({ doctorId: doctor._id })
      .populate('hospital', 'name location')
      .lean();

    // Fallback for any sessions where populate returned null
    sessions = sessions.map(s => ({
      ...s,
      hospital: s.hospital || { name: 'Unknown hospital', location: '' }
    }));

    // Rating summary
    const ratingStats = await Rating.aggregate([
      { $match: { doctor: new mongoose.Types.ObjectId(doctorId) } },
      {
        $group: {
          _id: '$doctor',
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    // Individual reviews with patient name
    const reviews = await Rating.find({ doctor: doctorId })
      .populate('patient', 'name') // Get patient name
      .select('rating comment patient')
      .sort({ createdAt: -1 })
      .lean();

    const avgRating = ratingStats.length > 0 ? ratingStats[0].avgRating : 0;
    const totalReviews = ratingStats.length > 0 ? ratingStats[0].totalReviews : 0;

    const doctorCard = {
      doctor,
      sessions,
      ratingSummary: {
        avgRating: parseFloat(avgRating.toFixed(1)),
        totalReviews
      },
      reviews: reviews.map(r => ({
        patientName: r.patient?.name || 'Anonymous',
        rating: r.rating,
        comment: r.comment
      }))
    };

    res.status(200).json(doctorCard);
  } catch (error) {
    console.error("Error fetching doctor card:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

