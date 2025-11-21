import express from 'express';
import auth from '../middleware/auth.js';
import requireRole from '../middleware/role.js';
import dosenController from '../controllers/dosenController.js';

const router = express.Router();

// bisa diakses mahasiswa, dosen, admin
router.get(
  '/',
  auth,
  requireRole('mahasiswa', 'dosen', 'admin'),
  dosenController.listDosen
);

export default router;
