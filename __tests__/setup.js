// Jest Setup File
// This file runs before each test file

import { jest } from '@jest/globals';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';

// Test API URL
process.env.TEST_API_URL = 'https://kavana-backend-j8ktr.ondigitalocean.app';

// ---------- TEST CREDENTIALS FOR ALL ROLES ----------
// Admin credentials (from .env)
process.env.ADMIN_EMAIL = 'renzarnando@gmail.com';
process.env.ADMIN_PASSWORD = 'renz7474';

// Mahasiswa test credentials (ganti dengan akun test mahasiswa yang valid)
process.env.MAHASISWA_EMAIL = '714240042@std.ulbi.ac.id';  // Ganti sesuai data di database
process.env.MAHASISWA_NPM = '714240042';               // Atau gunakan NPM
process.env.MAHASISWA_PASSWORD = 'Renz7474';

// Dosen test credentials
process.env.DOSEN_EMAIL = 'awangga@ulbi.ac.id';           // Ganti sesuai data di database
process.env.DOSEN_PASSWORD = 'bagas7474';

// Kaprodi test credentials
process.env.KAPRODI_EMAIL = 'roniandarsyah@ulbi.ac.id';       // Ganti sesuai data di database
process.env.KAPRODI_PASSWORD = 'bagas7474';

// Koordinator test credentials
process.env.KOORDINATOR_EMAIL = 'nurainisf@ulbi.ac.id'; // Ganti sesuai data di database
process.env.KOORDINATOR_PASSWORD = 'bagas7474';

// Global timeout
jest.setTimeout(30000);

export default {};
