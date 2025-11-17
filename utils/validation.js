/**
 * Input Validation Utilities
 * 
 * Provides validation helpers for common input types
 * Returns structured validation errors
 */

import { ValidationError } from './errors.js';

/**
 * Validate required fields
 */
export const validateRequired = (fields, body) => {
  const errors = [];
  
  for (const field of fields) {
    if (!body[field] || (typeof body[field] === 'string' && body[field].trim() === '')) {
      errors.push({
        field,
        message: `${field} is required`,
      });
    }
  }
  
  if (errors.length > 0) {
    throw new ValidationError('Required fields are missing', errors);
  }
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', [
      { field: 'email', message: 'Please provide a valid email address' },
    ]);
  }
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push({
      field: 'password',
      message: 'Password must be at least 8 characters long',
    });
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one uppercase letter',
    });
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one lowercase letter',
    });
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one number',
    });
  }
  
  if (errors.length > 0) {
    throw new ValidationError('Password does not meet requirements', errors);
  }
};

/**
 * Validate role
 */
export const validateRole = (role) => {
  const validRoles = ['mahasiswa', 'dosen', 'koordinator', 'penguji'];
  if (!validRoles.includes(role)) {
    throw new ValidationError('Invalid role', [
      { field: 'role', message: `Role must be one of: ${validRoles.join(', ')}` },
    ]);
  }
};

/**
 * Validate status values
 */
export const validateStatus = (status, validStatuses) => {
  if (!validStatuses.includes(status)) {
    throw new ValidationError('Invalid status', [
      { field: 'status', message: `Status must be one of: ${validStatuses.join(', ')}` },
    ]);
  }
};

/**
 * Validate positive integer
 */
export const validatePositiveInteger = (value, fieldName) => {
  const num = parseInt(value, 10);
  if (isNaN(num) || num <= 0) {
    throw new ValidationError(`Invalid ${fieldName}`, [
      { field: fieldName, message: `${fieldName} must be a positive integer` },
    ]);
  }
  return num;
};

/**
 * Validate file upload
 */
export const validateFileUpload = (file, options = {}) => {
  const errors = [];
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedMimeTypes = ['application/pdf'],
    required = true,
  } = options;
  
  if (!file) {
    if (required) {
      errors.push({
        field: 'file',
        message: 'File is required',
      });
    }
    if (errors.length > 0) {
      throw new ValidationError('File validation failed', errors);
    }
    return;
  }
  
  // Check file size
  if (file.size > maxSize) {
    errors.push({
      field: 'file',
      message: `File size must not exceed ${maxSize / (1024 * 1024)}MB`,
    });
  }
  
  // Check MIME type
  if (!allowedMimeTypes.includes(file.mimetype)) {
    errors.push({
      field: 'file',
      message: `File type must be one of: ${allowedMimeTypes.join(', ')}`,
    });
  }
  
  if (errors.length > 0) {
    throw new ValidationError('File validation failed', errors);
  }
};

/**
 * Sanitize input to prevent XSS
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
};

/**
 * Validate score range
 */
export const validateScore = (score) => {
  const numScore = parseFloat(score);
  if (isNaN(numScore) || numScore < 0 || numScore > 100) {
    throw new ValidationError('Invalid score', [
      { field: 'score', message: 'Score must be a number between 0 and 100' },
    ]);
  }
  return numScore;
};
