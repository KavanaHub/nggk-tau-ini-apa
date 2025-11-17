import bcrypt from 'bcryptjs';

/**
 * Test user fixtures
 * Password for all users: 'password123'
 */

// Pre-hashed password for faster test execution
const hashedPassword = '$2a$10$YourHashedPasswordHere'; // Will be generated in tests

export const testUsers = {
  mahasiswa1: {
    id: 1,
    name: 'Budi Santoso',
    email: 'budi.student@test.com',
    password: 'password123', // Plain text for reference
    role: 'mahasiswa',
    sub_role: null
  },
  mahasiswa2: {
    id: 2,
    name: 'Ani Wijaya',
    email: 'ani.student@test.com',
    password: 'password123',
    role: 'mahasiswa',
    sub_role: null
  },
  dosen1: {
    id: 3,
    name: 'Dr. Siti Rahayu',
    email: 'siti.advisor@test.com',
    password: 'password123',
    role: 'dosen',
    sub_role: 'pembimbing'
  },
  dosen2: {
    id: 4,
    name: 'Prof. Ahmad Dahlan',
    email: 'ahmad.advisor@test.com',
    password: 'password123',
    role: 'dosen',
    sub_role: 'pembimbing'
  },
  penguji1: {
    id: 5,
    name: 'Dr. Rina Kusuma',
    email: 'rina.examiner@test.com',
    password: 'password123',
    role: 'dosen',
    sub_role: 'penguji'
  },
  koordinator1: {
    id: 6,
    name: 'Dr. Budi Hartono',
    email: 'budi.coordinator@test.com',
    password: 'password123',
    role: 'koordinator',
    sub_role: null
  }
};

/**
 * Hash passwords for database insertion
 */
export async function hashUserPasswords(users) {
  const hashedUsers = {};
  
  for (const [key, user] of Object.entries(users)) {
    hashedUsers[key] = {
      ...user,
      password: await bcrypt.hash(user.password, 10)
    };
  }
  
  return hashedUsers;
}

/**
 * Get users array for database seeding (without IDs)
 */
export function getUsersForSeeding(users) {
  return Object.values(users).map(({ id, ...user }) => user);
}

/**
 * Create a random test user
 */
export function createRandomUser(role = 'mahasiswa') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  
  return {
    name: `Test User ${random}`,
    email: `test-${timestamp}-${random}@test.com`,
    password: 'password123',
    role: role,
    sub_role: role === 'dosen' ? 'pembimbing' : null
  };
}
