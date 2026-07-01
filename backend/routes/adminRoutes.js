const express = require('express');
const { resetDatabase, getSystemStats, backupDatabase } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/reset').post(protect, authorize('Super Admin'), resetDatabase);
router.route('/stats').get(protect, authorize('Super Admin', 'Manager'), getSystemStats);
router.route('/backup').get(protect, authorize('Super Admin'), backupDatabase);

module.exports = router;
