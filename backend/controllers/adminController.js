const User = require('../models/User');
const Sale = require('../models/Sale');
const FuelDelivery = require('../models/FuelDelivery');
const Tank = require('../models/Tank');
const Pump = require('../models/Pump');
const Product = require('../models/Product');
const Staff = require('../models/Staff');
const Customer = require('../models/Customer');
const Expense = require('../models/Expense');
const Shift = require('../models/Shift');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

exports.resetDatabase = async (req, res) => {
  try {
    // Verify user is Super Admin
    if (req.user.role !== 'Super Admin') {
      return res.status(403).json({ success: false, message: 'Only Super Admin can reset the database' });
    }

    // Delete all data except admin users
    await Sale.deleteMany({});
    await FuelDelivery.deleteMany({});
    await Tank.deleteMany({});
    await Pump.deleteMany({});
    await Product.deleteMany({});
    await Staff.deleteMany({});
    await Customer.deleteMany({});
    await Expense.deleteMany({});
    await Shift.deleteMany({});
    await Notification.deleteMany({});
    
    // Keep admin users but reset other users
    await User.deleteMany({ role: { $ne: 'Super Admin' } });

    res.status(200).json({ success: true, message: 'Database reset successfully. Admin users preserved.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSystemStats = async (req, res) => {
  try {
    const stats = {
      users: await User.countDocuments(),
      sales: await Sale.countDocuments(),
      deliveries: await FuelDelivery.countDocuments(),
      tanks: await Tank.countDocuments(),
      pumps: await Pump.countDocuments(),
      products: await Product.countDocuments(),
      staff: await Staff.countDocuments(),
      customers: await Customer.countDocuments(),
      expenses: await Expense.countDocuments(),
      shifts: await Shift.countDocuments()
    };

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.backupDatabase = async (req, res) => {
  try {
    if (req.user.role !== 'Super Admin') {
      return res.status(403).json({ success: false, message: 'Only Super Admin can backup the database' });
    }

    // Get all collections
    const collections = {
      users: await User.find({}),
      sales: await Sale.find({}),
      deliveries: await FuelDelivery.find({}),
      tanks: await Tank.find({}),
      pumps: await Pump.find({}),
      products: await Product.find({}),
      staff: await Staff.find({}),
      customers: await Customer.find({}),
      expenses: await Expense.find({}),
      shifts: await Shift.find({})
    };

    const timestamp = new Date().toISOString();
    const backupData = {
      timestamp,
      collections
    };

    res.status(200).json({ success: true, data: backupData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
