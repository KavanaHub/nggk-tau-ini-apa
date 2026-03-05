/**
 * Better Auth Configuration (Hybrid Auth)
 * 
 * - Session-based auth for web (httpOnly secure cookies)
 * - Bearer token support for API/legacy compatibility
 * - MySQL adapter using existing connection pool
 * - Custom session with roles from dosen_role table
 */
import { betterAuth } from 'better-auth';
import { bearer } from 'better-auth/plugins/bearer';
import { admin as adminPlugin } from 'better-auth/plugins/admin';
import { customSession } from 'better-auth/plugins';
import { createPool } from 'mysql2/promise';
import { env, config } from './env.js';
import pool from './db.js';

/**
 * Fetch roles for a dosen user from dosen_role pivot table
 */
async function fetchUserRoles(userId, userRole) {
  if (userRole === 'admin') return ['admin'];
  if (userRole === 'mahasiswa') return ['mahasiswa'];
  
  try {
    const [rows] = await pool.query(
      `SELECT r.nama_role FROM dosen_role dr
       JOIN role r ON dr.role_id = r.id
       WHERE dr.dosen_id = ?`,
      [userId]
    );
    const roles = rows.map(r => r.nama_role);
    return roles.length > 0 ? roles : [userRole || 'dosen'];
  } catch {
    return [userRole || 'dosen'];
  }
}

/**
 * Better Auth instance
 * Uses MySQL adapter with existing pool, session cookies, bearer tokens
 */
export const auth = betterAuth({
  database: createPool({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    port: env.DB_PORT,
    timezone: 'Z',
    waitForConnections: true,
    connectionLimit: 5,
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL || `http://localhost:${env.PORT}`,
  basePath: '/api/auth/better',
  session: {
    expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
    updateAge: 24 * 60 * 60, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache for 5 minutes
    },
  },
  advanced: {
    cookies: {
      sessionToken: {
        attributes: {
          httpOnly: true,
          secure: config.cookie.secure,
          sameSite: config.cookie.sameSite,
        },
      },
    },
    crossSubDomainCookies: {
      enabled: false,
    },
  },
  plugins: [
    bearer(),
    customSession(async ({ user, session }) => {
      // Enrich session with roles from DB
      const roles = await fetchUserRoles(user.id, user.role);
      const activeRole = roles.includes('kaprodi') ? 'kaprodi'
        : roles.includes('koordinator') ? 'koordinator'
        : roles[0];
      return {
        user: {
          ...user,
          roles,
          activeRole,
        },
        session,
      };
    }),
  ],
  trustedOrigins: config.corsOrigins,
});

export default auth;
