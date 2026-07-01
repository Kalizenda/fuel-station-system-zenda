const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  generateComprehensiveSalesReport,
  generateComprehensiveProfitLossReport,
  generateActivityReport,
  generateInventoryReport,
  generateExecutiveSummary
} = require('../controllers/comprehensiveReportsController');

// All routes require authentication
router.use(protect);

// Generate comprehensive sales report with pump-level gains
router.get('/sales', generateComprehensiveSalesReport);

// Generate comprehensive profit/loss report
router.get('/profit-loss', generateComprehensiveProfitLossReport);

// Generate activity report
router.get('/activity', generateActivityReport);

// Generate inventory report
router.get('/inventory', generateInventoryReport);

// Generate executive summary report
router.get('/executive-summary', generateExecutiveSummary);

module.exports = router;
