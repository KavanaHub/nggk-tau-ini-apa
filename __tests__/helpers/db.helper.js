import pool from '../../config/database.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Database helper utilities for testing
 */

/**
 * Setup test database - creates tables if they don't exist
 */
export async function setupTestDatabase() {
  const conn = await pool.getConnection();
  
  try {
    // Read and execute database schema
    const schemaPath = resolve(__dirname, '../../database.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.includes('CREATE DATABASE')) {
        continue; // Skip database creation in tests
      }
      if (statement.includes('USE ')) {
        continue; // Skip USE statement
      }
      try {
        await conn.query(statement);
      } catch (error) {
        // Ignore "table already exists" errors
        if (!error.message.includes('already exists')) {
          console.error('Schema execution error:', error.message);
        }
      }
    }
  } finally {
    conn.release();
  }
}

/**
 * Clear all data from tables
 */
export async function clearAllTables() {
  const conn = await pool.getConnection();
  
  try {
    // Disable foreign key checks temporarily
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Get all tables
    const [tables] = await conn.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ? 
      AND table_type = 'BASE TABLE'
    `, [process.env.DB_NAME]);
    
    // Truncate each table
    for (const { table_name } of tables) {
      await conn.query(`TRUNCATE TABLE ${table_name}`);
    }
    
    // Re-enable foreign key checks
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  } finally {
    conn.release();
  }
}

/**
 * Seed database with fixture data
 */
export async function seedDatabase(fixtures) {
  const conn = await pool.getConnection();
  
  try {
    for (const [table, rows] of Object.entries(fixtures)) {
      for (const row of rows) {
        const columns = Object.keys(row).join(', ');
        const placeholders = Object.keys(row).map(() => '?').join(', ');
        const values = Object.values(row);
        
        await conn.query(
          `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`,
          values
        );
      }
    }
  } finally {
    conn.release();
  }
}

/**
 * Execute a raw SQL query (useful for test assertions)
 */
export async function executeQuery(sql, params = []) {
  const conn = await pool.getConnection();
  try {
    const [results] = await conn.query(sql, params);
    return results;
  } finally {
    conn.release();
  }
}

/**
 * Get a single record by ID
 */
export async function getRecordById(table, id) {
  const results = await executeQuery(`SELECT * FROM ${table} WHERE id = ?`, [id]);
  return results[0] || null;
}

/**
 * Count records in a table
 */
export async function countRecords(table, where = '', params = []) {
  const sql = where 
    ? `SELECT COUNT(*) as count FROM ${table} WHERE ${where}`
    : `SELECT COUNT(*) as count FROM ${table}`;
  
  const results = await executeQuery(sql, params);
  return results[0].count;
}

/**
 * Check if record exists
 */
export async function recordExists(table, where, params) {
  const count = await countRecords(table, where, params);
  return count > 0;
}

/**
 * Delete record by ID
 */
export async function deleteRecordById(table, id) {
  return executeQuery(`DELETE FROM ${table} WHERE id = ?`, [id]);
}

/**
 * Begin a transaction (useful for rollback tests)
 */
export async function beginTransaction() {
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  return conn;
}

/**
 * Rollback transaction
 */
export async function rollbackTransaction(conn) {
  await conn.rollback();
  conn.release();
}

/**
 * Commit transaction
 */
export async function commitTransaction(conn) {
  await conn.commit();
  conn.release();
}
