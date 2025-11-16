const express = require('express');
const multer = require('multer');
const { verifyToken, verifyRole } = require('../middleware/auth');
const {
  uploadProposal,
  getProposals,
  getStudentProposals,
  downloadProposal
} = require('../controllers/proposalController');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/upload', verifyToken, verifyRole(['mahasiswa']), upload.single('file'), uploadProposal);
router.get('/', verifyToken, verifyRole(['dosen']), getProposals);
router.get('/my-proposals', verifyToken, verifyRole(['mahasiswa']), getStudentProposals);
router.get('/:id/download', verifyToken, downloadProposal);

module.exports = router;
