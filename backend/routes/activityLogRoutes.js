const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getActivityLogs,
  getActivityLogById,
  getActivityStatistics,
  deleteActivityLog,
  bulkDeleteActivityLogs
} = require('../controllers/activityLogController');

// All routes require authentication
router.use(protect);

// Get all activity logs (with filtering and pagination)
router.get('/', getActivityLogs);

// Get activity statistics
router.get('/statistics', getActivityStatistics);

// Get single activity log by ID
router.get('/:id', getActivityLogById);

// Delete activity log (admin only)
router.delete('/:id', authorize(['Super Admin']), deleteActivityLog);

// Bulk delete activity logs (admin only)
router.post('/bulk-delete', authorize(['Super Admin']), bulkDeleteActivityLogs);

module.exports = router;
