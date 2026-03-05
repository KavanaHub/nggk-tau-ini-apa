/**
 * Upstash Redis Client Configuration
 * Serverless-friendly (HTTP-based, no persistent TCP connections)
 * Used for: rate limiting, token revocation, OTP throttle, session cache
 * Fallback behavior: degrade gracefully when Upstash is unavailable
 */
import { Redis } from '@upstash/redis';
import { env } from './env.js';

let redisClient = null;
let isRedisReady = false;

export async function initRedis() {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('⚠️  Upstash Redis not configured (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN missing)');
    console.warn('   Rate limiting and caching will use in-memory fallback.');
    return null;
  }

  try {
    redisClient = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });

    // Verify connection with a ping
    const pong = await redisClient.ping();
    if (pong === 'PONG') {
      isRedisReady = true;
      console.log('✅ Upstash Redis connected');
    }
  } catch (err) {
    console.warn('⚠️  Upstash Redis unavailable:', err.message);
    console.warn('   Rate limiting and caching will use in-memory fallback.');
    isRedisReady = false;
  }

  return redisClient;
}

export function getRedisClient() {
  return redisClient;
}

export function isRedisAvailable() {
  return isRedisReady && redisClient !== null;
}

/**
 * Set a key with TTL (seconds)
 */
export async function redisSet(key, value, ttlSeconds) {
  if (!isRedisAvailable()) return false;
  try {
    await redisClient.set(key, value, { ex: ttlSeconds });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get a key value
 */
export async function redisGet(key) {
  if (!isRedisAvailable()) return null;
  try {
    return await redisClient.get(key);
  } catch {
    return null;
  }
}

/**
 * Delete a key
 */
export async function redisDel(key) {
  if (!isRedisAvailable()) return false;
  try {
    await redisClient.del(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if key exists
 */
export async function redisExists(key) {
  if (!isRedisAvailable()) return false;
  try {
    return (await redisClient.exists(key)) === 1;
  } catch {
    return false;
  }
}

/**
 * Increment a key (atomic counter)
 */
export async function redisIncr(key) {
  if (!isRedisAvailable()) return 0;
  try {
    return await redisClient.incr(key);
  } catch {
    return 0;
  }
}

/**
 * Set expiry on a key
 */
export async function redisExpire(key, ttlSeconds) {
  if (!isRedisAvailable()) return false;
  try {
    await redisClient.expire(key, ttlSeconds);
    return true;
  } catch {
    return false;
  }
}

/**
 * Token/session revocation store
 */
export async function revokeToken(tokenId, ttlSeconds = 7 * 24 * 3600) {
  return redisSet(`revoked:${tokenId}`, '1', ttlSeconds);
}

export async function isTokenRevoked(tokenId) {
  return redisExists(`revoked:${tokenId}`);
}

/**
 * OTP throttle window
 */
export async function incrementOTPAttempt(email, windowSeconds = 600) {
  if (!isRedisAvailable()) return 0;
  try {
    const key = `otp_throttle:${email}`;
    const count = await redisIncr(key);
    if (count === 1) {
      await redisExpire(key, windowSeconds);
    }
    return count;
  } catch {
    return 0;
  }
}

export async function getOTPAttemptCount(email) {
  const count = await redisGet(`otp_throttle:${email}`);
  return parseInt(count) || 0;
}

/**
 * Short-lived auth cache (profile/role)
 */
export async function cacheUserProfile(userId, profile, ttlSeconds = 300) {
  return redisSet(`profile:${userId}`, JSON.stringify(profile), ttlSeconds);
}

export async function getCachedUserProfile(userId) {
  const data = await redisGet(`profile:${userId}`);
  return data ? JSON.parse(data) : null;
}

export async function invalidateUserProfile(userId) {
  return redisDel(`profile:${userId}`);
}

/**
 * Graceful shutdown (no-op for Upstash HTTP client)
 */
export async function closeRedis() {
  redisClient = null;
  isRedisReady = false;
}
