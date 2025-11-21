import express from 'express';
import auth from '../middleware/auth.js';
import requireRole from '../middleware/role.js';
import sidangController from '../controllers/sidangController.js';

const router = express.Router();

// mahasiswa upload laporan
router.post(
  '/reports',
  auth,
  requireRole('mahasiswa'),
  sidangController.submitReport
);

// dosen pembimbing approve / reject laporan
router.patch(
  '/reports/:id/approve',
  auth,
  requireRole('dosen'),
  sidangController.approveReport
);

// dosen pembimbing/penguji input nilai sidang
router.post(
  '/grades',
  auth,
  requireRole('dosen'),
  sidangController.inputGrade
);

export default router;
