import express from 'express';
import multer from 'multer';
import { verifyToken, verifyRole } from '../middleware/auth.js';
import { uploadProposal, uploadGroupProposal, getProposals, getStudentProposals, downloadProposal } from '../controllers/proposalController.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/upload', verifyToken, verifyRole(['mahasiswa']), upload.single('file'), uploadProposal);
router.post('/upload-group', verifyToken, verifyRole(['mahasiswa']), upload.single('file'), uploadGroupProposal);
router.get('/', verifyToken, verifyRole(['dosen']), getProposals);
router.get('/my-proposals', verifyToken, verifyRole(['mahasiswa']), getStudentProposals);
router.get('/:id/download', verifyToken, downloadProposal);

export default router;
