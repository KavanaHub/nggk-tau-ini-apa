import express from 'express';
import auth from '../middleware/auth.js';
import requireRole from '../middleware/role.js';
import adminController from '../controllers/adminController.js';

const router = express.Router();

// Profile
router.get('/profile', auth, requireRole('admin'), adminController.getProfile);

// Stats & Activity
router.get('/stats', auth, requireRole('admin'), adminController.getStats);
router.get('/activity', auth, requireRole('admin'), adminController.getRecentActivity);

// User Management
router.get('/users', auth, requireRole('admin'), adminController.getAllUsers);
router.patch('/users/:id/status', auth, requireRole('admin'), adminController.updateUserStatus);
router.delete('/users/:id', auth, requireRole('admin'), adminController.deleteUser);

// Dosen Management
router.get('/dosen', auth, requireRole('admin'), adminController.getAllDosen);
router.post('/dosen', auth, requireRole('admin'), adminController.createDosen);

// Mahasiswa Management
router.get('/mahasiswa', auth, requireRole('admin'), adminController.getAllMahasiswa);

// Reports
router.get('/report', auth, requireRole('admin'), adminController.getSystemReport);

export default router;
