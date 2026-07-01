const express = require('express');
const { addItem, getItems, getProducts, getTanks, getSuppliers, getPumps } = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/items').get(protect, getItems).post(protect, addItem);
router.route('/products').get(protect, getProducts);
router.route('/tanks').get(protect, getTanks);
router.route('/suppliers').get(protect, getSuppliers);
router.route('/pumps').get(protect, getPumps);

module.exports = router;