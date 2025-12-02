import express from 'express';
import auth from '../middleware/auth.js';
import requireRole from '../middleware/role.js';
import koordinatorController from '../controllers/koordinatorController.js';
import sidangController from '../controllers/sidangController.js';

const router = express.Router();

// Profile
router.get('/profile', auth, requireRole('koordinator'), koordinatorController.getProfile);

// Stats
router.get('/stats', auth, requireRole('koordinator'), koordinatorController.getStats);

// List data
router.get('/mahasiswa', auth, requireRole('koordinator'), koordinatorController.getAllMahasiswa);
router.get('/dosen-pembimbing', auth, requireRole('koordinator'), koordinatorController.getAllDosenPembimbing);
router.get('/proposals/pending', auth, requireRole('koordinator'), koordinatorController.getPendingProposals);

// Actions
router.patch('/proposal/validate', auth, requireRole('koordinator'), koordinatorController.validateProposal);
router.post('/assign-dosen', auth, requireRole('koordinator'), koordinatorController.assignDosenPembimbing);

// Sidang
router.post('/sidang/schedule', auth, requireRole('koordinator'), sidangController.scheduleSidang);
router.get('/sidang', auth, requireRole('koordinator'), sidangController.getAllSidang);

export default router;
