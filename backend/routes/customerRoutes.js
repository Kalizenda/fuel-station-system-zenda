const express = require('express');
const { addCustomer, getCustomers, getCustomer, updateCustomer, deleteCustomer } = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/').get(protect, getCustomers).post(protect, authorize('Super Admin', 'Manager'), addCustomer);
router.route('/:id').get(protect, getCustomer).put(protect, authorize('Super Admin', 'Manager'), updateCustomer).delete(protect, authorize('Super Admin', 'Manager'), deleteCustomer);

module.exports = router;
