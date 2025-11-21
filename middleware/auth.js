import jwt from 'jsonwebtoken';
import { AuthenticationError, AuthorizationError } from '../docs/utils/errors.js';
import { logAuth, logWarning } from '../docs/utils/logger.js';

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      throw new AuthenticationError('Authentication token is required');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Invalid authorization header format. Use: Bearer <token>');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AuthenticationError('Authentication token is required');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    logAuth('Token verified', decoded.id, { role: decoded.role });
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AuthenticationError('Invalid authentication token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AuthenticationError('Authentication token has expired'));
    }

    next(error);
  }
};

const verifyRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('User not authenticated');
      }

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

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    logAuth('Optional token verified', decoded.id);
  } catch (error) {
    logWarning('Optional authentication failed', { error: error.message });
  }

  next();
};

export { verifyToken, verifyRole, optionalAuth };
