/**
 * Database Helper Utilities
 * 
 * Provides safe database operations with automatic connection handling
 * Ensures connections are always released, even on errors
 */

import pool from '../config/database.js';
import { DatabaseError } from './errors.js';
import { logDatabaseOperation, logError } from './logger.js';

/**
 * Execute a query with automatic connection management
 */
export const executeQuery = async (sql, params = [], operation = 'QUERY') => {
  let conn;
  try {
    conn = await pool.getConnection();
    logDatabaseOperation(operation, 'unknown', { sql, params: params.length });
    const [result] = await conn.query(sql, params);
    return result;
  } catch (error) {
    logError(`Database ${operation} failed`, error, { sql });
    throw new DatabaseError(`Failed to execute ${operation}`, error);
  } finally {
    if (conn) conn.release();
  }
};

/**
 * Execute a transaction with multiple queries
 * Automatically rolls back on error
 */
export const executeTransaction = async (queries) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    
    logDatabaseOperation('TRANSACTION_START', 'multiple', { queryCount: queries.length });
    
    const results = [];
    for (const { sql, params, operation } of queries) {
      logDatabaseOperation(operation || 'QUERY', 'unknown', { sql });
      const [result] = await conn.query(sql, params);
      results.push(result);
    }
    
    await conn.commit();
    logDatabaseOperation('TRANSACTION_COMMIT', 'multiple', { queryCount: queries.length });
    
    return results;
  } catch (error) {
    if (conn) {
      await conn.rollback();
      logDatabaseOperation('TRANSACTION_ROLLBACK', 'multiple', { reason: error.message });
    }
    logError('Transaction failed', error);
    throw new DatabaseError('Transaction failed, all changes rolled back', error);
  } finally {
    if (conn) conn.release();
  }
};

/**
 * Check if a record exists
 */
export const recordExists = async (table, conditions) => {
  const whereClause = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');
  const values = Object.values(conditions);
  
  const sql = `SELECT COUNT(*) as count FROM ${table} WHERE ${whereClause}`;
  const result = await executeQuery(sql, values, 'EXISTS_CHECK');
  
  return result[0].count > 0;
};

/**
 * Get a single record by ID
 */
export const getById = async (table, id, columns = '*') => {
  const sql = `SELECT ${columns} FROM ${table} WHERE id = ?`;
  const result = await executeQuery(sql, [id], 'SELECT_BY_ID');
  return result[0] || null;
};

/**
 * Insert a record and return the inserted ID
 */
export const insertRecord = async (table, data) => {
  const columns = Object.keys(data).join(', ');
  const placeholders = Object.keys(data).map(() => '?').join(', ');
  const values = Object.values(data);
  
  const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
  const result = await executeQuery(sql, values, 'INSERT');
  
  return result.insertId;
};

/**
 * Update a record by ID
 */
export const updateRecord = async (table, id, data) => {
  const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(data), id];
  
  const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
  const result = await executeQuery(sql, values, 'UPDATE');
  
  return result.affectedRows;
};

/**
 * Delete a record by ID
 */
export const deleteRecord = async (table, id) => {
  const sql = `DELETE FROM ${table} WHERE id = ?`;
  const result = await executeQuery(sql, [id], 'DELETE');
  
  return result.affectedRows;
};

/**
 * Safe connection pooling check
 */
export const checkDatabaseConnection = async () => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    return true;
  } catch (error) {
    logError('Database connection check failed', error);
    return false;
  }
};
