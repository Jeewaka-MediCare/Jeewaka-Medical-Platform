import api from "./api";
import { auth } from "../config/firebase";

/**
 * API Helpers for the new backend authentication system
 * These helpers ensure proper authentication and error handling
 */

export const apiHelpers = {
  // Ensure user is authenticated before making API call
  ensureAuthenticated: async () => {
    if (!auth.currentUser) {
      throw new Error('Please log in to continue');
    }
    
    try {
      await auth.currentUser.getIdToken();
      return true;
    } catch (error) {
      throw new Error('Session expired. Please log in again.');
    }
  },

  // Make authenticated API call with proper error handling
  authenticatedRequest: async (method, url, data = null, config = {}) => {
    await apiHelpers.ensureAuthenticated();
    
    try {
      let response;
      switch (method.toLowerCase()) {
        case 'get':
          response = await api.get(url, config);
          break;
        case 'post':
          response = await api.post(url, data, config);
          break;
        case 'put':
          response = await api.put(url, data, config);
          break;
        case 'delete':
          response = await api.delete(url, config);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }
      return response;
    } catch (error) {
      // Handle common authentication errors
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to perform this action.');
      }
      throw error;
    }
  },

  // Get user profile data with proper role handling
  getUserProfile: async (role, uuid) => {
    const endpoint = role === 'patient' ? `/api/patient/uuid/${uuid}` : 
                    role === 'doctor' ? `/api/doctor/uuid/${uuid}` :
                    role === 'admin' ? `/api/admin/uuid/${uuid}` : null;
    
    if (!endpoint) {
      throw new Error('Invalid user role');
    }

    const response = await api.get(endpoint);
    return response.data;
  },

  // Create payment intent with authentication
  createPaymentIntent: async (paymentData) => {
    return await apiHelpers.authenticatedRequest('post', '/api/payments/create-intent', paymentData);
  },

  // Get medical records (authenticated)
  getMedicalRecords: async (patientId) => {
    return await apiHelpers.authenticatedRequest('get', `/api/records/patient/${patientId}`);
  },

  // Create medical record (doctor only)
  createMedicalRecord: async (recordData) => {
    return await apiHelpers.authenticatedRequest('post', '/api/records', recordData);
  },

  // Update user role (admin only)
  updateUserRole: async (uid, role) => {
    return await apiHelpers.authenticatedRequest('put', `/api/auth/users/${uid}/role`, { uid, role });
  },

  // Get user role information
  getUserRole: async (uid) => {
    return await apiHelpers.authenticatedRequest('get', `/api/auth/users/${uid}/role`);
  }
};

export default apiHelpers;