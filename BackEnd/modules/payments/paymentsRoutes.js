import express from 'express';
import { createPaymentIntent, handleWebhook } from './paymentsController.js';

const router = express.Router();

// Create payment intent
router.post('/create-intent', createPaymentIntent);

// Stripe webhook endpoint (requires raw body)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

export default router;
