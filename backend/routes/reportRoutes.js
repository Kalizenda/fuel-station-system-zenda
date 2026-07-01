const express = require('express');
const { getSalesReport, exportSalesPDF, exportSalesExcel, exportSalesCSV } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/sales', protect, getSalesReport);
router.get('/export/sales/pdf', protect, exportSalesPDF);
router.get('/export/sales/excel', protect, exportSalesExcel);
router.get('/export/sales/csv', protect, exportSalesCSV);
module.exports = router;