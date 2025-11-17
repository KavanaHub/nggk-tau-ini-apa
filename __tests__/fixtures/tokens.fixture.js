import { generateTestToken, generateExpiredToken, generateInvalidToken } from '../helpers/auth.helper.js';
import { testUsers } from './users.fixture.js';

/**
 * Pre-generated test tokens for different user roles
 */

export function getTestTokens() {
  return {
    mahasiswa1: generateTestToken({
      id: 1,
      name: testUsers.mahasiswa1.name,
      email: testUsers.mahasiswa1.email,
      role: testUsers.mahasiswa1.role
    }),
    mahasiswa2: generateTestToken({
      id: 2,
      name: testUsers.mahasiswa2.name,
      email: testUsers.mahasiswa2.email,
      role: testUsers.mahasiswa2.role
    }),
    dosen1: generateTestToken({
      id: 3,
      name: testUsers.dosen1.name,
      email: testUsers.dosen1.email,
      role: testUsers.dosen1.role
    }),
    dosen2: generateTestToken({
      id: 4,
      name: testUsers.dosen2.name,
      email: testUsers.dosen2.email,
      role: testUsers.dosen2.role
    }),
    penguji1: generateTestToken({
      id: 5,
      name: testUsers.penguji1.name,
      email: testUsers.penguji1.email,
      role: testUsers.penguji1.role
    }),
    koordinator1: generateTestToken({
      id: 6,
      name: testUsers.koordinator1.name,
      email: testUsers.koordinator1.email,
      role: testUsers.koordinator1.role
    })
  };
}

/**
 * Get an expired token for testing
 */
export function getExpiredToken() {
  return generateExpiredToken({
    id: 999,
    name: 'Expired User',
    email: 'expired@test.com',
    role: 'mahasiswa'
  });
}

/**
 * Get an invalid token for testing
 */
export function getInvalidToken() {
  return generateInvalidToken({
    id: 999,
    name: 'Invalid User',
    email: 'invalid@test.com',
    role: 'mahasiswa'
  });
}

/**
 * Get a malformed token for testing
 */
export function getMalformedToken() {
  return 'this-is-not-a-valid-jwt-token';
}
