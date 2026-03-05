-- ============================================================
-- Migration: Better Auth tables + Audit Logs
-- Required for hybrid auth system (PLAN.md Phase 2-4)
-- 
-- Tables:
-- 1. user (Better Auth core)
-- 2. session (Better Auth sessions)
-- 3. account (Better Auth accounts)
-- 4. verification (Better Auth verifications)
-- 5. audit_logs (Audit system)
-- ============================================================

USE `bimbingan_online`;

-- Better Auth: user table
CREATE TABLE IF NOT EXISTS `user` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `emailVerified` BOOLEAN DEFAULT FALSE,
  `image` VARCHAR(512) DEFAULT NULL,
  `role` VARCHAR(50) DEFAULT 'user',
  `banned` BOOLEAN DEFAULT FALSE,
  `banReason` TEXT DEFAULT NULL,
  `banExpires` DATETIME DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_email (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Better Auth: session table
CREATE TABLE IF NOT EXISTS `session` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(36) NOT NULL,
  `token` VARCHAR(512) NOT NULL UNIQUE,
  `expiresAt` DATETIME NOT NULL,
  `ipAddress` VARCHAR(45) DEFAULT NULL,
  `userAgent` TEXT DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_session_user (`userId`),
  INDEX idx_session_token (`token`),
  FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Better Auth: account table
CREATE TABLE IF NOT EXISTS `account` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(36) NOT NULL,
  `accountId` VARCHAR(255) NOT NULL,
  `providerId` VARCHAR(255) NOT NULL,
  `accessToken` TEXT DEFAULT NULL,
  `refreshToken` TEXT DEFAULT NULL,
  `accessTokenExpiresAt` DATETIME DEFAULT NULL,
  `refreshTokenExpiresAt` DATETIME DEFAULT NULL,
  `scope` VARCHAR(512) DEFAULT NULL,
  `idToken` TEXT DEFAULT NULL,
  `password` VARCHAR(255) DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_account_user (`userId`),
  FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Better Auth: verification table
CREATE TABLE IF NOT EXISTS `verification` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `identifier` VARCHAR(255) NOT NULL,
  `value` TEXT NOT NULL,
  `expiresAt` DATETIME NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_verification_identifier (`identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Audit logs table (created by middleware/audit.js auto-create, but also define here)
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `request_id` VARCHAR(64),
  `user_id` VARCHAR(64),
  `role` VARCHAR(50),
  `action` VARCHAR(100) NOT NULL,
  `target` VARCHAR(255),
  `target_id` VARCHAR(64),
  `result` VARCHAR(50) DEFAULT 'success',
  `details` JSON,
  `ip_address` VARCHAR(45),
  `user_agent` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_created (`created_at`),
  INDEX idx_audit_user (`user_id`),
  INDEX idx_audit_action (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
