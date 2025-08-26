import admin from '../../config/fireBaseAdmin.js';

export const setUserRole = async (req, res) => {
  try {
    const { uid, role } = req.body;
    if (!uid || !role) {
      return res.status(400).json({ error: 'uid and role are required' });
    }
    await admin.auth().setCustomUserClaims(uid, { role });
    console.log(`Role ${role} set for user ${uid}`);
    return res.status(200).json({ message: 'Role set successfully' });
  } catch (error) {
    console.error('Error setting user role:', error);
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}; 