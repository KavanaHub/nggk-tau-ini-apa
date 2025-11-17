# Project Improvement Action Plan
## University Thesis Guidance System - Implementation Guide

---

## 📊 Current State vs Target State

### Compliance Scorecard
```
Current Assessment:  4/10 (Development Phase)
Target Assessment:   8.5/10 (Production Ready)
Gap to Close:        4.5 points

Category                 Current  Target   Action
─────────────────────────────────────────────────────
Security                2/10     9/10     Implement validation, rate limiting, secure uploads
Testing                 0/10     9/10     Create comprehensive test suite
Code Quality            6/10     8/10     Refactoring, best practices
Database               6/10     8/10     Optimize queries, add indexes
Documentation          2/10     8/10     Add Swagger/OpenAPI
Error Handling         3/10     9/10     Centralized error middleware, logging
```

---

## 🎯 Quick Win (Day 1) - Security Foundation

### 1. Install Security Dependencies
```bash
npm install express-validator express-rate-limit helmet cors@latest
npm install --save-dev jest supertest ts-jest @types/jest
```

### 2. Create Validation Middleware
**File**: `middleware/validation.js`
```javascript
import { body, validationResult } from 'express-validator';

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: errors.array() 
    });
  }
  next();
};

const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  
  body('email')
    .isEmail().withMessage('Valid email required')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  
  body('role')
    .isIn(['mahasiswa', 'dosen', 'koordinator'])
    .withMessage('Invalid role'),
  
  validateRequest
];

export { registerValidation, validateRequest };
```

### 3. Add Rate Limiting
**File**: `middleware/rateLimiter.js`
```javascript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour
  message: 'Too many registration attempts',
});

export { loginLimiter, registerLimiter };
```

### 4. Update Routes with Validation
**File**: `routes/auth.js`
```javascript
import express from 'express';
import { register, login } from '../controllers/authController.js';
import { registerValidation } from '../middleware/validation.js';
import { loginLimiter, registerLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', registerLimiter, registerValidation, register);
router.post('/login', loginLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], login);

export default router;
```

### 5. Secure File Uploads
**File**: `middleware/fileUpload.js`
```javascript
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Sanitize filename
    const sanitized = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '');
    cb(null, sanitized);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['application/pdf'];
  const allowedExts = ['.pdf'];
  
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new Error('Only PDF files allowed'));
  }
  
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExts.includes(ext)) {
    return cb(new Error('Invalid file extension'));
  }
  
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

export { upload };
```

---

## 🧪 Week 1: Testing Setup

### Create Test Infrastructure
**File**: `jest.config.js`
```javascript
export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/__tests__/**/*.test.js', '**/*.test.js'],
};
```

### Create Sample Unit Test
**File**: `controllers/__tests__/auth.test.js`
```javascript
import { register, login } from '../authController.js';
import pool from '../../config/database.js';

jest.mock('../../config/database.js');

describe('Auth Controller', () => {
  describe('register', () => {
    it('should register a new user successfully', async () => {
      const req = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123',
          role: 'mahasiswa'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // Mock database
      pool.getConnection.mockResolvedValue({
        query: jest.fn()
          .mockResolvedValueOnce([[]])  // Check existing email
          .mockResolvedValueOnce([]),   // Insert user
        release: jest.fn()
      });
      
      await register(req, res);
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User registered successfully'
      });
    });
  });
});
```

### Update package.json
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

---

## 📋 Error Handling Framework

### Create Custom Error Class
**File**: `utils/errors.js`
```javascript
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database error') {
    super(message, 500);
    this.name = 'DatabaseError';
  }
}

export {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  DatabaseError
};
```

### Create Error Middleware
**File**: `middleware/errorHandler.js`
```javascript
import { AppError } from '../utils/errors.js';
import logger from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  
  // Log error
  logger.error({
    error: err.message,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  // Operational errors
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
  
  // Programming errors or unknown errors
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
};

export default errorHandler;
```

### Update App to Use Error Middleware
**File**: `index.js`
```javascript
import errorHandler from './middleware/errorHandler.js';

// ... existing middleware ...

// Error handling middleware (MUST be last)
app.use(errorHandler);
```

---

## 📊 Database Query Optimization

### Issue: N+1 Query in Advisor Listings

**Before (Inefficient)**:
```javascript
const [advisors] = await conn.query('SELECT * FROM users WHERE role = "dosen"');
const result = advisors.map(async (advisor) => {
  const [proposals] = await conn.query(
    'SELECT * FROM proposals WHERE advisor_id = ?',
    [advisor.id]
  );
  return { ...advisor, proposalCount: proposals.length };
});
```

**After (Optimized with JOIN)**:
```javascript
const [results] = await conn.query(`
  SELECT u.*, COUNT(p.id) as proposal_count
  FROM users u
  LEFT JOIN proposals p ON u.id = p.advisor_id
  WHERE u.role = 'dosen'
  GROUP BY u.id
`);
```

### Add Missing Indexes
**File**: `migration.sql`
```sql
-- Add indexes for performance
ALTER TABLE users ADD INDEX idx_role (role);
ALTER TABLE proposals ADD INDEX idx_advisor_id (advisor_id);
ALTER TABLE proposals ADD INDEX idx_coordinator_approval_status (coordinator_approval_status);
ALTER TABLE guidance_sessions ADD INDEX idx_proposal_id (proposal_id);
ALTER TABLE reports ADD INDEX idx_proposal_id (proposal_id);
ALTER TABLE exams ADD INDEX idx_proposal_id (proposal_id);

-- Add timestamps
ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE proposals ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
```

---

## 📝 Logging Setup

### Create Logger Utility
**File**: `utils/logger.js`
```javascript
import fs from 'fs';
import path from 'path';

const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

class Logger {
  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = JSON.stringify({
      timestamp,
      level,
      message,
      ...data
    });
    
    console.log(logEntry);
    
    // Write to file
    fs.appendFileSync(
      path.join(logDir, `${level}.log`),
      logEntry + '\n'
    );
  }
  
  info(message, data) {
    this.log('INFO', message, data);
  }
  
  error(message, data) {
    this.log('ERROR', message, data);
  }
  
  warn(message, data) {
    this.log('WARN', message, data);
  }
  
  debug(message, data) {
    if (process.env.NODE_ENV === 'development') {
      this.log('DEBUG', message, data);
    }
  }
}

export default new Logger();
```

---

## 🚀 Implementation Timeline

### Week 1
- [ ] Install security dependencies
- [ ] Implement input validation
- [ ] Add rate limiting
- [ ] Secure file uploads
- [ ] Create error classes
- [ ] Add error handler middleware

### Week 2
- [ ] Set up Jest testing
- [ ] Create unit tests for auth
- [ ] Create integration tests
- [ ] Add security tests
- [ ] Achieve 80% coverage

### Week 3
- [ ] Apply database optimizations
- [ ] Add indexes
- [ ] Optimize queries
- [ ] Set up logging system
- [ ] Performance testing

### Week 4
- [ ] Create Swagger documentation
- [ ] Add health checks
- [ ] Deployment testing
- [ ] Security audit verification
- [ ] Production readiness review

---

## 📚 Resources

### Recommended Libraries
- **Validation**: `express-validator`, `zod`
- **Rate Limiting**: `express-rate-limit`
- **Security Headers**: `helmet`
- **Testing**: `jest`, `supertest`
- **Logging**: `winston`, `pino`
- **Documentation**: `swagger-jsdoc`, `swagger-ui-express`
- **Database**: `sequelize` or `prisma` (for future ORM migration)

### Security References
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Express.js Security: https://expressjs.com/en/advanced/best-practice-security.html
- JWT Best Practices: https://tools.ietf.org/html/rfc8725

---

## ✅ Success Checklist

Before Production Deployment:
- [ ] All input validation implemented
- [ ] Rate limiting active on auth endpoints
- [ ] File upload security verified
- [ ] 80%+ test coverage achieved
- [ ] Error handling middleware installed
- [ ] Logging system operational
- [ ] Database indexes added
- [ ] Query optimization complete
- [ ] API documentation created
- [ ] Security audit passed

---

**Generated by**: Droid Orchestrator  
**Date**: 2025-11-17  
**Status**: Ready for Implementation
