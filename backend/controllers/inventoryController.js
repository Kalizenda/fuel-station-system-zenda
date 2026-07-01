const InventoryItem = require('../models/InventoryItem');
const InventoryTransaction = require('../models/InventoryTransaction');
const Product = require('../models/Product');
const Tank = require('../models/Tank');
const Supplier = require('../models/Supplier');
const Pump = require('../models/Pump');

exports.addItem = async (req, res) => {
  try {
    const item = await InventoryItem.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getItems = async (req, res) => {
  try {
    const items = await InventoryItem.find().populate('supplier', 'name');
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTanks = async (req, res) => {
  try {
    const tanks = await Tank.find().populate('product', 'name code');
    res.status(200).json({ success: true, data: tanks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    res.status(200).json({ success: true, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPumps = async (req, res) => {
  try {
    const pumps = await Pump.find().populate('product', 'name code sellingPrice').populate('tank', 'name');
    res.status(200).json({ success: true, data: pumps });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};