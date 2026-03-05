/**
 * Health Endpoints
 * 
 * - GET /health   — readiness probe (checks DB + Redis)
 * - GET /ready    — readiness (same as health)
 * - GET /live     — liveness (always 200 if process running)
 * 
 * Excluded from OpenTelemetry tracing to avoid noise.
 */
import express from 'express';
import pool from '../config/db.js';
import { isRedisAvailable } from '../config/redis.js';

const router = express.Router();

router.get('/health', async (req, res) => {
  const checks = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks: {},
  };

  // DB check
  try {
    await pool.query('SELECT 1');
    checks.checks.database = 'ok';
  } catch {
    checks.checks.database = 'error';
    checks.status = 'degraded';
  }

  // Redis check
  checks.checks.redis = isRedisAvailable() ? 'ok' : 'unavailable';
  if (!isRedisAvailable()) {
    checks.status = checks.status === 'ok' ? 'degraded' : checks.status;
  }

  const statusCode = checks.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(checks);
});

router.get('/ready', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'not ready' });
  }
});

router.get('/live', (req, res) => {
  res.json({ status: 'alive', uptime: process.uptime() });
});

export default router;
