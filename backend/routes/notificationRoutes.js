const express = require('express');
const { getMyNotifications, getAuditLogs } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', protect, getMyNotifications);
router.get('/audit', protect, getAuditLogs);
module.exports = router;