import express from 'express';
import auth from '../middleware/auth.js';
import requireRole from '../middleware/role.js';
import mahasiswaController from '../controllers/mahasiswaController.js';
import bimbinganController from '../controllers/bimbinganController.js';
import sidangController from '../controllers/sidangController.js';

const router = express.Router();

// Profile
router.get('/profile', auth, requireRole('mahasiswa'), mahasiswaController.getProfile);
router.put('/profile', auth, requireRole('mahasiswa'), mahasiswaController.updateProfile);

// Proposal
router.post('/proposal', auth, requireRole('mahasiswa'), mahasiswaController.submitProposal);
router.get('/proposal/status', auth, requireRole('mahasiswa'), mahasiswaController.getProposalStatus);

// Dosen Pembimbing
router.get('/dosen-pembimbing', auth, requireRole('mahasiswa'), mahasiswaController.getDosenPembimbing);
router.get('/dosen-pembimbing/list', auth, requireRole('mahasiswa'), mahasiswaController.getAllDosenPembimbing);

// Bimbingan
router.post('/bimbingan', auth, requireRole('mahasiswa'), bimbinganController.createBimbingan);
router.get('/bimbingan', auth, requireRole('mahasiswa'), bimbinganController.getMyBimbingan);

// Sidang
router.post('/laporan', auth, requireRole('mahasiswa'), sidangController.submitLaporan);
router.get('/laporan', auth, requireRole('mahasiswa'), sidangController.getMyLaporan);
router.get('/sidang', auth, requireRole('mahasiswa'), sidangController.getMySidang);

export default router;
