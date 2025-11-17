/**
 * Logging Configuration using Winston
 * 
 * Log Levels:
 * - error: 0 - Error events that might still allow the application to continue running
 * - warn: 1 - Warning messages about deprecated APIs, poor use of API, 'almost' errors
 * - info: 2 - Informational messages highlighting application progress
 * - http: 3 - HTTP request/response logging
 * - debug: 4 - Detailed debugging information
 * 
 * Log Files:
 * - error.log: Only error level logs
 * - combined.log: All logs
 * - Console: All logs in development, errors only in production
 */

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine log level based on environment
const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Custom format for console output with colors
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      // Filter out sensitive data
      const sanitized = sanitizeMeta(meta);
      metaStr = `\n${JSON.stringify(sanitized, null, 2)}`;
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Format for file output (JSON for easy parsing)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Sanitize sensitive data from logs
function sanitizeMeta(meta) {
  const sensitiveFields = ['password', 'token', 'authorization', 'jwt', 'secret', 'apikey', 'api_key'];
  const sanitized = { ...meta };
  
  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    for (const key in obj) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        obj[key] = '***REDACTED***';
      } else if (typeof obj[key] === 'object') {
        sanitizeObject(obj[key]);
      }
    }
    return obj;
  };
  
  return sanitizeObject(sanitized);
}

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// Configure transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
    level: logLevel,
  }),
  
  // Error log file
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  
  // Combined log file
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Create the logger
const logger = winston.createLogger({
  level: logLevel,
  format: fileFormat,
  defaultMeta: { service: 'bimbingan-online' },
  transports,
  exitOnError: false,
});

// HTTP request logging middleware
export const httpLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
    };
    
    // Add user info if authenticated
    if (req.user) {
      logData.userId = req.user.id;
      logData.userRole = req.user.role;
    }
    
    // Log based on status code
    if (res.statusCode >= 500) {
      logger.error('HTTP Request Error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP Request Warning', logData);
    } else {
      logger.http('HTTP Request', logData);
    }
  });
  
  next();
};

// Helper methods for structured logging
export const logError = (message, error, context = {}) => {
  logger.error(message, {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...error,
    },
    ...context,
  });
};

export const logWarning = (message, context = {}) => {
  logger.warn(message, context);
};

export const logInfo = (message, context = {}) => {
  logger.info(message, context);
};

export const logDebug = (message, context = {}) => {
  logger.debug(message, context);
};

// Database operation logging
export const logDatabaseOperation = (operation, table, details = {}) => {
  logger.debug(`Database: ${operation}`, {
    operation,
    table,
    ...details,
  });
};

// File operation logging
export const logFileOperation = (operation, fileName, details = {}) => {
  logger.info(`File: ${operation}`, {
    operation,
    fileName,
    ...details,
  });
};

// Authentication logging
export const logAuth = (event, userId, details = {}) => {
  logger.info(`Auth: ${event}`, {
    event,
    userId,
    ...details,
  });
};

export default logger;
