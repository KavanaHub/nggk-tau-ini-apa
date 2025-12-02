import express from 'express';
import auth from '../middleware/auth.js';
import requireRole from '../middleware/role.js';
import dosenController from '../controllers/dosenController.js';
import bimbinganController from '../controllers/bimbinganController.js';
import sidangController from '../controllers/sidangController.js';

const router = express.Router();

// Profile
router.get('/profile', auth, requireRole('dosen_pembimbing'), dosenController.getProfile);

// List semua dosen (untuk public)
router.get('/list', dosenController.listDosen);

// Mahasiswa Bimbingan
router.get('/mahasiswa', auth, requireRole('dosen_pembimbing'), dosenController.getMahasiswaBimbingan);

// Bimbingan
router.get('/bimbingan', auth, requireRole('dosen_pembimbing'), bimbinganController.getDosenBimbingan);
router.patch('/bimbingan/:id/status', auth, requireRole('dosen_pembimbing'), bimbinganController.updateBimbinganStatus);

// Laporan Sidang
router.get('/laporan', auth, requireRole('dosen_pembimbing'), sidangController.getDosenLaporan);
router.patch('/laporan/:id/status', auth, requireRole('dosen_pembimbing'), sidangController.updateLaporanStatus);

// Sidang - Dosen Pembimbing sebagai Penguji 1
router.get('/sidang', auth, requireRole('dosen_pembimbing'), dosenController.getMySidang);
router.post('/sidang/nilai', auth, requireRole('dosen_pembimbing'), sidangController.inputNilaiPembimbing);

export default router;
