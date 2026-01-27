import express from 'express';
import authController from '../controllers/authController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// REGISTER
router.post('/register/mahasiswa', authController.registerMahasiswa);

// LOGIN (universal - cek semua role)
router.post('/login', authController.login);

// PROFILE (requires auth)
router.get('/profile', authMiddleware, authController.getProfile);
router.patch('/profile', authMiddleware, authController.updateProfile);

// CHANGE PASSWORD (requires auth)
router.post('/change-password', authMiddleware, authController.changePassword);

// DB FIX (Temporary Public Endpoint)
router.get('/fix-schema', authController.runSchemaFix);

export default router;
