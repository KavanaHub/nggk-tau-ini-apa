import express from 'express';
import { verifyToken, verifyRole } from '../middleware/auth.js';
import { startGuidance, getGuidanceSessions, completeGuidance, approveGuidance } from '../controllers/guidanceController.js';

const router = express.Router();

router.post('/start', verifyToken, verifyRole(['dosen']), startGuidance);
router.get('/sessions', verifyToken, getGuidanceSessions);
router.patch('/complete', verifyToken, verifyRole(['dosen']), completeGuidance);
router.patch('/approve', verifyToken, verifyRole(['mahasiswa', 'dosen']), approveGuidance);

export default router;
