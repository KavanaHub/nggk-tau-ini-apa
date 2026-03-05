/**
 * Audit Logging System
 * 
 * Logs sensitive actions to audit_logs table:
 * - login/logout
 * - role changes
 * - approve/reject academic decisions
 * - jadwal/sidang changes
 * - dosen assignment
 * 
 * Format: structured JSON with request_id, user_id, role, action, target, result
 */
import pool from '../config/db.js';

// Ensure audit_logs table exists (auto-create on first use)
let tableReady = false;

async function ensureAuditTable() {
  if (tableReady) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        request_id VARCHAR(64),
        user_id VARCHAR(64),
        role VARCHAR(50),
        action VARCHAR(100) NOT NULL,
        target VARCHAR(255),
        target_id VARCHAR(64),
        result VARCHAR(50) DEFAULT 'success',
        details JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_audit_created (created_at),
        INDEX idx_audit_user (user_id),
        INDEX idx_audit_action (action)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    tableReady = true;
  } catch (err) {
    console.error('Failed to create audit_logs table:', err.message);
  }
}

/**
 * Log an audit event
 * @param {Object} params
 * @param {string} params.requestId
 * @param {string|number} params.userId
 * @param {string} params.role
 * @param {string} params.action - e.g. 'login', 'logout', 'role_change', 'approve_proposal'
 * @param {string} [params.target] - what was acted on (e.g. 'mahasiswa', 'jadwal')
 * @param {string|number} [params.targetId]
 * @param {string} [params.result] - 'success' | 'failure' | 'denied'
 * @param {object} [params.details] - any extra context
 * @param {string} [params.ip]
 * @param {string} [params.userAgent]
 */
export async function auditLog({
  requestId,
  userId,
  role,
  action,
  target = null,
  targetId = null,
  result = 'success',
  details = null,
  ip = null,
  userAgent = null,
}) {
  try {
    await ensureAuditTable();
    await pool.query(
      `INSERT INTO audit_logs 
       (request_id, user_id, role, action, target, target_id, result, details, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        requestId || null,
        String(userId || 'anonymous'),
        role || 'unknown',
        action,
        target,
        targetId ? String(targetId) : null,
        result,
        details ? JSON.stringify(details) : null,
        ip,
        userAgent,
      ]
    );
  } catch (err) {
    // Audit log failure should not crash the request
    console.error('[AUDIT] Failed to write audit log:', err.message, { action, userId });
  }
}

/**
 * Express middleware: auto-audit certain request patterns
 * Attach to routes that need automatic audit tracking.
 */
export function auditMiddleware(action, getTarget) {
  return (req, res, next) => {
    // Capture the original res.json to audit after response
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      const auth = req.auth || req.user;
      const target = typeof getTarget === 'function' ? getTarget(req) : getTarget;
      const result = res.statusCode >= 400 ? 'failure' : 'success';

      auditLog({
        requestId: req.requestId,
        userId: auth?.userId || auth?.id,
        role: auth?.activeRole || auth?.role,
        action,
        target,
        targetId: req.params?.id,
        result,
        details: res.statusCode >= 400 ? { error: body?.error || body?.message } : null,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return originalJson(body);
    };
    next();
  };
}

/**
 * Direct audit helper for login/logout events
 */
export async function auditLogin(req, userId, role, success = true) {
  await auditLog({
    requestId: req.requestId,
    userId,
    role,
    action: 'login',
    result: success ? 'success' : 'failure',
    details: { email: req.body?.email },
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
}

export async function auditLogout(req) {
  const auth = req.auth || req.user;
  await auditLog({
    requestId: req.requestId,
    userId: auth?.userId || auth?.id,
    role: auth?.activeRole || auth?.role,
    action: 'logout',
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
}
