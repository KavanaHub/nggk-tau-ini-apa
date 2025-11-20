import jwt from 'jsonwebtoken';
import { AuthenticationError, AuthorizationError } from '../docs/utils/errors.js';
import { logAuth, logWarning } from '../docs/utils/logger.js';

/**
 * Verify JWT token from Authorization header
 * Throws AuthenticationError if token is missing or invalid
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
      throw new AuthenticationError('Authentication token is required');
    }
    
    // Check if header follows "Bearer <token>" format
    if (!authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Invalid authorization header format. Use: Bearer <token>');
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new AuthenticationError('Authentication token is required');
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request
    req.user = decoded;
    
    logAuth('Token verified', decoded.id, { role: decoded.role });
    next();
  } catch (error) {
    // Handle JWT-specific errors
    if (error.name === 'JsonWebTokenError') {
      return next(new AuthenticationError('Invalid authentication token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AuthenticationError('Authentication token has expired'));
    }
    
    // Pass other errors to error handler
    next(error);
  }
};

/**
 * Verify user has required role(s)
 * Must be used after verifyToken middleware
 */
const verifyRole = (roles) => {
  // Ensure roles is an array
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    try {
      // Check if user exists (should be set by verifyToken)
      if (!req.user) {
        throw new AuthenticationError('User not authenticated');
      }
      
      // Check if user has required role
      if (!allowedRoles.includes(req.user.role)) {
        logWarning('Authorization denied', {
          userId: req.user.id,
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          url: req.originalUrl,
        });
        
        throw new AuthorizationError(
          `Access denied. Required role(s): ${allowedRoles.join(', ')}`
        );
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Optional authentication - doesn't fail if token is missing
 * but validates token if present
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // No token, continue without authentication
  }
  
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    logAuth('Optional token verified', decoded.id);
  } catch (error) {
    // Invalid token, but don't fail - just continue without auth
    logWarning('Optional authentication failed', { error: error.message });
  }
  
  next();
};

export { verifyToken, verifyRole, optionalAuth };
