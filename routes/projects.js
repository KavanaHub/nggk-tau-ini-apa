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

// Project endpoints - list all projects
router.get('/', verifyToken, getAllProjects);

// Group management endpoints for students - POST routes
router.post('/select', verifyToken, verifyRole(['mahasiswa']), selectProject);
router.post('/create-group', verifyToken, verifyRole(['mahasiswa']), createGroup);
router.post('/join-group', verifyToken, verifyRole(['mahasiswa']), joinGroup);

// Student viewing their groups - special GET route (before param routes)
router.get('/my-groups', verifyToken, verifyRole(['mahasiswa']), getMyGroups);

// View members of a group - special GET route with 'group' prefix
router.get('/group/:group_id/members', verifyToken, getGroupMembers);

// View groups in a project - param route (must be after special routes)
router.get('/:project_id/groups', verifyToken, getProjectGroups);

// Leave group - DELETE with param (after param GET routes)
router.delete('/:group_id/leave', verifyToken, verifyRole(['mahasiswa']), leaveGroup);

export default router;
