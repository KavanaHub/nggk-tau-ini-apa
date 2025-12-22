import express from 'express';
import auth from '../middleware/auth.js';
import requireRole from '../middleware/role.js';
import koordinatorController from '../controllers/koordinatorController.js';
import sidangController from '../controllers/sidangController.js';
import jadwalController from '../controllers/jadwalController.js';

const router = express.Router();

// Profile
router.get('/profile', auth, requireRole('koordinator'), koordinatorController.getProfile);

// Stats
router.get('/stats', auth, requireRole('koordinator'), koordinatorController.getStats);

// Assigned Semester - cek semester yang di-assign ke koordinator ini
router.get('/my-semester', auth, requireRole('koordinator'), koordinatorController.getAssignedSemester);

// List data
router.get('/mahasiswa', auth, requireRole('koordinator'), koordinatorController.getAllMahasiswa);
router.get('/dosen', auth, requireRole('koordinator'), koordinatorController.getAllDosen);
router.get('/proposal/pending', auth, requireRole('koordinator'), koordinatorController.getPendingProposals);

// Actions
router.patch('/proposal/validate', auth, requireRole('koordinator'), koordinatorController.validateProposal);
router.post('/assign-dosen', auth, requireRole('koordinator'), koordinatorController.assignDosen);

// Sidang
router.post('/sidang/schedule', auth, requireRole('koordinator'), sidangController.scheduleSidang);
router.get('/sidang', auth, requireRole('koordinator'), sidangController.getAllSidang);

// Penguji list for scheduling
router.get('/penguji', auth, requireRole('koordinator'), koordinatorController.getPengujiList);

// Jadwal Proyek/Internship
router.get('/jadwal', auth, requireRole('koordinator'), jadwalController.list);
router.get('/jadwal/active', auth, requireRole('koordinator'), jadwalController.getActive);
router.post('/jadwal', auth, requireRole('koordinator'), jadwalController.create);
router.put('/jadwal/:id', auth, requireRole('koordinator'), jadwalController.update);
router.post('/jadwal/:id/complete', auth, requireRole('koordinator'), jadwalController.complete);

export default router;
