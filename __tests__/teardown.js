import pool from '../config/database.js';

/**
 * Global teardown - runs once after all tests complete
 */
export default async function globalTeardown() {
  try {
    // Close database connection pool
    if (pool) {
      await pool.end();
      console.log('Database connection pool closed');
    }
  } catch (error) {
    console.error('Error during global teardown:', error);
  }
}
