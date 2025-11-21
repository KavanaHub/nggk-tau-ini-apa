import express from 'express';
import { verifyToken, verifyRole } from '../middleware/auth.js';
import {
  selectProject,
  createGroup,
  joinGroup,
  leaveGroup,
  getMyGroups,
  getProjectGroups,
  getGroupMembers,
  getAllProjects
} from '../controllers/projectController.js';

const router = express.Router();

router.get('/', verifyToken, getAllProjects);

router.post('/select', verifyToken, verifyRole(['mahasiswa']), selectProject);
router.post('/create-group', verifyToken, verifyRole(['mahasiswa']), createGroup);
router.post('/join-group', verifyToken, verifyRole(['mahasiswa']), joinGroup);

router.get('/my-groups', verifyToken, verifyRole(['mahasiswa']), getMyGroups);

router.get('/group/:group_id/members', verifyToken, getGroupMembers);

router.get('/:project_id/groups', verifyToken, getProjectGroups);

router.delete('/:group_id/leave', verifyToken, verifyRole(['mahasiswa']), leaveGroup);

export default router;
