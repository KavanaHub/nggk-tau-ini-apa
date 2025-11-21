import express from 'express';
import auth from '../middleware/auth.js';
import requireRole from '../middleware/role.js';
import bimbinganController from '../controllers/bimbinganController.js';

const router = express.Router();

router.post('/', auth, requireRole('mahasiswa'), bimbinganController.createSession);
router.patch('/:id/status', auth, requireRole('dosen'), bimbinganController.updateSessionStatus);

export default router;
