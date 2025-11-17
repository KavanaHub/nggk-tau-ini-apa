# Security Fixes Quick Start Guide

This is a condensed implementation guide for the security audit. For full details, see `SECURITY_AUDIT_REPORT.md`.

## 🚨 Critical: Do This First

### 1. Install Required Dependencies (2 minutes)

```bash
npm install express-validator express-rate-limit helmet file-type
```

### 2. Generate Strong JWT Secret (1 minute)

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy output to your `.env` file:
```bash
JWT_SECRET=<paste-the-long-random-string-here>
```

### 3. Apply Security Headers (5 minutes)

**File: `index.js`**

Add after imports:
```javascript
import helmet from 'helmet';
```

Add before routes (after `dotenv.config()`):
```javascript
// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  }
}));
```

### 4. Fix CORS (5 minutes)

**File: `index.js`**

Replace `app.use(cors());` with:

```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  // Add your frontend URLs here
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
}));
```

### 5. Add Rate Limiting (10 minutes)

**Create file: `middleware/rateLimiter.js`**

```javascript
import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: { message: 'Too many attempts, try again later' }
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests' }
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { message: 'Upload limit exceeded' }
});
```

**Apply in `index.js`:**
```javascript
import { apiLimiter } from './middleware/rateLimiter.js';
app.use('/api/', apiLimiter);
```

**Apply in `routes/auth.js`:**
```javascript
import { authLimiter } from '../middleware/rateLimiter.js';
router.post('/login', authLimiter, login);
router.post('/register', authLimiter, register);
```

### 6. Add Input Validation (30 minutes)

**Create file: `middleware/validation.js`**

```javascript
import { body, param, validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: errors.array().map(e => ({ field: e.param, message: e.msg }))
    });
  }
  next();
};

export const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name must be 2-255 characters, letters only'),
  
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email'),
  
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/)
    .withMessage('Password must be 8+ chars with uppercase, lowercase, number, special char'),
  
  body('role')
    .isIn(['mahasiswa', 'dosen', 'koordinator'])
    .withMessage('Invalid role'),
  
  validate
];

export const loginValidation = [
  body('email').trim().isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate
];

export const idParamValidation = [
  param('id').isInt({ min: 1 }).toInt(),
  validate
];

export const uploadProposalValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 255 })
    .escape(),
  body('description')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .escape(),
  validate
];
```

**Apply in `routes/auth.js`:**
```javascript
import { registerValidation, loginValidation } from '../middleware/validation.js';

router.post('/register', authLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);
```

**Apply in `routes/proposals.js`:**
```javascript
import { uploadProposalValidation, idParamValidation } from '../middleware/validation.js';

router.post('/upload', verifyToken, verifyRole(['mahasiswa']), 
  uploadProposalValidation, upload.single('file'), uploadProposal);
router.get('/:id/download', verifyToken, idParamValidation, downloadProposal);
```

### 7. Secure File Uploads (30 minutes)

**Create file: `middleware/fileUpload.js`**

```javascript
import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import path from 'path';
import crypto from 'crypto';

const ALLOWED_MIME_TYPES = ['application/pdf'];
const ALLOWED_EXTENSIONS = ['.pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error('Only PDF files allowed'), false);
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter
});

export const validateFileType = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const fileType = await fileTypeFromBuffer(req.file.buffer);
    
    if (!fileType || fileType.mime !== 'application/pdf') {
      return res.status(400).json({ 
        message: 'Invalid file type. Only PDF accepted.' 
      });
    }

    // Sanitize filename
    const ext = path.extname(req.file.originalname);
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    req.file.sanitizedName = `${timestamp}-${randomString}${ext}`;

    next();
  } catch (error) {
    res.status(500).json({ message: 'File validation failed' });
  }
};
```

**Update routes to use new middleware:**

```javascript
// routes/proposals.js
import { upload, validateFileType } from '../middleware/fileUpload.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

// Remove old multer config, use new one:
router.post('/upload', 
  verifyToken, 
  verifyRole(['mahasiswa']),
  uploadLimiter,
  upload.single('file'), 
  validateFileType,
  uploadProposalValidation,
  uploadProposal
);
```

Do the same for `routes/reports.js` and `routes/exams.js`.

### 8. Fix Error Handling (20 minutes)

**Create file: `middleware/errorHandler.js`**

```javascript
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  
  console.error('ERROR:', {
    message: err.message,
    url: req.originalUrl,
    user: req.user?.id
  });

  if (process.env.NODE_ENV === 'production') {
    if (err.isOperational) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Something went wrong' });
  }

  res.status(err.statusCode).json({
    message: err.message,
    stack: err.stack
  });
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

**Apply in `index.js` (must be LAST):**
```javascript
import { errorHandler } from './middleware/errorHandler.js';

// ... all routes ...

app.use(errorHandler); // Last middleware!
```

**Update a controller example (`controllers/authController.js`):**
```javascript
import { AppError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const conn = await pool.getConnection();

  const [users] = await conn.query('SELECT * FROM users WHERE email = ?', [email]);
  conn.release();

  if (users.length === 0) {
    throw new AppError('Invalid credentials', 401);
  }

  const user = users[0];
  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    throw new AppError('Invalid credentials', 401);
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );

  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const conn = await pool.getConnection();

  const [existing] = await conn.query('SELECT email FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    conn.release();
    throw new AppError('Email already exists', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await conn.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', 
    [name, email, hashedPassword, role]);
  
  conn.release();
  res.status(201).json({ message: 'User registered successfully' });
});
```

### 9. Resource Ownership Validation (40 minutes)

**Create file: `middleware/authorization.js`**

```javascript
import pool from '../config/database.js';
import { AppError } from './errorHandler.js';

export const verifyProposalOwnership = async (req, res, next) => {
  const proposalId = req.params.id || req.body.proposalId;
  const userId = req.user.id;
  const userRole = req.user.role;

  const conn = await pool.getConnection();
  const [proposals] = await conn.query(
    'SELECT student_id, advisor_id FROM proposals WHERE id = ?',
    [proposalId]
  );
  conn.release();

  if (proposals.length === 0) {
    throw new AppError('Proposal not found', 404);
  }

  const proposal = proposals[0];

  if (userRole === 'mahasiswa' && proposal.student_id !== userId) {
    throw new AppError('Access denied: not your proposal', 403);
  }

  if (userRole === 'dosen' && proposal.advisor_id !== userId) {
    throw new AppError('Access denied: not your advisee', 403);
  }

  next();
};

export const verifyReportOwnership = async (req, res, next) => {
  const reportId = req.params.id || req.body.reportId;
  const userId = req.user.id;
  const userRole = req.user.role;

  const conn = await pool.getConnection();
  const [reports] = await conn.query(
    'SELECT r.student_id, p.advisor_id FROM reports r JOIN proposals p ON r.proposal_id = p.id WHERE r.id = ?',
    [reportId]
  );
  conn.release();

  if (reports.length === 0) {
    throw new AppError('Report not found', 404);
  }

  const report = reports[0];

  if (userRole === 'mahasiswa' && report.student_id !== userId) {
    throw new AppError('Access denied', 403);
  }

  if (userRole === 'dosen' && report.advisor_id !== userId) {
    throw new AppError('Access denied', 403);
  }

  next();
};
```

**Apply to routes:**

```javascript
// routes/proposals.js
import { verifyProposalOwnership } from '../middleware/authorization.js';

router.get('/:id/download', 
  verifyToken, 
  idParamValidation,
  verifyProposalOwnership,
  downloadProposal
);

// routes/reports.js
import { verifyReportOwnership } from '../middleware/authorization.js';

router.get('/:id/download', 
  verifyToken, 
  idParamValidation,
  verifyReportOwnership,
  downloadReport
);
```

### 10. Validate Environment Variables (10 minutes)

**Create file: `config/validateEnv.js`**

```javascript
import dotenv from 'dotenv';
dotenv.config();

const weakSecrets = [
  'your_jwt_secret_key_here_change_in_production',
  'secret',
  'password'
];

export function validateEnv() {
  const required = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET', 'NODE_ENV'];
  
  for (const envVar of required) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }

  if (weakSecrets.includes(process.env.JWT_SECRET)) {
    throw new Error('JWT_SECRET is too weak! Generate a strong secret.');
  }

  console.log('✓ Environment variables validated');
}
```

**Apply in `index.js` (at the very top):**
```javascript
import { validateEnv } from './config/validateEnv.js';

validateEnv(); // First thing!
```

## ✅ Verification Checklist

After implementing all fixes, test:

1. **Input Validation:**
   ```bash
   # Should fail with validation error:
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"A","email":"bad","password":"123","role":"admin"}'
   ```

2. **Rate Limiting:**
   ```bash
   # Try 6 times, 6th should be blocked:
   for i in {1..6}; do
     curl -X POST http://localhost:3000/api/auth/login \
       -H "Content-Type: application/json" \
       -d '{"email":"test@test.com","password":"wrong"}'
   done
   ```

3. **Security Headers:**
   ```bash
   curl -I http://localhost:3000/health
   # Should see: X-Content-Type-Options, X-Frame-Options, etc.
   ```

4. **File Upload:**
   ```bash
   # Should fail with "Only PDF files allowed":
   curl -X POST http://localhost:3000/api/proposals/upload \
     -H "Authorization: Bearer <token>" \
     -F "file=@malware.exe" \
     -F "title=Test" \
     -F "description=Description"
   ```

5. **CORS:**
   ```bash
   # Should fail if origin not in allowlist:
   curl -X GET http://localhost:3000/api/proposals \
     -H "Origin: https://evil.com" \
     -H "Authorization: Bearer <token>"
   ```

## 📊 Progress Tracking

- [x] Dependencies installed
- [x] JWT secret generated
- [x] Security headers added
- [x] CORS restricted
- [x] Rate limiting implemented
- [x] Input validation added
- [x] File upload secured
- [x] Error handling improved
- [x] Resource ownership checks
- [x] Environment validation

## 🔥 Production Pre-Deployment

Before going live:

1. Change JWT_SECRET to a strong random value (64+ characters)
2. Set NODE_ENV=production
3. Configure ALLOWED_ORIGINS with your actual frontend URLs
4. Enable HTTPS/TLS on your server
5. Set strong database password
6. Review all `.env` values
7. Run security tests
8. Enable monitoring/logging

## 📚 Next Steps

After completing this quick start:

1. Read the full `SECURITY_AUDIT_REPORT.md`
2. Implement Phase 2 fixes (audit logging, JWT refresh)
3. Set up monitoring and alerting
4. Conduct penetration testing
5. Create incident response plan

## 🆘 Help

If you encounter issues:

1. Check console for error messages
2. Verify all imports are correct
3. Ensure dependencies are installed
4. Check `.env` file is loaded
5. Review full audit report for context

---

**Estimated Total Time:** 2-3 hours for all critical fixes
**Result:** Application will be significantly more secure and production-ready
