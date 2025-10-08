import Stripe from 'stripe';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Patient from '../patient/patientModel.js';

dotenv.config();

let stripe;
try {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder_key_replace_with_real_sandbox_key') {
    throw new Error('Stripe secret key not configured');
  }
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} catch (error) {
  console.warn('Stripe not configured:', error.message);
  stripe = null;
}

export const createPaymentIntent = async (req, res) => {
  try {
    console.log('🔐 PaymentController - createPaymentIntent called');
    console.log('🔐 PaymentController - Authenticated user:', req.user);
    console.log('🔐 PaymentController - Request body:', JSON.stringify(req.body, null, 2));

    if (!stripe) {
      return res.status(500).json({
        error: 'Stripe not configured. Please set STRIPE_SECRET_KEY in .env file with your sandbox secret key from https://dashboard.stripe.com/test/apikeys'
      });
    }

    // Verify user is authenticated
    if (!req.user || !req.user.uid) {
      console.log('🔐 PaymentController - No authenticated user found');
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'You must be logged in to create a payment' 
      });
    }

    const { amount, currency = 'usd', metadata = {} } = req.body;

    console.log('🔐 PaymentController - Extracted data:');
    console.log('🔐 PaymentController - Amount:', amount);
    console.log('🔐 PaymentController - Currency:', currency);
    console.log('🔐 PaymentController - Metadata:', JSON.stringify(metadata, null, 2));

    if (!amount || amount <= 0) {
      console.log('🔐 PaymentController - Amount validation failed:', { amount, isValid: amount > 0 });
      return res.status(400).json({ error: 'Amount is required and must be greater than 0' });
    }

    // SECURITY: Look up patient by authenticated user's Firebase UID
    // Do NOT trust patientId from request body
    console.log('🔐 PaymentController - Looking up patient by Firebase UID:', req.user.uid);
    const patient = await Patient.findOne({ uuid: req.user.uid });
    
    if (!patient) {
      console.log('🔐 PaymentController - Patient not found for Firebase UID:', req.user.uid);
      return res.status(400).json({ 
        error: 'Patient profile not found',
        message: 'Your account is not properly set up. Please complete your profile or contact support.',
        debug: {
          firebaseUid: req.user.uid,
          suggestion: 'Log out and log in again to refresh your session'
        }
      });
    }

    console.log('🔐 PaymentController - Patient found:', {
      mongoId: patient._id.toString(),
      firebaseUid: patient.uuid,
      name: patient.name,
      email: patient.email
    });

    // Validate required metadata for webhook processing
    console.log('🔐 PaymentController - Validating metadata fields:');
    console.log('🔐 PaymentController - sessionId:', metadata.sessionId, 'Type:', typeof metadata.sessionId);
    console.log('🔐 PaymentController - slotIndex:', metadata.slotIndex, 'Type:', typeof metadata.slotIndex);

    // Accept slotIndex = 0 (valid index). Check for null or undefined explicitly.
    const missingSessionId = metadata.sessionId === null || metadata.sessionId === undefined || metadata.sessionId === '';
    const missingSlotIndex = metadata.slotIndex === null || metadata.slotIndex === undefined;

    if (missingSessionId || missingSlotIndex) {
      console.log('🔐 PaymentController - Metadata validation FAILED!');
      console.log('🔐 PaymentController - Missing fields:', {
        sessionId: missingSessionId,
        slotIndex: missingSlotIndex
      });
      return res.status(400).json({
        error: 'Metadata must include sessionId and slotIndex for webhook processing'
      });
    }

    console.log('🔐 PaymentController - Metadata validation PASSED!');

    // Use verified patient ID from database lookup (SECURE)
    const verifiedMetadata = {
      ...metadata,
      patientId: patient._id.toString(),  // ← MongoDB ObjectId (verified)
      firebaseUid: req.user.uid,           // ← Firebase UID (verified)
      patientName: patient.name,
      patientEmail: patient.email
    };

    console.log('🔐 PaymentController - Creating payment with verified metadata:', verifiedMetadata);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: verifiedMetadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('🔐 PaymentController - Payment intent created successfully:', paymentIntent.id);

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('🔐 PaymentController - Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
};

export const handleWebhook = async (req, res) => {
  try {
    if (!stripe) {
      console.error('Stripe not configured for webhook');
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      console.error('Stripe webhook secret not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: error.message });
  }
};

const handlePaymentSuccess = async (paymentIntent) => {
  try {
    console.log('Processing payment success for:', paymentIntent.id);

    // Extract metadata from payment intent
    const { sessionId, slotIndex, patientId } = paymentIntent.metadata || {};

    if (!sessionId || slotIndex === undefined || slotIndex === null || !patientId) {
      console.error('Missing required metadata in payment intent:', paymentIntent.metadata);
      return;
    }

    // Resolve patientId: if it's not a valid ObjectId, try to find a Patient by uuid (frontend Firebase UID)
    let resolvedPatientId = patientId;
    try {
      if (!mongoose.Types.ObjectId.isValid(patientId)) {
        const patientDoc = await Patient.findOne({ uuid: patientId });
        if (!patientDoc) {
          console.error('Webhook - No patient found for provided id/uuid:', patientId);
          return;
        }
        resolvedPatientId = patientDoc._id;
        console.log('Webhook - Resolved patientId to _id', { original: patientId, resolved: resolvedPatientId });
      }
    } catch (resolveErr) {
      console.error('Webhook - Error resolving patientId:', resolveErr);
      return;
    }

    // Import Session model dynamically to avoid circular dependencies
    const { default: Session } = await import('../session/sessionModel.js');

    // Find the session and update the specific time slot
    const session = await Session.findById(sessionId);
    if (!session) {
      console.error('Session not found:', sessionId);
      return;
    }

    const slotIdx = parseInt(slotIndex);
    if (slotIdx < 0 || slotIdx >= session.timeSlots.length) {
      console.error('Invalid slot index:', slotIdx);
      return;
    }

    const timeSlot = session.timeSlots[slotIdx];

    // Check if slot is still available
    if (timeSlot.status !== 'available') {
      console.log('Slot already booked or unavailable:', timeSlot.status);
      return;
    }

    // Update the time slot with payment and booking details
    timeSlot.status = 'booked';
    // Assign resolved Patient._id so Mongoose stores an ObjectId
    timeSlot.patientId = resolvedPatientId;
    timeSlot.paymentIntentId = paymentIntent.id;
    timeSlot.paymentAmount = paymentIntent.amount / 100; // Convert from cents
    timeSlot.paymentCurrency = paymentIntent.currency;
    timeSlot.paymentDate = new Date();

    await session.save();

    console.log('Successfully booked appointment via webhook:', {
      sessionId,
      slotIndex: slotIdx,
      patientId,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Error processing payment success:', error);
  }
};

const handlePaymentFailure = async (paymentIntent) => {
  try {
    console.log('Processing payment failure for:', paymentIntent.id);

    // Extract metadata from payment intent
    const { sessionId, slotIndex } = paymentIntent.metadata;

    if (!sessionId || !slotIndex) {
      console.error('Missing required metadata in failed payment intent:', paymentIntent.metadata);
      return;
    }

    // Import Session model dynamically to avoid circular dependencies
    const { default: Session } = await import('../session/sessionModel.js');

    // Find the session and log the failure
    const session = await Session.findById(sessionId);
    if (!session) {
      console.error('Session not found for failed payment:', sessionId);
      return;
    }

    const slotIdx = parseInt(slotIndex);
    if (slotIdx < 0 || slotIdx >= session.timeSlots.length) {
      console.error('Invalid slot index for failed payment:', slotIdx);
      return;
    }

    // Log the payment failure (slot remains available for other attempts)
    console.log('Payment failed - slot remains available:', {
      sessionId,
      slotIndex: slotIdx,
      paymentIntentId: paymentIntent.id,
      failureReason: paymentIntent.last_payment_error?.message || 'Unknown'
    });

  } catch (error) {
    console.error('Error processing payment failure:', error);
  }
};
