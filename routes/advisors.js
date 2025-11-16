const express = require('express');
const { verifyToken, verifyRole } = require('../middleware/auth');
const {
  getAdvisors,
  selectAdvisor,
  getAdvisorProposals,
  approveProposal,
  approveAdvisorSelection,
  getPendingAdvisorSelections
} = require('../controllers/advisorController');

const router = express.Router();

router.get('/', verifyToken, verifyRole(['mahasiswa']), getAdvisors);
router.post('/select', verifyToken, verifyRole(['mahasiswa']), selectAdvisor);
router.get('/my-proposals', verifyToken, verifyRole(['dosen']), getAdvisorProposals);
router.patch('/approve', verifyToken, verifyRole(['dosen']), approveProposal);

// Coordinator routes
router.get('/coordinator/pending-selections', verifyToken, verifyRole(['koordinator']), getPendingAdvisorSelections);
router.patch('/coordinator/approve-selection', verifyToken, verifyRole(['koordinator']), approveAdvisorSelection);

module.exports = router;
