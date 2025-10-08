import express from 'express';
import { createPaymentIntent, handleWebhook } from './paymentsController.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';

const router = express.Router();

// ============================================
// AUTHENTICATED ROUTES
// ============================================

// Create payment intent (requires authentication)
// Users must be logged in to make payments
router.post('/create-intent', 
  authMiddleware, 
  createPaymentIntent
);

// ============================================
// WEBHOOK ROUTES (Stripe signature verification)
// ============================================

// Stripe webhook endpoint (requires raw body, verified by Stripe signature)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

export default router;
