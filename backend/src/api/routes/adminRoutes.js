const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbac');

// All admin routes require SuperAdmin role
router.use(requireAuth);
router.use(requireRole('superadmin'));

router.get('/audit-logs', adminController.getAuditLogs);
router.get('/analytics/voters', adminController.getVoterAnalytics);
router.get('/analytics/elections', adminController.getElectionAnalytics);

module.exports = router;
