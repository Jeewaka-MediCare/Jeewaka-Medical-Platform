/**
 * Error handling utilities for the new backend API
 * Provides consistent error handling and user-friendly messages
 */

export const handleApiError = (error, defaultMessage = 'An unexpected error occurred') => {
  console.error('API Error:', error);

  // Network errors
  if (!error.response) {
    return {
      type: 'network',
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
      shouldRetry: true
    };
  }

  const { status, data } = error.response;

  // Authentication errors
  if (status === 401) {
    return {
      type: 'auth',
      message: data.message || 'Your session has expired. Please log in again.',
      shouldLogout: true
    };
  }

  // Authorization errors
  if (status === 403) {
    return {
      type: 'permission',
      message: data.message || 'You do not have permission to perform this action.',
      shouldRetry: false
    };
  }

  // Validation errors
  if (status === 400) {
    return {
      type: 'validation',
      message: data.error || data.message || 'Invalid request data.',
      shouldRetry: false
    };
  }

  // Not found errors
  if (status === 404) {
    return {
      type: 'notFound',
      message: data.error || data.message || 'The requested resource was not found.',
      shouldRetry: false
    };
  }

  // Conflict errors (e.g., appointment slot taken)
  if (status === 409) {
    return {
      type: 'conflict',
      message: data.error || data.message || 'This action conflicts with existing data.',
      shouldRetry: false
    };
  }

  // Server errors
  if (status >= 500) {
    return {
      type: 'server',
      message: 'Server error. Please try again later.',
      shouldRetry: true
    };
  }

  // Default fallback
  return {
    type: 'unknown',
    message: data.error || data.message || defaultMessage,
    shouldRetry: false
  };
};

export const getErrorMessage = (error, defaultMessage) => {
  const errorInfo = handleApiError(error, defaultMessage);
  return errorInfo.message;
};

export const shouldLogoutOnError = (error) => {
  const errorInfo = handleApiError(error);
  return errorInfo.shouldLogout;
};

export const shouldRetryOnError = (error) => {
  const errorInfo = handleApiError(error);
  return errorInfo.shouldRetry;
};

export default {
  handleApiError,
  getErrorMessage,
  shouldLogoutOnError,
  shouldRetryOnError
};