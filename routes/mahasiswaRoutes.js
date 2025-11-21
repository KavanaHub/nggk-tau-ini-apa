import express from 'express';
import auth from '../middleware/auth.js';
import requireRole from '../middleware/role.js';
import mahasiswaController from '../controllers/mahasiswaController.js';

const router = express.Router();

router.post('/groups', auth, requireRole('mahasiswa'), mahasiswaController.createGroup);
router.post('/proposals', auth, requireRole('mahasiswa'), mahasiswaController.submitProposal);
router.get(
  '/groups/:group_id/supervisors',
  auth,
  requireRole('mahasiswa'),
  mahasiswaController.getSupervisorsByGroup
);

export default router;
