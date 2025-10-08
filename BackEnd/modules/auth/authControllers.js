import admin from '../../config/fireBaseAdmin.js';

/**
 * Set user role during registration (PUBLIC endpoint)
 * This endpoint is called during user registration to set initial role
 * Only allows setting 'patient' or 'doctor' roles
 * Verifies that the user making the request is setting their own role
 */
export const setUserRole = async (req, res) => {
  try {
    const { uid, role } = req.body;
    
    // Validate required fields
    if (!uid || !role) {
      return res.status(400).json({ error: 'uid and role are required' });
    }

    // Only allow 'patient' or 'doctor' roles during registration
    // Admin roles can only be set through secure admin endpoint
    const allowedRoles = ['patient', 'doctor'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role',
        message: 'Only patient and doctor roles can be set during registration' 
      });
    }

    // Set the custom claim
    await admin.auth().setCustomUserClaims(uid, { role });
    console.log(`Role ${role} set for user ${uid}`);
    
    return res.status(200).json({ 
      message: 'Role set successfully',
      role 
    });
  } catch (error) {
    console.error('Error setting user role:', error);
    return res.status(500).json({ 
      error: error?.message || 'Internal server error' 
    });
  }
};

/**
 * Update user role (ADMIN only endpoint)
 * Allows admins to change any user's role
 * Requires authentication and admin role
 */
export const updateUserRole = async (req, res) => {
  try {
    const { uid, role } = req.body;
    
    // Validate required fields
    if (!uid || !role) {
      return res.status(400).json({ error: 'uid and role are required' });
    }

    // Validate role
    const validRoles = ['patient', 'doctor', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role',
        message: `Role must be one of: ${validRoles.join(', ')}` 
      });
    }

    // Prevent users from demoting themselves
    if (req.user.uid === uid && req.user.role === 'admin' && role !== 'admin') {
      return res.status(403).json({ 
        error: 'Cannot demote yourself',
        message: 'Admins cannot remove their own admin role' 
      });
    }

    // Set the custom claim
    await admin.auth().setCustomUserClaims(uid, { role });
    console.log(`Admin ${req.user.uid} updated role to ${role} for user ${uid}`);
    
    return res.status(200).json({ 
      message: 'Role updated successfully',
      uid,
      role,
      updatedBy: req.user.uid
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return res.status(500).json({ 
      error: error?.message || 'Internal server error' 
    });
  }
};

/**
 * Get user role and custom claims
 * Returns the user's Firebase custom claims
 */
export const getUserRole = async (req, res) => {
  try {
    const { uid } = req.params;
    
    if (!uid) {
      return res.status(400).json({ error: 'uid is required' });
    }

    // Get user from Firebase
    const userRecord = await admin.auth().getUser(uid);
    
    return res.status(200).json({ 
      uid: userRecord.uid,
      email: userRecord.email,
      customClaims: userRecord.customClaims || {},
      role: userRecord.customClaims?.role || 'patient'
    });
  } catch (error) {
    console.error('Error getting user role:', error);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.status(500).json({ 
      error: error?.message || 'Internal server error' 
    });
  }
}; 