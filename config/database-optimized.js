import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// ============================================================================
// OPTIMIZED DATABASE CONNECTION POOL CONFIGURATION
// ============================================================================

/**
 * Connection Pool Configuration Guidelines:
 * 
 * connectionLimit: Maximum number of connections in the pool
 *   - Formula: (CPU cores × 2) + effective_spindle_count
 *   - For typical application servers: 20-50 connections
 *   - Current: 50 (suitable for moderate load)
 * 
 * waitForConnections: Wait for available connection vs reject immediately
 *   - true: Queue requests when pool is exhausted (recommended)
 * 
 * queueLimit: Maximum queued connection requests
 *   - 0 = unlimited queue (can cause memory issues)
 *   - Recommended: 2× connectionLimit to prevent memory exhaustion
 * 
 * connectTimeout: Milliseconds to wait for initial connection
 *   - Recommended: 10000-20000 (10-20 seconds)
 * 
 * acquireTimeout: Milliseconds to wait for connection from pool
 *   - Recommended: 10000-15000 (10-15 seconds)
 * 
 * timeout: Milliseconds before killing idle connections
 *   - Recommended: 60000 (60 seconds)
 * 
 * idleTimeout: Time before releasing idle connections
 *   - Recommended: 60000 (60 seconds) to reduce connection churn
 * 
 * maxIdle: Maximum idle connections to maintain
 *   - Recommended: 10 to keep some connections warm
 * 
 * enableKeepAlive: Maintain connection with periodic pings
 *   - true: Prevents connection drops due to firewall/proxy timeouts
 * 
 * keepAliveInitialDelay: Delay before first keepalive ping
 *   - Recommended: 0 (immediate)
 */

const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'Bimbingan_Online',
  port: process.env.DB_PORT || 3306,
  
  // Connection pool settings
  waitForConnections: true,
  connectionLimit: 50, // Increased from 10 for better concurrency
  queueLimit: 100, // Limit queue to prevent memory exhaustion
  
  // Timeout settings
  connectTimeout: 20000, // 20 seconds for initial connection
  acquireTimeout: 15000, // 15 seconds to acquire from pool
  timeout: 60000, // 60 seconds query timeout
  
  // Idle connection management
  idleTimeout: 60000, // Release idle connections after 60 seconds
  maxIdle: 10, // Keep 10 idle connections warm
  
  // Keep-alive to prevent connection drops
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  
  // Performance optimizations
  multipleStatements: false, // Security: prevent SQL injection via multiple statements
  dateStrings: false, // Return proper Date objects
  supportBigNumbers: true,
  bigNumberStrings: false,
  
  // Character set
  charset: 'utf8mb4', // Full Unicode support including emojis
  
  // SSL configuration (uncomment for production with SSL)
  // ssl: {
  //   ca: process.env.DB_SSL_CA,
  //   rejectUnauthorized: true
  // },
  
  // Timezone handling
  timezone: 'Z', // Use UTC for consistency
};

// Create the connection pool
const pool = mysql.createPool(poolConfig);

// ============================================================================
// CONNECTION POOL MONITORING AND HEALTH CHECKS
// ============================================================================

/**
 * Get current pool statistics
 * Useful for monitoring and debugging connection issues
 */
export const getPoolStats = () => {
  return {
    totalConnections: pool.pool._allConnections.length,
    activeConnections: pool.pool._allConnections.length - pool.pool._freeConnections.length,
    idleConnections: pool.pool._freeConnections.length,
    queuedRequests: pool.pool._connectionQueue.length,
    config: {
      connectionLimit: pool.pool.config.connectionLimit,
      queueLimit: pool.pool.config.queueLimit,
    }
  };
};

/**
 * Test database connectivity
 * Should be called on application startup
 */
export const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    logger.info('Database connection pool initialized successfully');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error.message);
    throw error;
  }
};

/**
 * Graceful shutdown - close all connections
 * Call this when shutting down the application
 */
export const closePool = async () => {
  try {
    await pool.end();
    logger.info('Database connection pool closed gracefully');
  } catch (error) {
    logger.error('Error closing connection pool:', error.message);
    throw error;
  }
};

/**
 * Safe query execution with automatic connection management
 * Includes error handling and connection release
 * 
 * @param {string} sql - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
export const executeQuery = async (sql, params = []) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [results] = await connection.query(sql, params);
    return results;
  } catch (error) {
    logger.error('Query execution error:', error.message);
    logger.error('SQL:', sql);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * Execute transaction with automatic rollback on error
 * 
 * @param {Function} callback - Async function receiving connection
 * @returns {Promise<any>} Transaction result
 */
export const executeTransaction = async (callback) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const result = await callback(connection);
    
    await connection.commit();
    return result;
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    logger.error('Transaction error:', error.message);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * Batch insert helper for efficient bulk operations
 * 
 * @param {string} table - Table name
 * @param {Array<Array>} values - Array of value arrays
 * @returns {Promise<any>} Insert result
 */
export const batchInsert = async (table, columns, values) => {
  if (!values || values.length === 0) {
    throw new Error('No values provided for batch insert');
  }
  
  const placeholders = values.map(() => `(${columns.map(() => '?').join(',')})`).join(',');
  const sql = `INSERT INTO ${table} (${columns.join(',')}) VALUES ${placeholders}`;
  const flatValues = values.flat();
  
  return executeQuery(sql, flatValues);
};

// ============================================================================
// PERIODIC HEALTH CHECKS
// ============================================================================

/**
 * Start periodic pool monitoring
 * Logs pool statistics every interval
 */
export const startPoolMonitoring = (intervalMs = 60000) => {
  setInterval(() => {
    const stats = getPoolStats();
    
    // Log warning if pool is exhausted
    if (stats.activeConnections >= stats.config.connectionLimit * 0.9) {
      logger.warn('Connection pool nearing capacity', stats);
    }
    
    // Log warning if queue is building up
    if (stats.queuedRequests > 10) {
      logger.warn('Connection queue building up', stats);
    }
    
    // Optional: Log stats for monitoring (can be sent to monitoring service)
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Database pool stats:', stats);
    }
  }, intervalMs);
};

// ============================================================================
// ERROR HANDLING AND RECONNECTION
// ============================================================================

/**
 * Handle pool errors
 */
pool.on('error', (err) => {
  logger.error('Unexpected database pool error:', err);
  
  // Handle specific error types
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    logger.error('Database connection lost. Pool will reconnect automatically.');
  } else if (err.code === 'ER_CON_COUNT_ERROR') {
    logger.error('Too many database connections. Consider increasing connection limit.');
  } else if (err.code === 'ECONNREFUSED') {
    logger.error('Database connection refused. Check if database server is running.');
  }
});

/**
 * Handle connection acquire events (for debugging)
 */
pool.on('acquire', (connection) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Connection %d acquired', connection.threadId);
  }
});

/**
 * Handle connection release events (for debugging)
 */
pool.on('release', (connection) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Connection %d released', connection.threadId);
  }
});

// ============================================================================
// EXPORTS
// ============================================================================

export default pool;

// Usage examples:
/*
// Basic usage (unchanged from current implementation)
import pool from './config/database-optimized.js';
const [results] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);

// Using safe query execution helper
import { executeQuery } from './config/database-optimized.js';
const results = await executeQuery('SELECT * FROM users WHERE id = ?', [userId]);

// Using transaction helper
import { executeTransaction } from './config/database-optimized.js';
const result = await executeTransaction(async (conn) => {
  await conn.query('INSERT INTO proposals (...) VALUES (?)', [data]);
  await conn.query('UPDATE users SET ... WHERE id = ?', [userId]);
  return { success: true };
});

// Using batch insert
import { batchInsert } from './config/database-optimized.js';
await batchInsert('guidance_sessions', 
  ['proposal_id', 'advisor_id', 'topic', 'notes'],
  [[1, 2, 'Topic 1', 'Notes 1'], [1, 2, 'Topic 2', 'Notes 2']]
);

// Get pool statistics
import { getPoolStats } from './config/database-optimized.js';
const stats = getPoolStats();
logger.info('Active connections:', stats.activeConnections);

// Test connection on startup
import { testConnection } from './config/database-optimized.js';
await testConnection();

// Graceful shutdown
import { closePool } from './config/database-optimized.js';
process.on('SIGTERM', async () => {
  await closePool();
  process.exit(0);
});

// Start monitoring (optional)
import { startPoolMonitoring } from './config/database-optimized.js';
startPoolMonitoring(60000); // Log stats every 60 seconds
*/
