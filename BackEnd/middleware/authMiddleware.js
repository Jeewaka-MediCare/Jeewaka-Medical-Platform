import admin from '../config/fireBaseAdmin.js';

/**
 * Authentication Middleware
 * Verifies Firebase ID token from Authorization header
 * Sets req.user with decoded token information
 */
export const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No authorization header found');
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'No valid authorization header found' 
      });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Set user context
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role || 'patient',
      name: decodedToken.name || decodedToken.email
    };
    
    console.log('Authenticated user:', req.user.uid, req.user.role);
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({ 
      error: 'Invalid or expired token',
      message: error.message 
    });
  }
};

/**
 * Optional Authentication Middleware
 * Attempts to authenticate but doesn't fail if no token provided
 * Useful for endpoints that work with or without authentication
 */
export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No auth header, continue without setting req.user
      next();
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role || 'patient',
      name: decodedToken.name || decodedToken.email
    };
    
    console.log('Optional auth - authenticated user:', req.user.uid, req.user.role);
  } catch (error) {
    console.log('Optional auth - token invalid, continuing without auth:', error.message);
  }
  
  next();
};

/**
 * Role-based Authorization Middleware Factory
 * Creates middleware that checks if authenticated user has required role
 * @param {string[]} allowedRoles - Array of allowed roles
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'You must be logged in to access this resource' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: `This resource requires one of the following roles: ${allowedRoles.join(', ')}` 
      });
    }

    console.log('Role authorization passed:', req.user.role, 'allowed:', allowedRoles);
    next();
  };
};

export default authMiddleware;
