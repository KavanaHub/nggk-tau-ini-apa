/**
 * Unified Auth Middleware (Hybrid: Session Cookie -> Bearer JWT)
 * 
 * Priority:
 * 1. Better Auth session cookie
 * 2. Bearer JWT token (legacy)
 * 
 * Sets req.auth = {
 *   userId, activeRole, roles, sessionId, authType, requestId
 * }
 * 
 * Also sets req.user for backward compatibility with existing controllers.
 */
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { isTokenRevoked } from '../config/redis.js';

/**
 * Attempt to verify a Better Auth session from cookies
 */
async function verifySession(req) {
  try {
    // Dynamic import to avoid circular dependencies
    const { auth } = await import('../config/auth.js');
    const session = await auth.api.getSession({ headers: req.headers });
    if (session?.user) {
      return {
        userId: session.user.id,
        email: session.user.email,
        activeRole: session.user.activeRole || session.user.role || 'dosen',
        roles: session.user.roles || [session.user.role || 'dosen'],
        sessionId: session.session?.id || null,
        authType: 'session',
      };
    }
  } catch {
    // Session not available, fall through to JWT
  }
  return null;
}

/**
 * Attempt to verify a Bearer JWT token
 */
async function verifyBearer(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const [type, token] = authHeader.split(' ');
  if (type !== 'Bearer' || !token) return null;

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    
    // Check if token has been revoked
    if (payload.jti) {
      const revoked = await isTokenRevoked(payload.jti);
      if (revoked) return null;
    }

    return {
      userId: payload.id,
      email: payload.email,
      activeRole: payload.role,
      roles: payload.roles || [payload.role],
      sessionId: null,
      authType: 'bearer',
    };
  } catch {
    return null;
  }
}

/**
 * Unified auth middleware
 * Tries session first, then bearer JWT.
 * Sets both req.auth (new contract) and req.user (backward compat).
 */
export default async function unifiedAuth(req, res, next) {
  // 1. Try session cookie
  let authContext = await verifySession(req);
  
  // 2. Fallback to bearer JWT
  if (!authContext) {
    authContext = await verifyBearer(req);
  }

  if (!authContext) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        request_id: req.requestId || 'unknown',
      },
    });
  }

  // Set new unified auth context
  req.auth = {
    ...authContext,
    requestId: req.requestId,
  };

  // Backward compatibility: set req.user for existing controllers
  req.user = {
    id: authContext.userId,
    email: authContext.email,
    role: authContext.activeRole,
    roles: authContext.roles,
  };

  next();
}

/**
 * Optional auth — doesn't fail if no auth, just sets req.auth if available
 */
export async function optionalAuth(req, res, next) {
  let authContext = await verifySession(req);
  if (!authContext) {
    authContext = await verifyBearer(req);
  }

  if (authContext) {
    req.auth = { ...authContext, requestId: req.requestId };
    req.user = {
      id: authContext.userId,
      email: authContext.email,
      role: authContext.activeRole,
      roles: authContext.roles,
    };
  }

  next();
}
