// OpenTelemetry MUST be initialized before other imports
import { initTelemetry, traceContextMiddleware } from './config/telemetry.js';
initTelemetry();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import functions from '@google-cloud/functions-framework';
import swaggerUi from 'swagger-ui-express';
import { toNodeHandler } from 'better-auth/node';

import { env, config } from './config/env.js';
import { initRedis } from './config/redis.js';
import { auth } from './config/auth.js';

import authRoutes from './routes/authRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import mahasiswaRoutes from './routes/mahasiswaRoutes.js';
import kaprodiRoutes from './routes/kaprodiRoutes.js';
import koordinatorRoutes from './routes/koordinatorRoutes.js';
import dosenRoutes from './routes/dosenRoutes.js';
import pengujiRoutes from './routes/pengujiRoutes.js';
import bimbinganRoutes from './routes/bimbinganRoutes.js';
import sidangRoutes from './routes/sidangRoutes.js';
import proposalRoutes from './routes/proposalRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import swaggerSpec from './swagger.js';

import requestId from './middleware/requestId.js';
import { globalErrorHandler } from './middleware/errorResponse.js';
import { createAuthLimiter, createGeneralLimiter, createAdminLimiter } from './middleware/rateLimiter.js';

dotenv.config();

// Initialize Redis (non-blocking)
initRedis().catch(err => console.warn('Redis init skipped:', err.message));

const app = express();

// ── Trust proxy (for correct IP behind reverse proxy) ──
app.set('trust proxy', 1);

// ── Security Headers (helmet + CSP) ──
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // needed for Swagger UI
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow Swagger UI assets
}));

// ── CORS (allowlist, not wildcard) ──
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (server-to-server, curl, mobile apps)
    if (!origin) return callback(null, true);
    if (config.corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    // In development, be more lenient
    if (config.isDev) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // Allow cookies for Better Auth sessions
  exposedHeaders: ['X-Request-Id', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
}));

app.use(compression());

// ── Request ID (X-Request-Id on every request) ──
app.use(requestId);

// ── Trace context propagation ──
app.use(traceContextMiddleware);

// ── Better Auth handler (BEFORE express.json) ──
// Express 5 uses {*path} syntax instead of *
app.all('/api/auth/better/{*path}', toNodeHandler(auth));

// ── JSON body parser (after Better Auth to avoid conflicts) ──
app.use(express.json());

// ── Rate Limiters (async init for Redis store) ──
(async () => {
  try {
    const authLimiter = await createAuthLimiter();
    const generalLimiter = await createGeneralLimiter();
    const adminLimiter = await createAdminLimiter();

    // Strict rate limit on auth endpoints
    app.use('/api/auth/login', authLimiter);
    app.use('/api/auth/request-otp', authLimiter);
    app.use('/api/auth/verify-otp', authLimiter);
    app.use('/api/auth/reset-password', authLimiter);
    app.use('/api/auth/request-register-otp', authLimiter);
    app.use('/api/auth/verify-register-otp', authLimiter);

    // Admin rate limit
    app.use('/api/admin', adminLimiter);

    // General rate limit on all API
    app.use('/api/', generalLimiter);
  } catch (err) {
    console.warn('Rate limiter init warning:', err.message);
  }
})();

// ── Swagger documentation ──
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/docs.json', (req, res) => res.json(swaggerSpec));

// ── Health endpoints (excluded from tracing) ──
app.use('/', healthRoutes);

// ── API Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/auth', sessionRoutes); // session/me/logout/refresh
app.use('/api/mahasiswa', mahasiswaRoutes);
app.use('/api/kaprodi', kaprodiRoutes);
app.use('/api/koordinator', koordinatorRoutes);
app.use('/api/dosen', dosenRoutes);
app.use('/api/penguji', pengujiRoutes);
app.use('/api/bimbingan', bimbinganRoutes);
app.use('/api/proposal', proposalRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/sidang', sidangRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Bimbingan Online API OK' });
});

// Ping endpoint (kept for backward compat)
app.get('/ping', (req, res) => {
  res.json({
    status: 'ok',
    message: 'pong',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ── Global Error Handler (standardized format) ──
app.use(globalErrorHandler);

// EXPORT FOR GCF (Gen2)
functions.http('kavana', app);

// EXPORT FOR VERCEL
export default app;

export const kavana = app;
