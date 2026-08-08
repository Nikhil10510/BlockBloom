const express = require('express');
const router = express.Router();
const multer = require('multer');
const verificationController = require('../controllers/verificationController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbac');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /api/verifications/:electionAddress/upload
router.post('/:electionAddress/upload', requireAuth, requireRole('superadmin', 'admin'), upload.single('file'), verificationController.uploadCSV);

// GET /api/verifications/:electionAddress/proof
router.get('/:electionAddress/proof', requireAuth, verificationController.getProof);

// POST /api/verifications/:electionAddress/set-root-on-chain
router.post('/:electionAddress/set-root-on-chain', requireAuth, requireRole('superadmin', 'admin'), verificationController.setRootOnChain);

module.exports = router;
