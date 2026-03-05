/**
 * Session Auth Routes (Better Auth + JWT hybrid)
 * 
 * New endpoints per PLAN.md:
 * - GET  /api/auth/session  — current session info
 * - GET  /api/auth/me       — profile ringkas
 * - POST /api/auth/logout   — invalidate session + revoke token
 * - POST /api/auth/refresh  — rotate refresh token
 */
import express from 'express';
import unifiedAuth from '../middleware/unifiedAuth.js';
import { auditLogout } from '../middleware/audit.js';
import { revokeToken } from '../config/redis.js';
import { generateToken } from '../utils/jwt.js';
import pool from '../config/db.js';

const router = express.Router();

/**
 * GET /api/auth/session
 * Returns active session info (role, roles, user identity ringkas)
 */
router.get('/session', unifiedAuth, (req, res) => {
  const { userId, activeRole, roles, sessionId, authType, requestId } = req.auth;
  res.json({
    userId,
    activeRole,
    roles,
    sessionId,
    authType,
    requestId,
  });
});

/**
 * GET /api/auth/me
 * Profil auth ringkas seragam lintas role
 */
router.get('/me', unifiedAuth, async (req, res, next) => {
  try {
    const { userId, activeRole, roles } = req.auth;
    let profile = { userId, activeRole, roles };

    if (activeRole === 'mahasiswa') {
      const [[user]] = await pool.query(
        'SELECT id, email, npm, nama, no_wa, angkatan, semester, track, status_proposal FROM mahasiswa WHERE id = ?',
        [userId]
      );
      if (user) profile = { ...profile, ...user };
    } else if (activeRole === 'admin') {
      profile.email = req.auth.email || process.env.ADMIN_EMAIL;
      profile.nama = 'Administrator';
    } else {
      // dosen/koordinator/kaprodi
      const [[user]] = await pool.query(
        'SELECT id, email, nidn, nama, no_wa, is_active FROM dosen WHERE id = ?',
        [userId]
      );
      if (user) profile = { ...profile, ...user };
    }

    res.json(profile);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/logout
 * Invalidate session/cookie + revoke token chain
 */
router.post('/logout', unifiedAuth, async (req, res) => {
  try {
    // Audit the logout
    await auditLogout(req);

    // Revoke JWT token if applicable
    if (req.auth.authType === 'bearer' && req.auth.sessionId) {
      await revokeToken(req.auth.sessionId);
    }

    // Clear session cookie
    res.clearCookie('better-auth.session_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
    });

    res.json({
      message: 'Logged out successfully',
      request_id: req.requestId,
    });
  } catch (err) {
    console.error('Logout error:', err);
    res.json({ message: 'Logged out' });
  }
});

/**
 * POST /api/auth/refresh
 * Rotate refresh token (JWT-based for legacy, session auto-refreshes)
 */
router.post('/refresh', unifiedAuth, async (req, res) => {
  try {
    const { userId, activeRole, roles, authType, email } = req.auth;

    if (authType === 'session') {
      // Session-based auth auto-refreshes; just confirm validity
      return res.json({
        message: 'Session is valid',
        authType: 'session',
        request_id: req.requestId,
      });
    }

    // For bearer JWT: issue a new token
    const newToken = generateToken({
      id: userId,
      email,
      role: activeRole,
      roles,
    });

    res.json({
      token: newToken,
      authType: 'bearer',
      request_id: req.requestId,
    });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to refresh token',
        request_id: req.requestId,
      },
    });
  }
});

export default router;
