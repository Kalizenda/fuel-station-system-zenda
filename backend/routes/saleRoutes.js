const express = require('express');
const { recordSale, getTodaySales } = require('../controllers/saleController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/').post(protect, recordSale);
router.route('/today').get(protect, getTodaySales);
module.exports = router;