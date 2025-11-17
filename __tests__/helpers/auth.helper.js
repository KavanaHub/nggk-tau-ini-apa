import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

/**
 * Authentication helper utilities for testing
 */

/**
 * Generate a valid JWT token for testing
 */
export function generateTestToken(userData = {}) {
  const defaultUser = {
    id: 1,
    name: 'Test User',
    email: 'test@test.com',
    role: 'mahasiswa'
  };
  
  const user = { ...defaultUser, ...userData };
  
  return jwt.sign(user, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '1h'
  });
}

/**
 * Generate an expired token for testing
 */
export function generateExpiredToken(userData = {}) {
  const defaultUser = {
    id: 1,
    name: 'Test User',
    email: 'test@test.com',
    role: 'mahasiswa'
  };
  
  const user = { ...defaultUser, ...userData };
  
  return jwt.sign(user, process.env.JWT_SECRET, {
    expiresIn: '-1h' // Already expired
  });
}

/**
 * Generate an invalid token (wrong signature)
 */
export function generateInvalidToken(userData = {}) {
  const defaultUser = {
    id: 1,
    name: 'Test User',
    email: 'test@test.com',
    role: 'mahasiswa'
  };
  
  const user = { ...defaultUser, ...userData };
  
  return jwt.sign(user, 'wrong_secret', {
    expiresIn: '1h'
  });
}

/**
 * Hash a password for testing
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Decode a JWT token without verification (for testing)
 */
export function decodeToken(token) {
  return jwt.decode(token);
}

/**
 * Create authorization header for HTTP requests
 */
export function createAuthHeader(token) {
  return `Bearer ${token}`;
}

/**
 * Extract token from authorization header
 */
export function extractToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
}

/**
 * Generate test user credentials for different roles
 */
export function getTestUserCredentials(role = 'mahasiswa') {
  const users = {
    mahasiswa: {
      name: 'Test Student',
      email: 'student@test.com',
      password: 'password123',
      role: 'mahasiswa'
    },
    dosen: {
      name: 'Test Advisor',
      email: 'advisor@test.com',
      password: 'password123',
      role: 'dosen',
      sub_role: 'pembimbing'
    },
    penguji: {
      name: 'Test Examiner',
      email: 'examiner@test.com',
      password: 'password123',
      role: 'dosen',
      sub_role: 'penguji'
    },
    koordinator: {
      name: 'Test Coordinator',
      email: 'coordinator@test.com',
      password: 'password123',
      role: 'koordinator'
    }
  };
  
  return users[role] || users.mahasiswa;
}

/**
 * Create a full test user with hashed password
 */
export async function createTestUser(role = 'mahasiswa', overrides = {}) {
  const credentials = getTestUserCredentials(role);
  const hashedPassword = await hashPassword(credentials.password);
  
  return {
    ...credentials,
    password: hashedPassword,
    ...overrides
  };
}
