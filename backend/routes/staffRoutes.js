const express = require('express');
const { addStaff, getStaff } = require('../controllers/staffController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/').get(protect, getStaff).post(protect, addStaff);
module.exports = router;