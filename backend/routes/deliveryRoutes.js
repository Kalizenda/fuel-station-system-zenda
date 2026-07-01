const express = require('express');
const { addDelivery, getDeliveries } = require('../controllers/deliveryController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/').get(protect, getDeliveries).post(protect, authorize('Super Admin', 'Manager'), addDelivery);
module.exports = router;