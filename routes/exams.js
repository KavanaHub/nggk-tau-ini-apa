const express = require('express');
const multer = require('multer');
const { verifyToken, verifyRole } = require('../middleware/auth');
const {
  uploadExamSubmission,
  getExamSubmissions,
  approveExamSubmission,
  assessExam,
  getExamAssessments
} = require('../controllers/examController');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/submit', verifyToken, verifyRole(['mahasiswa']), upload.single('file'), uploadExamSubmission);
router.get('/submissions', verifyToken, verifyRole(['dosen']), getExamSubmissions);
router.patch('/approve', verifyToken, verifyRole(['dosen']), approveExamSubmission);
router.post('/assess', verifyToken, verifyRole(['dosen']), assessExam);
router.get('/assessments', verifyToken, verifyRole(['dosen']), getExamAssessments);

module.exports = router;
