/**
 * Standardized Error Response Middleware
 * 
 * Error format: { error: { code, message, request_id } }
 * Codes: UNAUTHORIZED, FORBIDDEN, RATE_LIMITED, INVALID_TOKEN, SESSION_EXPIRED,
 *        VALIDATION_ERROR, NOT_FOUND, INTERNAL_ERROR
 */

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMITED: 'RATE_LIMITED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
};

/**
 * Create a standardized error response
 */
export function apiError(res, statusCode, code, message, requestId) {
  return res.status(statusCode).json({
    error: {
      code,
      message,
      request_id: requestId || res.req?.requestId || 'unknown',
    },
  });
}

/**
 * Convenience helpers
 */
export function unauthorized(res, message = 'Authentication required') {
  return apiError(res, 401, ERROR_CODES.UNAUTHORIZED, message, res.req?.requestId);
}

export function forbidden(res, message = 'Forbidden') {
  return apiError(res, 403, ERROR_CODES.FORBIDDEN, message, res.req?.requestId);
}

export function rateLimited(res, message = 'Too many requests, please try again later') {
  return apiError(res, 429, ERROR_CODES.RATE_LIMITED, message, res.req?.requestId);
}

export function invalidToken(res, message = 'Invalid or expired token') {
  return apiError(res, 401, ERROR_CODES.INVALID_TOKEN, message, res.req?.requestId);
}

export function sessionExpired(res, message = 'Session expired, please login again') {
  return apiError(res, 401, ERROR_CODES.SESSION_EXPIRED, message, res.req?.requestId);
}

/**
 * Global error handler middleware (replaces existing one in index.js)
 */
export function globalErrorHandler(err, req, res, _next) {
  console.error(`[${req.requestId || 'no-id'}] Error:`, err.message || err);

  // Don't leak stack traces in production
  const isDev = process.env.NODE_ENV === 'development';

  return res.status(err.statusCode || 500).json({
    error: {
      code: err.code || ERROR_CODES.INTERNAL_ERROR,
      message: isDev ? err.message : 'Internal server error',
      request_id: req.requestId || 'unknown',
    },
  });
}
