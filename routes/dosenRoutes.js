import express from 'express';
import auth from '../middleware/auth.js';
import requireRole from '../middleware/role.js';
import dosenController from '../controllers/dosenController.js';
import bimbinganController from '../controllers/bimbinganController.js';
import sidangController from '../controllers/sidangController.js';
import { hasRole, ROLES } from '../utils/roleHelper.js';

const router = express.Router();
const dosenRoleRequired = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(403).json({ message: 'Forbidden - Dosen role required' });
    }

    // Fast path: active role dosen.
    if (req.user.role === 'dosen') return next();

    // Multi-role path: kaprodi/koordinator/penguji that also has dosen role in pivot.
    const hasDosen = await hasRole(req.user.id, ROLES.DOSEN);
    if (!hasDosen) {
      return res.status(403).json({ message: 'Forbidden - Dosen role required' });
    }

    next();
  } catch (err) {
    next(err);
  }
};

// Profile (dosen dan kaprodi bisa akses)
router.get('/profile', auth, requireRole('dosen', 'koordinator', 'kaprodi'), dosenController.getProfile);

// Stats (untuk dashboard)
router.get('/stats', auth, requireRole('dosen', 'koordinator', 'kaprodi'), dosenController.getStats);

// List semua dosen (untuk public)
router.get('/list', dosenController.listDosen);

// Mahasiswa Bimbingan (support both paths for compatibility)
router.get('/mahasiswa', auth, requireRole('dosen', 'koordinator', 'kaprodi'), dosenController.getMahasiswaBimbingan);
router.get('/mahasiswa-bimbingan', auth, requireRole('dosen', 'koordinator', 'kaprodi'), dosenController.getMahasiswaBimbingan);

// Bimbingan
router.get('/bimbingan', auth, requireRole('dosen', 'koordinator', 'kaprodi'), bimbinganController.getDosenBimbingan);
router.patch('/bimbingan/:id/status', auth, requireRole('dosen', 'koordinator', 'kaprodi'), bimbinganController.updateBimbinganStatus);

// Laporan Sidang
router.get('/laporan', auth, requireRole('dosen', 'koordinator', 'kaprodi'), dosenRoleRequired, sidangController.getDosenLaporan);
router.patch('/laporan/:id/status', auth, requireRole('dosen', 'koordinator', 'kaprodi'), dosenRoleRequired, sidangController.updateLaporanStatus);

// Sidang - Dosen sebagai Penguji 1
router.get('/sidang', auth, requireRole('dosen', 'koordinator', 'kaprodi'), dosenController.getMySidang);

export default router;
