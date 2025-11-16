import express from 'express';
import multer from 'multer';
import { verifyToken, verifyRole } from '../middleware/auth.js';
import { uploadExamSubmission, getExamSubmissions, approveExamSubmission, assessExam, getExamAssessments } from '../controllers/examController.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/submit', verifyToken, verifyRole(['mahasiswa']), upload.single('file'), uploadExamSubmission);
router.get('/submissions', verifyToken, verifyRole(['dosen']), getExamSubmissions);
router.patch('/approve', verifyToken, verifyRole(['dosen']), approveExamSubmission);
router.post('/assess', verifyToken, verifyRole(['dosen']), assessExam);
router.get('/assessments', verifyToken, verifyRole(['dosen']), getExamAssessments);

export default router;
