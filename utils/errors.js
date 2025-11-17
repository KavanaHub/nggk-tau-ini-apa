/**
 * Custom Error Classes for Application-wide Error Handling
 * 
 * Hierarchy:
 * - AppError (base class)
 *   - ValidationError (400)
 *   - AuthenticationError (401)
 *   - AuthorizationError (403)
 *   - NotFoundError (404)
 *   - ConflictError (409)
 *   - DatabaseError (500)
 *   - FileUploadError (500)
 *   - ExternalServiceError (502)
 */

/**
 * Base Application Error Class
 * All custom errors inherit from this class
 */
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error - 400 Bad Request
 * Used for input validation failures, missing required fields, invalid data formats
 */
class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = []) {
    super(message, 400);
    this.name = 'ValidationError';
    this.errors = errors; // Array of field-specific errors
  }
}

/**
 * Authentication Error - 401 Unauthorized
 * Used for missing/invalid credentials, expired tokens
 */
class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization Error - 403 Forbidden
 * Used when authenticated user lacks permission for the action
 */
class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not Found Error - 404 Not Found
 * Used when requested resource doesn't exist
 */
class NotFoundError extends AppError {
  constructor(resource = 'Resource', id = '') {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message, 404);
    this.name = 'NotFoundError';
    this.resource = resource;
    this.resourceId = id;
  }
}

/**
 * Conflict Error - 409 Conflict
 * Used for duplicate entries, concurrent modification conflicts
 */
class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * Database Error - 500 Internal Server Error
 * Used for database connection failures, query errors
 */
class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', originalError = null) {
    super(message, 500, false); // Not operational, needs investigation
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

/**
 * File Upload Error - 500 Internal Server Error
 * Used for file upload failures, storage issues
 */
class FileUploadError extends AppError {
  constructor(message = 'File upload failed', details = null) {
    super(message, 500);
    this.name = 'FileUploadError';
    this.details = details;
  }
}

/**
 * External Service Error - 502 Bad Gateway
 * Used when external API or service fails
 */
class ExternalServiceError extends AppError {
  constructor(service = 'External service', message = 'Service unavailable') {
    super(`${service}: ${message}`, 502, false);
    this.name = 'ExternalServiceError';
    this.service = service;
  }
}

/**
 * Rate Limit Error - 429 Too Many Requests
 * Used when rate limiting is exceeded
 */
class RateLimitError extends AppError {
  constructor(message = 'Too many requests', retryAfter = 60) {
    super(message, 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  FileUploadError,
  ExternalServiceError,
  RateLimitError,
};
