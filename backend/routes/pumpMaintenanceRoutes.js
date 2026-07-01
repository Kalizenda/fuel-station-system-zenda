const express = require('express');
const { addMaintenance, getMaintenanceRecords, updateMaintenance, deleteMaintenance, getUpcomingMaintenance } = require('../controllers/pumpMaintenanceController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/').get(protect, getMaintenanceRecords).post(protect, authorize('Super Admin', 'Manager'), addMaintenance);
router.route('/upcoming').get(protect, getUpcomingMaintenance);
router.route('/:id').put(protect, authorize('Super Admin', 'Manager'), updateMaintenance).delete(protect, authorize('Super Admin', 'Manager'), deleteMaintenance);

module.exports = router;
