import express from 'express';
import { setUserRole } from './authControllers.js';

const router = express.Router();

// Set user role
router.post('/role', setUserRole);

export default router; 