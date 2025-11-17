import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load test environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env.test') });

// Set test environment
process.env.NODE_ENV = 'test';

// Increase timeout for database operations
jest.setTimeout(10000);

// Global test utilities
global.testHelpers = {
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  generateRandomEmail: () => `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`,
  
  generateRandomString: (length = 10) => {
    return Math.random().toString(36).substring(2, length + 2);
  }
};

// Mock console methods to reduce noise in tests (optional)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for debugging
  error: console.error,
};
