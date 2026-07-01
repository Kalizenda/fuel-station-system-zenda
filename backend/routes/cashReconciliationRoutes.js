const express = require('express');
const { createReconciliation, getReconciliations, getTodayReconciliation } = require('../controllers/cashReconciliationController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/').get(protect, getReconciliations).post(protect, authorize('Super Admin', 'Manager'), createReconciliation);
router.route('/today').get(protect, getTodayReconciliation);

module.exports = router;
