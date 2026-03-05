/**
 * Environment Configuration with Schema Validation (Zod)
 * Validates all required env vars at startup — fails fast if misconfigured.
 */
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // Server
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),

  // Database
  DB_HOST: z.string().min(1, 'DB_HOST is required'),
  DB_USER: z.string().min(1, 'DB_USER is required'),
  DB_PASSWORD: z.string().min(1, 'DB_PASSWORD is required'),
  DB_NAME: z.string().min(1, 'DB_NAME is required'),
  DB_PORT: z.coerce.number().default(3306),

  // JWT (legacy — will sunset)
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Better Auth
  BETTER_AUTH_SECRET: z.string().min(32).default(''),
  BETTER_AUTH_URL: z.string().url().optional(),

  // Upstash Redis
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Admin
  ADMIN_EMAIL: z.string().email().default('admin@kavanahub.com'),
  ADMIN_PASSWORD: z.string().min(8).default(''),

  // CORS
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001'),

  // External services (optional)
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  GCS_BUCKET_NAME: z.string().optional(),
  MAILTRAP_API_TOKEN: z.string().optional(),
  FONNTE_TOKEN: z.string().optional(),
  WHATSAPP_ADMIN_PHONE: z.string().optional(),

  // OpenTelemetry (optional)
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  OTEL_SERVICE_NAME: z.string().default('kavanahub-api'),
});

function validateEnv() {
  // Use BETTER_AUTH_SECRET fallback from JWT_SECRET if not set
  if (!process.env.BETTER_AUTH_SECRET && process.env.JWT_SECRET) {
    process.env.BETTER_AUTH_SECRET = (process.env.JWT_SECRET + '-better-auth-kavanahub-secret').slice(0, 64);
  }

  const result = envSchema.safeParse(process.env);
  if (result.success) {
    return result.data;
  }

  console.error('❌ Environment validation failed:');
  for (const issue of result.error.issues) {
    console.error(`   ${issue.path.join('.')}: ${issue.message}`);
  }

  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }

  console.warn('⚠️  Continuing with defaults in development mode...');

  // Manually construct a safe fallback for dev
  return {
    PORT: parseInt(process.env.PORT) || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_USER: process.env.DB_USER || 'root',
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    DB_NAME: process.env.DB_NAME || 'bimbingan_online',
    DB_PORT: parseInt(process.env.DB_PORT) || 3306,
    JWT_SECRET: process.env.JWT_SECRET || 'dev-jwt-secret-1234567890',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || 'dev-better-auth-secret-padded-to-32chars!',
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || undefined,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || undefined,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@kavanahub.com',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '',
    CORS_ORIGINS: process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001',
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    GCS_BUCKET_NAME: process.env.GCS_BUCKET_NAME,
    MAILTRAP_API_TOKEN: process.env.MAILTRAP_API_TOKEN,
    FONNTE_TOKEN: process.env.FONNTE_TOKEN,
    WHATSAPP_ADMIN_PHONE: process.env.WHATSAPP_ADMIN_PHONE,
    OTEL_EXPORTER_OTLP_ENDPOINT: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    OTEL_SERVICE_NAME: process.env.OTEL_SERVICE_NAME || 'kavanahub-api',
  };
}

export const env = validateEnv();

// Derived config per environment
export const config = {
  isDev: env.NODE_ENV === 'development',
  isProd: env.NODE_ENV === 'production',
  isStaging: env.NODE_ENV === 'staging',
  port: env.PORT,
  corsOrigins: env.CORS_ORIGINS.split(',').map(s => s.trim()).filter(Boolean),
  cookie: {
    secure: env.NODE_ENV !== 'development',
    sameSite: 'lax',
    httpOnly: true,
  },
};
