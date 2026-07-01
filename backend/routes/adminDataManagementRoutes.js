const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getDataManagementStats,
  getAllData,
  softDeleteData,
  restoreData,
  permanentDeleteData,
  lockData,
  unlockData,
  exportData
} = require('../controllers/adminDataManagementController');

// All routes require authentication
router.use(protect);

// Get data management dashboard statistics
router.get('/stats', getDataManagementStats);

// Get all data with advanced filtering
router.get('/data', getAllData);

// Soft delete data with reason
router.post('/soft-delete', softDeleteData);

// Restore soft-deleted data
router.post('/restore', restoreData);

// Permanently delete data (admin only)
router.post('/permanent-delete', permanentDeleteData);

// Lock data records
router.post('/lock', lockData);

// Unlock data records
router.post('/unlock', unlockData);

// Export data
router.get('/export', exportData);

module.exports = router;
