import express from 'express';
import auth from '../middleware/auth.js';
import requireRole from '../middleware/role.js';
import koordinatorController from '../controllers/koordinatorController.js';

const router = express.Router();

router.get(
  '/proposals',
  auth,
  requireRole('dosen'),
  koordinatorController.listProposalsByTrack
);

router.patch(
  '/proposals/:id/validate',
  auth,
  requireRole('dosen'),
  koordinatorController.validateProposal
);

// KOORDINATOR ACC DOSBIM YANG DIAJUKAN MAHASISWA
router.post(
  '/proposals/:id/approve-supervisors',
  auth,
  requireRole('dosen'),
  koordinatorController.approveSupervisorRequests
);

export default router;
