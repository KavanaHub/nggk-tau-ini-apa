const express = require('express');
const multer = require('multer');
const { verifyToken, verifyRole } = require('../middleware/auth');
const {
  uploadReport,
  getReports,
  downloadReport,
  approveReport
} = require('../controllers/reportController');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/upload', verifyToken, verifyRole(['mahasiswa']), upload.single('file'), uploadReport);
router.get('/', verifyToken, verifyRole(['dosen']), getReports);
router.get('/:id/download', verifyToken, downloadReport);
router.patch('/approve', verifyToken, verifyRole(['dosen']), approveReport);

module.exports = router;
