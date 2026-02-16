import express from 'express';
import authController from '../controllers/authController.js';
import otpController from '../controllers/otpController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// REGISTER
router.post('/register/mahasiswa', authController.registerMahasiswa);

// LOGIN (universal - cek semua role)
router.post('/login', authController.login);

// OTP (public - no auth required)
router.post('/request-otp', otpController.requestOTP);
router.post('/verify-otp', otpController.verifyOTP);
router.post('/reset-password', otpController.resetPassword);

// Register OTP (public)
router.post('/request-register-otp', otpController.requestRegisterOTP);
router.post('/verify-register-otp', otpController.verifyRegisterOTP);

// PROFILE (requires auth)
router.get('/profile', authMiddleware, authController.getProfile);
router.patch('/profile', authMiddleware, authController.updateProfile);

// CHANGE PASSWORD (requires auth)
router.post('/change-password', authMiddleware, authController.changePassword);

// DB FIX (Temporary Public Endpoint)
router.get('/fix-schema', authController.runSchemaFix);

export default router;
