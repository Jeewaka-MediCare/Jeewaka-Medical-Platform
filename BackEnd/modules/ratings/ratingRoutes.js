import express from 'express';
import {
  createOrUpdateReview,
  getDoctorReviews,
  getDoctorAverageRating,
} from './ratingController.js';

const ratingRouter = express.Router();

// POST or PUT a review (create or update)
ratingRouter.post('/', createOrUpdateReview);

// GET all reviews for a doctor
ratingRouter.get('/doctor/:doctorId', getDoctorReviews);

// GET average rating for a doctor
ratingRouter.get('/doctor/:doctorId/average', getDoctorAverageRating);

export default ratingRouter;
