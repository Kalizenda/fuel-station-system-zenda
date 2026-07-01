const express = require('express');
const { assignAttendantToPump, getPumpAssignments, getTodayAssignments, clearPumpAssignment } = require('../controllers/pumpAssignmentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/').get(protect, getPumpAssignments);
router.route('/today').get(protect, getTodayAssignments);
router.route('/assign').post(protect, authorize('Super Admin', 'Manager'), assignAttendantToPump);
router.route('/clear/:id').put(protect, authorize('Super Admin', 'Manager'), clearPumpAssignment);

module.exports = router;
