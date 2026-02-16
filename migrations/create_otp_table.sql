-- Active: 1769140275160@@43.106.25.105@3306@bimbingan_online
-- Migration: Create OTP codes table
-- Run this SQL on your MySQL database

CREATE TABLE IF NOT EXISTS otp_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  type ENUM('login', 'reset_password', 'register') DEFAULT 'reset_password',
  payload JSON NULL,
  expires_at DATETIME NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_type (email, type),
  INDEX idx_expires (expires_at)
);

-- Clean up expired OTPs (optional scheduled event)
-- CREATE EVENT IF NOT EXISTS cleanup_expired_otps
-- ON SCHEDULE EVERY 1 HOUR
-- DO DELETE FROM otp_codes WHERE expires_at < NOW() OR used = TRUE;
