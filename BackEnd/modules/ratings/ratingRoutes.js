import express from 'express';
import {
  createOrUpdateReview,
  getDoctorReviews,
  getDoctorAverageRating,
} from './ratingController.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';

const ratingRouter = express.Router();

// ============================================
// PUBLIC ROUTES - View Ratings
// ============================================

// GET all reviews for a doctor (public - anyone can read reviews)
ratingRouter.get('/doctor/:doctorId', getDoctorReviews);

// GET average rating for a doctor (public - display on doctor cards)
ratingRouter.get('/doctor/:doctorId/average', getDoctorAverageRating);

// ============================================
// AUTHENTICATED ROUTES - Submit Reviews
// ============================================

// POST or PUT a review (requires authentication - prevents spam reviews)
// Users must be logged in to post reviews
ratingRouter.post('/', 
  authMiddleware, 
  createOrUpdateReview
);

export default ratingRouter;
