import express from 'express';
import auth from '../middleware/auth.js';
import requireRole from '../middleware/role.js';
import kaprodiController from '../controllers/kaprodiController.js';

const router = express.Router();

// Profile
router.get('/profile', auth, requireRole('kaprodi'), kaprodiController.getProfile);

// Dashboard Stats
router.get('/stats', auth, requireRole('kaprodi'), kaprodiController.getDashboardStats);

// List data
router.get('/mahasiswa', auth, requireRole('kaprodi'), kaprodiController.getAllMahasiswa);
router.get('/dosen-pembimbing', auth, requireRole('kaprodi'), kaprodiController.getAllDosenPembimbing);
router.get('/koordinator', auth, requireRole('kaprodi'), kaprodiController.getAllKoordinator);
router.get('/penguji', auth, requireRole('kaprodi'), kaprodiController.getAllPenguji);

// Actions
router.post('/assign-dosen', auth, requireRole('kaprodi'), kaprodiController.assignDosenPembimbing);
router.patch('/proposal/status', auth, requireRole('kaprodi'), kaprodiController.updateProposalStatus);

export default router;
