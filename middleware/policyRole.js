/**
 * Policy-Driven Authorization (RBAC)
 * 
 * Replaces hardcoded if/else role checks with a centralized policy map.
 * Domain rules:
 * - admin can access everything
 * - koordinator inherits dosen access
 * - kaprodi inherits dosen + koordinator access
 * 
 * Policy map is the single source of truth for role hierarchy.
 */

/**
 * Role hierarchy — who can access what.
 * Each role maps to additional roles it can inherit.
 */
const ROLE_HIERARCHY = {
  admin: ['admin', 'kaprodi', 'koordinator', 'dosen', 'mahasiswa', 'penguji'],
  kaprodi: ['kaprodi', 'koordinator', 'dosen'],
  koordinator: ['koordinator', 'dosen'],
  dosen: ['dosen'],
  penguji: ['penguji', 'dosen'],
  mahasiswa: ['mahasiswa'],
};

/**
 * Get all effective roles for a given role (including inherited)
 */
function getEffectiveRoles(role) {
  return ROLE_HIERARCHY[role] || [role];
}

/**
 * Policy-based requireRole middleware
 * Checks if the user's active role (or any of their roles) has access
 * to the required roles, factoring in the hierarchy.
 * 
 * Usage: requireRole('dosen', 'koordinator')
 * — any user whose effective role set intersects with the required roles passes
 */
export default function requireRole(...requiredRoles) {
  return (req, res, next) => {
    const auth = req.auth || req.user;
    if (!auth) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Forbidden',
          request_id: req.requestId || 'unknown',
        },
      });
    }

    const activeRole = auth.activeRole || auth.role;
    const effectiveRoles = getEffectiveRoles(activeRole);

    // Check if any effective role matches any required role
    const hasAccess = requiredRoles.some(r => effectiveRoles.includes(r));

    if (!hasAccess) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Forbidden',
          request_id: req.requestId || 'unknown',
        },
      });
    }

    next();
  };
}

/**
 * Middleware: only allow exact role (admin NOT included)
 * For kaprodi-only actions where admin should not bypass.
 */
export function exactRole(...roles) {
  return (req, res, next) => {
    const auth = req.auth || req.user;
    if (!auth) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Forbidden',
          request_id: req.requestId || 'unknown',
        },
      });
    }

    const activeRole = auth.activeRole || auth.role;
    if (!roles.includes(activeRole)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Forbidden - ${roles.join(' or ')} only`,
          request_id: req.requestId || 'unknown',
        },
      });
    }

    next();
  };
}

// Export hierarchy for testing/reference
export { ROLE_HIERARCHY, getEffectiveRoles };
