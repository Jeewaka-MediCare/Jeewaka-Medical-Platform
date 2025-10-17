import express from 'express';
import { setUserRole, updateUserRole, getUserRole } from './authControllers.js';
import { authMiddleware, requireRole } from '../../middleware/authMiddleware.js';

const authRouter = express.Router();

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

/**
 * POST /api/auth/role
 * Set user role during registration
 * Body: { uid: string, role: 'patient' | 'doctor' }
 * Note: Only allows setting patient/doctor roles, not admin
 */
authRouter.post('/role', setUserRole);

// ============================================
// AUTHENTICATED ROUTES
// ============================================

/**
 * GET /api/auth/users/:uid/role
 * Get user's role and custom claims
 * Requires: Authentication
 */
authRouter.get('/users/:uid/role', authMiddleware, getUserRole);

// ============================================
// ADMIN ONLY ROUTES
// ============================================

/**
 * PUT /api/auth/users/:uid/role
 * Update any user's role (admin only)
 * Body: { uid: string, role: 'patient' | 'doctor' | 'admin' }
 * Requires: Authentication + Admin role
 */
authRouter.put('/users/:uid/role', 
  authMiddleware, 
  requireRole(['admin']), 
  updateUserRole
);

export default authRouter; 