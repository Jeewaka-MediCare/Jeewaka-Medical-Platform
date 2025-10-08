# Backend Middleware Documentation

This directory contains reusable middleware for the Jeewaka Medical Platform backend.

## Available Middleware

### 1. Authentication Middleware (`authMiddleware.js`)

#### `authMiddleware`
Verifies Firebase ID token from Authorization header and sets `req.user`.

**Usage:**
```javascript
import { authMiddleware } from '../../middleware/authMiddleware.js';

// Protect a route - requires valid auth token
router.get('/protected-route', authMiddleware, (req, res) => {
  // req.user is available here
  res.json({ user: req.user });
});
```

**Sets `req.user` with:**
- `uid` - Firebase user ID
- `email` - User email
- `role` - User role (doctor, patient, admin)
- `name` - User display name

---

#### `optionalAuthMiddleware`
Attempts to authenticate but doesn't fail if no token is provided. Useful for public endpoints that enhance functionality when authenticated.

**Usage:**
```javascript
import { optionalAuthMiddleware } from '../../middleware/authMiddleware.js';

// Public route that works with or without auth
router.get('/public-route', optionalAuthMiddleware, (req, res) => {
  if (req.user) {
    // User is authenticated
  } else {
    // User is anonymous
  }
});
```

---

#### `requireRole(allowedRoles)`
Factory function that creates middleware to check user roles. Must be used AFTER `authMiddleware`.

**Usage:**
```javascript
import { authMiddleware, requireRole } from '../../middleware/authMiddleware.js';

// Only allow doctors to access
router.post('/doctor-only', 
  authMiddleware, 
  requireRole(['doctor']), 
  (req, res) => {
    // Only doctors can reach here
  }
);

// Allow both doctors and admins
router.put('/admin-or-doctor', 
  authMiddleware, 
  requireRole(['doctor', 'admin']), 
  (req, res) => {
    // Doctors and admins can reach here
  }
);
```

---

### 2. Audit Middleware (`auditMiddleware.js`)

#### `auditMiddleware(action)`
Logs API access for audit trail purposes. Sets `req.auditData` for use in controllers.

**Usage:**
```javascript
import { auditMiddleware } from '../../middleware/auditMiddleware.js';

router.post('/medical-records', 
  authMiddleware,
  auditMiddleware('CREATE_MEDICAL_RECORD'),
  MedicalRecordsController.createRecord
);
```

**Sets `req.auditData` with:**
- `action` - The action being performed
- `startTime` - Request start timestamp
- `resourceId` - ID from route params (recordId, patientId, etc.)
- `userId` - User's Firebase UID
- `userRole` - User's role
- `ipAddress` - Request IP address
- `userAgent` - Browser/client user agent

---

#### `requestLogger`
Simple logger for debugging. Logs all incoming requests.

**Usage:**
```javascript
import { requestLogger } from '../../middleware/auditMiddleware.js';

// Apply to all routes in a router
router.use(requestLogger);
```

---

## Complete Example

Here's a complete example showing how to use all middleware together:

```javascript
import express from 'express';
import { authMiddleware, requireRole, optionalAuthMiddleware } from '../../middleware/authMiddleware.js';
import { auditMiddleware, requestLogger } from '../../middleware/auditMiddleware.js';
import PatientController from './patientController.js';

const router = express.Router();

// Optional: Log all requests to this router
router.use(requestLogger);

// Public endpoint - no auth required
router.get('/public/info', (req, res) => {
  res.json({ message: 'Public information' });
});

// Optional auth - works with or without authentication
router.get('/doctors', optionalAuthMiddleware, (req, res) => {
  if (req.user) {
    // Return personalized results
  } else {
    // Return public results
  }
});

// Requires authentication
router.get('/my-profile', 
  authMiddleware, 
  auditMiddleware('VIEW_PROFILE'),
  PatientController.getProfile
);

// Requires authentication + specific role
router.post('/patients/:patientId/records', 
  authMiddleware,
  requireRole(['doctor', 'admin']),
  auditMiddleware('CREATE_PATIENT_RECORD'),
  PatientController.createRecord
);

// Multiple role checks in sequence
router.delete('/records/:recordId',
  authMiddleware,
  requireRole(['admin']), // Only admins
  auditMiddleware('DELETE_RECORD'),
  PatientController.deleteRecord
);

export default router;
```

---

## Frontend Integration

The frontend must send the Firebase ID token in the Authorization header:

```javascript
// api.js should have an interceptor
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Authentication required",
  "message": "No valid authorization header found"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "This resource requires one of the following roles: doctor, admin"
}
```

---

## Migration Guide

### Old Pattern (Don't Use)
```javascript
// DON'T: Inline auth middleware in route files
const authMiddleware = (req, res, next) => {
  // Authentication logic here...
};
```

### New Pattern (Use This)
```javascript
// DO: Import centralized middleware
import { authMiddleware, requireRole } from '../../middleware/authMiddleware.js';
```

---

## Notes

- **Always use `authMiddleware` before `requireRole`** - The role check requires `req.user` to be set first
- **Audit middleware is optional** but recommended for tracking sensitive operations
- **Token refresh** - Tokens are validated on each request; expired tokens return 401
- **Firebase Admin SDK** - Ensure `fireBaseAdmin.js` is properly configured
