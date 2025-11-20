/**
 * Global Error Handler Middleware
 * 
 * Catches all errors from routes and controllers
 * Formats error responses consistently
 * Logs errors appropriately
 * Prevents sensitive information leakage
 */

import { AppError } from '../docs/utils/errors.js';
import { logError } from '../docs/utils/logger.js';

/**
 * Parse MySQL/Database errors into user-friendly messages
 */
const parseDatabaseError = (error) => {
  // Duplicate entry error
  if (error.code === 'ER_DUP_ENTRY') {
    const match = error.sqlMessage?.match(/Duplicate entry '(.+)' for key '(.+)'/);
    const value = match ? match[1] : 'value';
    return {
      message: `A record with ${value} already exists`,
      statusCode: 409,
    };
  }
  
  // Foreign key constraint error
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return {
      message: 'Referenced record does not exist',
      statusCode: 400,
    };
  }
  
  // Data too long
  if (error.code === 'ER_DATA_TOO_LONG') {
    return {
      message: 'Data exceeds maximum allowed length',
      statusCode: 400,
    };
  }
  
  // Connection error
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return {
      message: 'Database connection failed',
      statusCode: 503,
    };
  }
  
  // Default database error
  return {
    message: 'Database operation failed',
    statusCode: 500,
  };
};

/**
 * Parse JWT errors
 */
const parseJWTError = (error) => {
  if (error.name === 'JsonWebTokenError') {
    return {
      message: 'Invalid authentication token',
      statusCode: 401,
    };
  }
  
  if (error.name === 'TokenExpiredError') {
    return {
      message: 'Authentication token has expired',
      statusCode: 401,
    };
  }
  
  return null;
};

/**
 * Parse Multer file upload errors
 */
const parseMulterError = (error) => {
  if (error.name === 'MulterError') {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return { message: 'File size exceeds maximum allowed limit', statusCode: 400 };
      case 'LIMIT_FILE_COUNT':
        return { message: 'Too many files uploaded', statusCode: 400 };
      case 'LIMIT_UNEXPECTED_FILE':
        return { message: 'Unexpected file field', statusCode: 400 };
      default:
        return { message: 'File upload failed', statusCode: 400 };
    }
  }
  return null;
};

/**
 * Development error response (includes stack trace)
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: {
      message: err.message,
      statusCode: err.statusCode,
      name: err.name,
      stack: err.stack,
      timestamp: err.timestamp || new Date().toISOString(),
      ...(err.errors && { errors: err.errors }), // Validation errors
      ...(err.details && { details: err.details }), // Additional details
    },
  });
};

/**
 * Production error response (hides sensitive details)
 */
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        statusCode: err.statusCode,
        timestamp: err.timestamp || new Date().toISOString(),
        ...(err.errors && { errors: err.errors }), // Validation errors
      },
    });
  } else {
    // Programming or unknown error: don't leak error details
    logError('CRITICAL: Non-operational error', err);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'An unexpected error occurred. Please try again later.',
        statusCode: 500,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * Main error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.name = err.name;
  error.stack = err.stack;
  
  // Log the error with context
  const errorContext = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id,
    body: req.body,
  };
  
  logError('Error Handler', err, errorContext);
  
  // Default values
  error.statusCode = err.statusCode || 500;
  error.isOperational = err.isOperational !== undefined ? err.isOperational : true;
  error.timestamp = err.timestamp || new Date().toISOString();
  
  // Parse specific error types
  if (!err.isOperational) {
    // Check for JWT errors
    const jwtError = parseJWTError(err);
    if (jwtError) {
      error.message = jwtError.message;
      error.statusCode = jwtError.statusCode;
      error.isOperational = true;
    }
    
    // Check for database errors
    if (err.code && err.code.startsWith('ER_')) {
      const dbError = parseDatabaseError(err);
      error.message = dbError.message;
      error.statusCode = dbError.statusCode;
      error.isOperational = true;
    }
    
    // Check for Multer errors
    const multerError = parseMulterError(err);
    if (multerError) {
      error.message = multerError.message;
      error.statusCode = multerError.statusCode;
      error.isOperational = true;
    }
  }
  
  // Send error response based on environment
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

/**
 * 404 Not Found Handler
 * Place this after all routes
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

export { errorHandler, notFoundHandler };
