const express = require('express');
const { verifyToken, verifyRole } = require('../middleware/auth');
const {
  startGuidance,
  getGuidanceSessions,
  completeGuidance,
  approveGuidance
} = require('../controllers/guidanceController');

const router = express.Router();

router.post('/start', verifyToken, verifyRole(['dosen']), startGuidance);
router.get('/sessions', verifyToken, getGuidanceSessions);
router.patch('/complete', verifyToken, verifyRole(['dosen']), completeGuidance);
router.patch('/approve', verifyToken, verifyRole(['mahasiswa', 'dosen']), approveGuidance);

module.exports = router;
