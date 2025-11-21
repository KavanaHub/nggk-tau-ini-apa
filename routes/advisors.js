import express from 'express';
import { verifyToken, verifyRole } from '../middleware/auth.js';
import { getAdvisors, selectAdvisor, getAdvisorProposals, approveProposal, approveAdvisorSelection, getPendingAdvisorSelections } from '../controllers/advisorController.js';

const router = express.Router();

router.get('/', verifyToken, verifyRole(['mahasiswa']), getAdvisors);
router.post('/select', verifyToken, verifyRole(['mahasiswa']), selectAdvisor);
router.get('/my-proposals', verifyToken, verifyRole(['dosen']), getAdvisorProposals);
router.patch('/approve', verifyToken, verifyRole(['dosen']), approveProposal);

router.get('/coordinator/pending-selections', verifyToken, verifyRole(['koordinator']), getPendingAdvisorSelections);
router.patch('/coordinator/approve-selection', verifyToken, verifyRole(['koordinator']), approveAdvisorSelection);

export default router;
