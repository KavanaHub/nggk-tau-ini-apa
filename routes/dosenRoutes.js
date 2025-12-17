import express from 'express';
import auth from '../middleware/auth.js';
import requireRole from '../middleware/role.js';
import dosenController from '../controllers/dosenController.js';
import bimbinganController from '../controllers/bimbinganController.js';
import sidangController from '../controllers/sidangController.js';

const router = express.Router();

// Profile (dosen dan kaprodi bisa akses)
router.get('/profile', auth, requireRole('dosen', 'kaprodi'), dosenController.getProfile);

// List semua dosen (untuk public)
router.get('/list', dosenController.listDosen);

// Mahasiswa Bimbingan (support both paths for compatibility)
router.get('/mahasiswa', auth, requireRole('dosen', 'kaprodi'), dosenController.getMahasiswaBimbingan);
router.get('/mahasiswa-bimbingan', auth, requireRole('dosen', 'kaprodi'), dosenController.getMahasiswaBimbingan);

// Bimbingan
router.get('/bimbingan', auth, requireRole('dosen', 'kaprodi'), bimbinganController.getDosenBimbingan);
router.patch('/bimbingan/:id/status', auth, requireRole('dosen', 'kaprodi'), bimbinganController.updateBimbinganStatus);

// Laporan Sidang
router.get('/laporan', auth, requireRole('dosen', 'kaprodi'), sidangController.getDosenLaporan);
router.patch('/laporan/:id/status', auth, requireRole('dosen', 'kaprodi'), sidangController.updateLaporanStatus);

// Sidang - Dosen sebagai Penguji 1
router.get('/sidang', auth, requireRole('dosen', 'kaprodi'), dosenController.getMySidang);

export default router;
