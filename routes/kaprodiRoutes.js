import express from 'express';
import auth from '../middleware/auth.js';
import requireRole from '../middleware/role.js';
import kaprodiController from '../controllers/kaprodiController.js';

const router = express.Router();

// user harus punya role 'dosen', tapi dicek lagi di controller apakah dia memang kaprodi
router.post(
  '/koordinator',
  auth,
  requireRole('dosen', 'admin'),
  kaprodiController.setKoordinator
);

export default router;
