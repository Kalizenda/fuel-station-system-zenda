const express = require('express');
const { getTankLevels, recordDipReading, updateTankThresholds } = require('../controllers/tankMonitoringController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/levels').get(protect, getTankLevels);
router.route('/dip').post(protect, authorize('Super Admin', 'Manager'), recordDipReading);
router.route('/thresholds').put(protect, authorize('Super Admin', 'Manager'), updateTankThresholds);

module.exports = router;
