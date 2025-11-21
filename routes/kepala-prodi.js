import express from 'express';
import { verifyToken, verifyRole } from '../middleware/auth.js';
import {
  assignCoordinator,
  listCoordinators,
  viewStatistics,
  getUnassignedProjectTypes
} from '../controllers/kepalaProdiController.js';
import {
  getCoordinatorAssignments,
  removeCoordinatorAssignment
} from '../controllers/coordinatorController.js';

const router = express.Router();

router.post('/assign-coordinator', verifyToken, verifyRole(['kepala_prodi']), assignCoordinator);

router.delete('/remove-coordinator/:id', verifyToken, verifyRole(['kepala_prodi']), removeCoordinatorAssignment);

router.get('/coordinator-assignments', verifyToken, verifyRole(['kepala_prodi']), getCoordinatorAssignments);

router.get('/statistics', verifyToken, verifyRole(['kepala_prodi']), viewStatistics);

router.get('/available-coordinators', verifyToken, verifyRole(['kepala_prodi']), listCoordinators);

router.get('/unassigned-project-types', verifyToken, verifyRole(['kepala_prodi']), getUnassignedProjectTypes);

export default router;
