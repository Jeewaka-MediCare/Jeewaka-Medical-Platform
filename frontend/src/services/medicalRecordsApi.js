import api from './api';

/**
 * Medical Records API Service
 * Handles all API calls related to medical records management
 */

class MedicalRecordsAPI {
  
  /**
   * Get all medical records for a patient
   * @param {string} patientId - Patient ID
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Records per page (default: 10)
   * @returns {Promise} Records with pagination
   */
  static async getPatientRecords(patientId, page = 1, limit = 10) {
    try {
      const response = await api.get(`/api/medical-records/patients/${patientId}/records`, {
        params: { page, limit }
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to fetch patient records:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch patient records',
        details: error.response?.data?.details || error.message
      };
    }
  }

  /**
   * Get a specific medical record with its latest version
   * @param {string} recordId - Record ID
   * @returns {Promise} Record with latest version content
   */
  static async getRecord(recordId) {
    try {
      const response = await api.get(`/api/medical-records/records/${recordId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to fetch record:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch record',
        details: error.response?.data?.details || error.message
      };
    }
  }

  /**
   * Create a new medical record
   * @param {string} patientId - Patient ID
   * @param {Object} recordData - Record data
   * @param {string} recordData.title - Record title
   * @param {string} recordData.description - Record description (optional)
   * @param {string} recordData.content - Markdown content
   * @param {Array<string>} recordData.tags - Tags (optional)
   * @returns {Promise} Created record with initial version
   */
  static async createRecord(patientId, recordData) {
    try {
      const response = await api.post(
        `/api/medical-records/patients/${patientId}/records`,
        {
          patientId,
          title: recordData.title,
          description: recordData.description || '',
          content: recordData.content || '',
          tags: recordData.tags || []
        }
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to create record:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create record',
        details: error.response?.data?.details || error.message
      };
    }
  }

  /**
   * Update a medical record (creates new version)
   * @param {string} recordId - Record ID
   * @param {Object} updateData - Update data
   * @param {string} updateData.content - New Markdown content
   * @param {string} updateData.changeDescription - Description of changes
   * @param {string} updateData.title - Updated title (optional)
   * @param {string} updateData.description - Updated description (optional)
   * @param {Array<string>} updateData.tags - Updated tags (optional)
   * @returns {Promise} Updated record with new version
   */
  static async updateRecord(recordId, updateData) {
    try {
      const response = await api.put(
        `/api/medical-records/records/${recordId}`,
        {
          content: updateData.content,
          changeDescription: updateData.changeDescription || '',
          title: updateData.title,
          description: updateData.description,
          tags: updateData.tags
        }
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to update record:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update record',
        details: error.response?.data?.details || error.message
      };
    }
  }

  /**
   * Delete a medical record (soft delete)
   * @param {string} recordId - Record ID
   * @returns {Promise} Success status
   */
  static async deleteRecord(recordId) {
    try {
      const response = await api.delete(`/api/medical-records/records/${recordId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to delete record:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete record',
        details: error.response?.data?.details || error.message
      };
    }
  }

  /**
   * Get version history for a record
   * @param {string} recordId - Record ID
   * @param {number} limit - Number of versions to retrieve (default: 10)
   * @returns {Promise} Version history list
   */
  static async getVersionHistory(recordId, limit = 10) {
    try {
      const response = await api.get(
        `/api/medical-records/records/${recordId}/versions`,
        { params: { limit } }
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to fetch version history:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch version history',
        details: error.response?.data?.details || error.message
      };
    }
  }

  /**
   * Get a specific version of a record
   * @param {string} recordId - Record ID
   * @param {number} versionNumber - Version number
   * @returns {Promise} Version content with metadata
   */
  static async getVersion(recordId, versionNumber) {
    try {
      const response = await api.get(
        `/api/medical-records/records/${recordId}/versions/${versionNumber}`
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to fetch version:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch version',
        details: error.response?.data?.details || error.message
      };
    }
  }

  /**
   * Get audit trail for a record
   * @param {string} recordId - Record ID
   * @param {number} limit - Number of audit entries to retrieve
   * @returns {Promise} Audit trail
   */
  static async getRecordAuditTrail(recordId, limit = 50) {
    try {
      const response = await api.get(
        `/api/medical-records/records/${recordId}/audit`,
        { params: { limit } }
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to fetch audit trail:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch audit trail',
        details: error.response?.data?.details || error.message
      };
    }
  }

  /**
   * Get audit trail for a patient (doctor only)
   * @param {string} patientId - Patient ID
   * @param {Object} options - Query options
   * @returns {Promise} Patient audit trail
   */
  static async getPatientAuditTrail(patientId, options = {}) {
    try {
      const response = await api.get(
        `/api/medical-records/patients/${patientId}/audit`,
        { params: options }
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to fetch patient audit trail:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch patient audit trail',
        details: error.response?.data?.details || error.message
      };
    }
  }
}

export default MedicalRecordsAPI;
