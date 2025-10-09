import { apiHelpers } from './apiHelpers';
import { handleApiError } from './errorHandler';

/**
 * Medical Records Service for the new backend
 * Handles medical record operations with proper authentication
 */

export const medicalRecordsService = {
  // Get medical records for a patient
  getPatientRecords: async (patientId) => {
    try {
      const response = await apiHelpers.authenticatedRequest('get', `/api/records/patient/${patientId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to load medical records').message);
    }
  },

  // Create a new medical record (doctor only)
  createRecord: async (recordData) => {
    try {
      const response = await apiHelpers.authenticatedRequest('post', '/api/records', recordData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to create medical record').message);
    }
  },

  // Update an existing medical record
  updateRecord: async (recordId, updateData) => {
    try {
      const response = await apiHelpers.authenticatedRequest('put', `/api/records/${recordId}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to update medical record').message);
    }
  },

  // Get a specific medical record by ID
  getRecord: async (recordId) => {
    try {
      const response = await apiHelpers.authenticatedRequest('get', `/api/records/${recordId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to load medical record').message);
    }
  },

  // Delete a medical record (soft delete)
  deleteRecord: async (recordId) => {
    try {
      const response = await apiHelpers.authenticatedRequest('delete', `/api/records/${recordId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to delete medical record').message);
    }
  },

  // Create a new version of a medical record
  createVersion: async (recordId, versionData) => {
    try {
      const response = await apiHelpers.authenticatedRequest('post', `/api/records/${recordId}/versions`, versionData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to create record version').message);
    }
  },

  // Get all versions of a medical record
  getRecordVersions: async (recordId) => {
    try {
      const response = await apiHelpers.authenticatedRequest('get', `/api/records/${recordId}/versions`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to load record versions').message);
    }
  },

  // Get audit trail for medical records
  getAuditTrail: async (patientId, filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const url = `/api/records/audit/patient/${patientId}${params ? `?${params}` : ''}`;
      const response = await apiHelpers.authenticatedRequest('get', url);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, 'Failed to load audit trail').message);
    }
  }
};

export default medicalRecordsService;