const express = require('express');
const { updateProductPrice, getPriceHistory, bulkPriceUpdate } = require('../controllers/priceController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/').get(protect, getPriceHistory);
router.route('/update').put(protect, authorize('Super Admin', 'Manager'), updateProductPrice);
router.route('/bulk-update').put(protect, authorize('Super Admin', 'Manager'), bulkPriceUpdate);

module.exports = router;
