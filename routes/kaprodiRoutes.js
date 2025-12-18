import express from 'express';
import auth from '../middleware/auth.js';
import requireRole, { kaprodiOnly } from '../middleware/role.js';
import kaprodiController from '../controllers/kaprodiController.js';

const router = express.Router();

// Profile - admin bisa akses
router.get('/profile', auth, requireRole('kaprodi'), kaprodiController.getProfile);

// Dashboard Stats - admin bisa akses
router.get('/stats', auth, requireRole('kaprodi'), kaprodiController.getDashboardStats);

// List data - admin bisa akses
router.get('/mahasiswa', auth, requireRole('kaprodi'), kaprodiController.getAllMahasiswa);
router.get('/dosen', auth, requireRole('kaprodi'), kaprodiController.getAllDosen);
router.get('/koordinator', auth, requireRole('kaprodi'), kaprodiController.getAllKoordinator);
router.get('/penguji', auth, requireRole('kaprodi'), kaprodiController.getAllPenguji);

// Actions - HANYA KAPRODI (admin tidak boleh)
router.post('/assign-dosen', auth, kaprodiOnly(), kaprodiController.assignDosen);
router.patch('/proposal/status', auth, kaprodiOnly(), kaprodiController.updateProposalStatus);

// Koordinator assignment - assign koordinator ke semester
router.post('/koordinator/assign-semester', auth, kaprodiOnly(), kaprodiController.assignKoordinatorSemester);
router.post('/koordinator/unassign-semester', auth, kaprodiOnly(), kaprodiController.unassignKoordinatorSemester);

export default router;
