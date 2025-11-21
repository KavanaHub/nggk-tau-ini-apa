import express from 'express';
import { verifyToken, verifyRole } from '../middleware/auth.js';
import {
  getPendingProposals,
  validateProposal,
  getValidatedProposals,
  getCoordinatorStats
} from '../controllers/coordinatorController.js';

const router = express.Router();

router.get('/pending-proposals', verifyToken, verifyRole(['koordinator']), getPendingProposals);

router.patch('/validate-proposal', verifyToken, verifyRole(['koordinator']), validateProposal);

router.get('/my-assignments', verifyToken, verifyRole(['koordinator']), getCoordinatorStats);

router.get('/my-proposals', verifyToken, verifyRole(['koordinator']), getValidatedProposals);

export default router;
