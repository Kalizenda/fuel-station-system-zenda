const express = require('express');
const { getCurrentShift, openShift, closeShift } = require('../controllers/shiftController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/current', protect, getCurrentShift);
router.post('/open', protect, openShift);
router.post('/close', protect, closeShift);

module.exports = router;
