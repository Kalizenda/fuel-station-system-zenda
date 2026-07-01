const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  generateDailyProfitLoss,
  getProfitLossAnalytics,
  getProfitLossSummary,
  getPumpPerformance,
  lockProfitLoss,
  deleteProfitLoss
} = require('../controllers/profitLossAnalyticsController');

// All routes require authentication
router.use(protect);

// Generate daily profit/loss report
router.post('/generate-daily', authorize(['Super Admin', 'Manager']), generateDailyProfitLoss);

// Get profit/loss analytics for different periods
router.get('/analytics', getProfitLossAnalytics);

// Get comprehensive profit/loss summary
router.get('/summary', getProfitLossSummary);

// Get pump-level performance with gains
router.get('/pump-performance', getPumpPerformance);

// Lock profit/loss record (admin only)
router.put('/:id/lock', authorize(['Super Admin']), lockProfitLoss);

// Delete profit/loss record (admin only)
router.delete('/:id', authorize(['Super Admin']), deleteProfitLoss);

module.exports = router;
