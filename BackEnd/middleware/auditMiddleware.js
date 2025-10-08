/**
 * Audit Middleware
 * Logs API access for audit trail purposes
 * Works with the Audit model to track user actions
 */

/**
 * Creates audit middleware for tracking API actions
 * @param {string} action - The action being performed (e.g., 'CREATE_RECORD', 'ACCESS_PATIENT_RECORDS')
 * @returns {Function} Express middleware function
 */
export const auditMiddleware = (action) => {
  return async (req, res, next) => {
    // Store audit data on request for use in controllers
    req.auditData = {
      action,
      startTime: Date.now(),
      resourceId: req.params.recordId || req.params.patientId || req.params.id || 'N/A',
      userId: req.user?.uid || 'anonymous',
      userRole: req.user?.role || 'unknown',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    };
    
    // Log the audit event
    console.log(`[AUDIT] ${action}:`, {
      user: req.user?.uid || 'anonymous',
      role: req.user?.role || 'unknown',
      resource: req.auditData.resourceId
    });
    
    next();
  };
};

/**
 * Request Logger Middleware
 * Logs all incoming requests for debugging
 */
export const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    user: req.user?.uid || 'anonymous'
  });
  next();
};

export default auditMiddleware;
