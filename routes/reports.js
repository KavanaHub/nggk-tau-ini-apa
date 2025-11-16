import express from 'express';
import multer from 'multer';
import { verifyToken, verifyRole } from '../middleware/auth.js';
import { uploadReport, getReports, downloadReport, approveReport } from '../controllers/reportController.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/upload', verifyToken, verifyRole(['mahasiswa']), upload.single('file'), uploadReport);
router.get('/', verifyToken, verifyRole(['dosen']), getReports);
router.get('/:id/download', verifyToken, downloadReport);
router.patch('/approve', verifyToken, verifyRole(['dosen']), approveReport);

export default router;
