/**
 * Rate Limiting Configuration (Upstash)
 * 
 * Three profiles:
 * - authLimiter: strict (auth/login/otp/reset) — 10 req / 15 min
 * - generalLimiter: normal (API umum) — 100 req / 15 min
 * - adminLimiter: dedicated (internal/admin) — 30 req / 15 min
 * 
 * Uses Upstash Ratelimit when Redis available, falls back to express-rate-limit in-memory.
 * Fail-closed for auth endpoints, fail-open for non-sensitive.
 */
import { rateLimit } from 'express-rate-limit';
import { getRedisClient, isRedisAvailable } from '../config/redis.js';

let Ratelimit = null;

async function loadUpstashRatelimit() {
  if (Ratelimit) return Ratelimit;
  try {
    const mod = await import('@upstash/ratelimit');
    Ratelimit = mod.Ratelimit;
    return Ratelimit;
  } catch {
    return null;
  }
}

/**
 * Rate limit response handler — standardized format
 */
function rateLimitHandler(req, res) {
  return res.status(429).json({
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later',
      request_id: req.requestId || 'unknown',
    },
  });
}

/**
 * Create an Upstash-powered rate limit middleware
 */
function createUpstashMiddleware(limiter, { failClosed = true } = {}) {
  return async (req, res, next) => {
    try {
      const key = req.ip || 'unknown';
      const result = await limiter.limit(key);

      // Set standard rate limit headers
      res.setHeader('RateLimit-Limit', result.limit);
      res.setHeader('RateLimit-Remaining', result.remaining);
      res.setHeader('RateLimit-Reset', Math.ceil(result.reset / 1000));

      if (!result.success) {
        return rateLimitHandler(req, res);
      }
      next();
    } catch (err) {
      // On error: fail-closed blocks, fail-open allows
      if (failClosed) {
        return rateLimitHandler(req, res);
      }
      next();
    }
  };
}

/**
 * Strict limiter for auth endpoints (login, OTP, reset)
 * Fail-closed: blocks if store errors
 */
export async function createAuthLimiter() {
  const RL = await loadUpstashRatelimit();
  const client = getRedisClient();

  if (RL && isRedisAvailable() && client) {
    const limiter = new RL({
      redis: client,
      limiter: RL.slidingWindow(10, '15 m'),
      prefix: 'rl:auth',
    });
    return createUpstashMiddleware(limiter, { failClosed: true });
  }

  // Fallback: in-memory express-rate-limit
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: rateLimitHandler,
  });
}

/**
 * Normal limiter for general API endpoints
 * Fail-open: allows requests on store error
 */
export async function createGeneralLimiter() {
  const RL = await loadUpstashRatelimit();
  const client = getRedisClient();

  if (RL && isRedisAvailable() && client) {
    const limiter = new RL({
      redis: client,
      limiter: RL.slidingWindow(100, '15 m'),
      prefix: 'rl:general',
    });
    return createUpstashMiddleware(limiter, { failClosed: false });
  }

  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: rateLimitHandler,
    passOnStoreError: true,
  });
}

/**
 * Admin limiter for internal/admin endpoints
 */
export async function createAdminLimiter() {
  const RL = await loadUpstashRatelimit();
  const client = getRedisClient();

  if (RL && isRedisAvailable() && client) {
    const limiter = new RL({
      redis: client,
      limiter: RL.slidingWindow(30, '15 m'),
      prefix: 'rl:admin',
    });
    return createUpstashMiddleware(limiter, { failClosed: true });
  }

  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: rateLimitHandler,
  });
}
