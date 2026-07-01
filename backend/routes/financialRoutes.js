const express = require('express');
const { addExpense, getExpenses } = require('../controllers/expenseController');
const { getProfitAnalytics } = require('../controllers/profitController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/expenses').get(protect, getExpenses).post(protect, addExpense);
router.route('/profit').get(protect, getProfitAnalytics);
module.exports = router;