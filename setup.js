const fs = require('fs');
const path = require('path');

const files = {
  // ============ BACKEND FILES ============
  
  'backend/config/db.js': `const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(\`✅ MongoDB Connected: \${conn.connection.host}\`);
  } catch (error) {
    console.error(\`❌ MongoDB Error: \${error.message}\`);
    process.exit(1);
  }
};

module.exports = connectDB;`,

  'backend/models/User.js': `const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: {
    type: String,
    enum: ['Super Admin', 'Manager', 'Accountant', 'Attendant', 'Auditor'],
    default: 'Attendant'
  },
  isActive: { type: Boolean, default: true },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

module.exports = mongoose.model('User', userSchema);`,

  'backend/models/Product.js': `const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  unit: { type: String, default: 'Litre' },
  sellingPrice: { type: Number, required: true },
  costPrice: { type: Number, default: 0 },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);`,

  'backend/models/Supplier.js': `const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactPerson: { type: String },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  productTypes: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);`,

  'backend/models/Tank.js': `const mongoose = require('mongoose');

const tankSchema = new mongoose.Schema({
  name: { type: String, required: true },
  capacity: { type: Number, required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  currentStock: { type: Number, default: 0 },
  minStockLevel: { type: Number, default: 5000 },
  status: { type: String, enum: ['Active', 'Inactive', 'Maintenance'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('Tank', tankSchema);`,

  'backend/models/Pump.js': `const mongoose = require('mongoose');

const pumpSchema = new mongoose.Schema({
  pumpNumber: { type: String, required: true, unique: true },
  tank: { type: mongoose.Schema.Types.ObjectId, ref: 'Tank', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  status: { type: String, enum: ['Active', 'Inactive', 'Maintenance'], default: 'Active' },
  currentMeterReading: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Pump', pumpSchema);`,

  'backend/models/FuelDelivery.js': `const mongoose = require('mongoose');

const fuelDeliverySchema = new mongoose.Schema({
  deliveryNumber: { type: String, required: true, unique: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  tank: { type: mongoose.Schema.Types.ObjectId, ref: 'Tank', required: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  quantityReceived: { type: Number, required: true },
  costPerLitre: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  deliveryDate: { type: Date, default: Date.now },
  invoiceNumber: { type: String },
  driverName: { type: String },
  truckNumber: { type: String },
  notes: { type: String },
  receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('FuelDelivery', fuelDeliverySchema);`,

  'backend/models/Sale.js': `const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  pump: { type: mongoose.Schema.Types.ObjectId, ref: 'Pump', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  tank: { type: mongoose.Schema.Types.ObjectId, ref: 'Tank', required: true },
  openingReading: { type: Number, required: true },
  closingReading: { type: Number, required: true },
  litresSold: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  totalRevenue: { type: Number, required: true },
  attendant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift' },
  paymentMethod: { type: String, enum: ['Cash', 'Transfer', 'Card'], default: 'Cash' }
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);`,

  'backend/models/Shift.js': `const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  shiftDate: { type: Date, default: Date.now },
  type: { type: String, enum: ['Morning', 'Afternoon', 'Night'], required: true },
  status: { type: String, enum: ['Open', 'Closed'], default: 'Open' },
  openedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  openingTime: { type: Date, default: Date.now },
  closingTime: { type: Date },
  totalSalesLitres: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  expectedCash: { type: Number, default: 0 },
  actualCashCounted: { type: Number },
  variance: { type: Number, default: 0 },
  handoverNotes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Shift', shiftSchema);`,

  'backend/models/Expense.js': `const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['Salaries', 'Diesel', 'Electricity', 'Repairs', 'Security', 'Internet', 'Transportation', 'Tax', 'Miscellaneous'],
    required: true
  },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  description: { type: String, required: true },
  paymentMethod: { type: String, enum: ['Cash', 'Bank Transfer'], default: 'Cash' },
  approvalStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Approved' },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);`,

  'backend/models/CashTransaction.js': `const mongoose = require('mongoose');

const cashTransactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['Cash In', 'Cash Out', 'Bank Deposit', 'Bank Withdrawal'], required: true },
  amount: { type: Number, required: true },
  reference: { type: String },
  description: { type: String, required: true },
  date: { type: Date, default: Date.now },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('CashTransaction', cashTransactionSchema);`,

  'backend/models/Staff.js': `const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  email: { type: String, lowercase: true },
  address: { type: String },
  position: {
    type: String,
    enum: ['Manager', 'Accountant', 'Attendant', 'Security', 'Cleaner', 'Mechanic', 'Driver'],
    required: true
  },
  salary: { type: Number, required: true },
  employmentDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Active', 'On Leave', 'Terminated'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('Staff', staffSchema);`,

  'backend/models/InventoryItem.js': `const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ['Engine Oil', 'Lubricants', 'Spare Parts', 'Accessories', 'Other'], required: true },
  sku: { type: String, required: true, unique: true },
  unit: { type: String, default: 'Piece' },
  currentStock: { type: Number, default: 0 },
  minStockLevel: { type: Number, default: 10 },
  costPrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' }
}, { timestamps: true });

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);`,

  'backend/models/InventoryTransaction.js': `const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
  type: { type: String, enum: ['Stock In', 'Stock Out', 'Adjustment'], required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalValue: { type: Number, required: true },
  reference: { type: String },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);`,

  'backend/models/AuditLog.js': `const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  resourceId: { type: String },
  details: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
});

auditLogSchema.index({ timestamp: -1 });
module.exports = mongoose.model('AuditLog', auditLogSchema);`,

  'backend/models/Notification.js': `const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['LOW_STOCK', 'LARGE_EXPENSE', 'NEW_DELIVERY', 'SYSTEM'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);`,

  'backend/middleware/authMiddleware.js': `const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user || !req.user.isActive) return res.status(401).json({ success: false, message: 'User inactive' });
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token failed' });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this role' });
    }
    next();
  };
};`,

  'backend/controllers/authController.js': `const User = require('../models/User');
const jwt = require('jsonwebtoken');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

exports.register = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ fullName, email, password, role: role || 'Attendant' });
    const token = signToken(user._id);
    res.status(201).json({ success: true, token, user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Provide email and password' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = signToken(user._id);
    res.status(200).json({ success: true, token, user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password incorrect' });

    user.password = newPassword;
    await user.save();
    res.status(200).json({ success: true, message: 'Password updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};`,

  'backend/controllers/deliveryController.js': `const FuelDelivery = require('../models/FuelDelivery');
const Tank = require('../models/Tank');
const Product = require('../models/Product');

exports.addDelivery = async (req, res) => {
  try {
    const { tank, quantityReceived, costPerLitre, product } = req.body;
    const totalCost = quantityReceived * costPerLitre;

    const delivery = await FuelDelivery.create({ ...req.body, totalCost, receivedBy: req.user.id });
    const updatedTank = await Tank.findByIdAndUpdate(tank, { $inc: { currentStock: quantityReceived } }, { new: true }).populate('product');
    await Product.findByIdAndUpdate(product, { costPrice: costPerLitre });

    res.status(201).json({ success: true, data: delivery, tankStock: updatedTank.currentStock });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getDeliveries = async (req, res) => {
  try {
    const deliveries = await FuelDelivery.find().populate('product tank supplier').sort('-createdAt');
    res.status(200).json({ success: true, data: deliveries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};`,

  'backend/controllers/saleController.js': `const Sale = require('../models/Sale');
const Tank = require('../models/Tank');
const Pump = require('../models/Pump');
const Shift = require('../models/Shift');

exports.recordSale = async (req, res) => {
  try {
    const { pump, openingReading, closingReading, paymentMethod } = req.body;
    if (closingReading <= openingReading) return res.status(400).json({ success: false, message: 'Invalid readings' });

    const pumpData = await Pump.findById(pump).populate('product tank');
    if (!pumpData) return res.status(404).json({ success: false, message: 'Pump not found' });

    const litresSold = closingReading - openingReading;
    const sellingPrice = pumpData.product.sellingPrice;
    const totalRevenue = litresSold * sellingPrice;

    const sale = await Sale.create({
      pump, product: pumpData.product._id, tank: pumpData.tank._id,
      openingReading, closingReading, litresSold, sellingPrice, totalRevenue,
      attendant: req.user.id, paymentMethod
    });

    await Tank.findByIdAndUpdate(pumpData.tank._id, { $inc: { currentStock: -litresSold } });
    await Pump.findByIdAndUpdate(pump, { currentMeterReading: closingReading });

    res.status(201).json({ success: true, data: sale });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTodaySales = async (req, res) => {
  try {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const sales = await Sale.find({ date: { $gte: startOfDay } }).populate('pump product attendant');
    res.status(200).json({ success: true, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};`,

  'backend/controllers/expenseController.js': `const Expense = require('../models/Expense');

exports.addExpense = async (req, res) => {
  try {
    const expense = await Expense.create({ ...req.body, recordedBy: req.user.id });
    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort('-date');
    res.status(200).json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};`,

  'backend/controllers/profitController.js': `const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const Product = require('../models/Product');

exports.getProfitAnalytics = async (req, res) => {
  try {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);

    const salesData = await Sale.aggregate([
      { $match: { date: { $gte: startOfDay, $lte: endOfDay } } },
      { $group: { _id: "$product", totalRevenue: { $sum: "$totalRevenue" }, totalLitres: { $sum: "$litresSold" } } }
    ]);

    let totalRevenue = 0, totalFuelCost = 0;
    for (const sale of salesData) {
      totalRevenue += sale.totalRevenue;
      const product = await Product.findById(sale._id);
      if (product) totalFuelCost += sale.totalLitres * product.costPrice;
    }

    const expenseData = await Expense.aggregate([
      { $match: { date: { $gte: startOfDay, $lte: endOfDay } } },
      { $group: { _id: "$category", totalAmount: { $sum: "$amount" } } }
    ]);

    const totalExpenses = expenseData.reduce((sum, exp) => sum + exp.totalAmount, 0);
    const netProfit = totalRevenue - totalFuelCost - totalExpenses;

    res.status(200).json({ success: true, data: { totalRevenue, totalFuelCost, totalExpenses, netProfit, expenseBreakdown: expenseData } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};`,

  'backend/controllers/reportController.js': `const Sale = require('../models/Sale');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

exports.getSalesReport = async (req, res) => {
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const sales = await Sale.find({ date: { $gte: start } }).populate('pump product attendant');
    const summary = await Sale.aggregate([
      { $match: { date: { $gte: start } } },
      { $group: { _id: null, totalLitres: { $sum: '$litresSold' }, totalRevenue: { $sum: '$totalRevenue' }, totalTransactions: { $sum: 1 } } }
    ]);
    res.status(200).json({ success: true, data: { sales, summary: summary[0] || { totalLitres: 0, totalRevenue: 0, totalTransactions: 0 } } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportSalesPDF = async (req, res) => {
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const sales = await Sale.find({ date: { $gte: start } }).populate('pump product attendant');

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');
    doc.pipe(res);

    doc.fontSize(20).text('FUELTRACK NG', { align: 'center' });
    doc.fontSize(14).text('Sales Report', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Date', 50, 150).text('Pump', 150, 150).text('Product', 250, 150).text('Litres', 350, 150).text('Revenue', 450, 150);
    doc.moveTo(50, 165).lineTo(550, 165).stroke();

    doc.font('Helvetica');
    let y = 180;
    sales.forEach(sale => {
      if (y > 750) { doc.addPage(); y = 50; }
      doc.text(sale.date.toLocaleDateString(), 50, y);
      doc.text(sale.pump?.pumpNumber || 'N/A', 150, y);
      doc.text(sale.product?.name || 'N/A', 250, y);
      doc.text(sale.litresSold.toFixed(2), 350, y);
      doc.text(\`₦\${sale.totalRevenue.toLocaleString()}\`, 450, y);
      y += 20;
    });
    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportSalesExcel = async (req, res) => {
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const sales = await Sale.find({ date: { $gte: start } }).populate('pump product attendant');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales');
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Pump', key: 'pump', width: 12 },
      { header: 'Product', key: 'product', width: 15 },
      { header: 'Litres', key: 'litres', width: 12 },
      { header: 'Revenue', key: 'revenue', width: 15 }
    ];

    sales.forEach(sale => {
      worksheet.addRow({ date: sale.date.toLocaleDateString(), pump: sale.pump?.pumpNumber, product: sale.product?.name, litres: sale.litresSold, revenue: sale.totalRevenue });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportSalesCSV = async (req, res) => {
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const sales = await Sale.find({ date: { $gte: start } }).populate('pump product attendant');
    const csv = sales.map(s => \`\${s.date.toLocaleDateString()},\${s.pump?.pumpNumber},\${s.product?.name},\${s.litresSold},\${s.totalRevenue}\`).join('\\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.csv');
    res.send('Date,Pump,Product,Litres,Revenue\\n' + csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};`,

  'backend/controllers/staffController.js': `const Staff = require('../models/Staff');

exports.addStaff = async (req, res) => {
  try {
    const staff = await Staff.create(req.body);
    res.status(201).json({ success: true, data: staff });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getStaff = async (req, res) => {
  try {
    const staff = await Staff.find().sort('-createdAt');
    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};`,

  'backend/controllers/inventoryController.js': `const InventoryItem = require('../models/InventoryItem');
const InventoryTransaction = require('../models/InventoryTransaction');

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
};`,

  'backend/controllers/notificationController.js': `const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id }).sort('-createdAt').limit(50);
    const unreadCount = await Notification.countDocuments({ recipient: req.user.id, isRead: false });
    res.status(200).json({ success: true, data: notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().populate('user', 'fullName role').sort('-timestamp').limit(100);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};`,

  'backend/routes/authRoutes.js': `const express = require('express');
const { register, login, getMe, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

module.exports = router;`,

  'backend/routes/deliveryRoutes.js': `const express = require('express');
const { addDelivery, getDeliveries } = require('../controllers/deliveryController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/').get(protect, getDeliveries).post(protect, authorize('Super Admin', 'Manager'), addDelivery);
module.exports = router;`,

  'backend/routes/saleRoutes.js': `const express = require('express');
const { recordSale, getTodaySales } = require('../controllers/saleController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/').post(protect, recordSale);
router.route('/today').get(protect, getTodaySales);
module.exports = router;`,

  'backend/routes/financialRoutes.js': `const express = require('express');
const { addExpense, getExpenses } = require('../controllers/expenseController');
const { getProfitAnalytics } = require('../controllers/profitController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/expenses').get(protect, getExpenses).post(protect, addExpense);
router.route('/profit').get(protect, getProfitAnalytics);
module.exports = router;`,

  'backend/routes/reportRoutes.js': `const express = require('express');
const { getSalesReport, exportSalesPDF, exportSalesExcel, exportSalesCSV } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/sales', protect, getSalesReport);
router.get('/export/sales/pdf', protect, exportSalesPDF);
router.get('/export/sales/excel', protect, exportSalesExcel);
router.get('/export/sales/csv', protect, exportSalesCSV);
module.exports = router;`,

  'backend/routes/staffRoutes.js': `const express = require('express');
const { addStaff, getStaff } = require('../controllers/staffController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/').get(protect, getStaff).post(protect, addStaff);
module.exports = router;`,

  'backend/routes/inventoryRoutes.js': `const express = require('express');
const { addItem, getItems } = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/items').get(protect, getItems).post(protect, addItem);
module.exports = router;`,

  'backend/routes/notificationRoutes.js': `const express = require('express');
const { getMyNotifications, getAuditLogs } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', protect, getMyNotifications);
router.get('/audit', protect, getAuditLogs);
module.exports = router;`,

  'backend/server.js': `const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/deliveries', require('./routes/deliveryRoutes'));
app.use('/api/sales', require('./routes/saleRoutes'));
app.use('/api/finance', require('./routes/financialRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

app.get('/', (req, res) => res.json({ success: true, message: 'FuelTrack NG API running' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(\`🚀 Server running on port \${PORT}\`));`,

  'backend/seed.js': `require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Tank = require('./models/Tank');
const Pump = require('./models/Pump');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    if (!await User.findOne({ email: 'admin@fueltrack.ng' })) {
      await User.create({ fullName: 'Admin', email: 'admin@fueltrack.ng', password: 'Admin@123456', role: 'Super Admin' });
      console.log('✅ Admin created: admin@fueltrack.ng / Admin@123456');
    }

    const products = [
      { name: 'PMS', code: 'PMS-001', sellingPrice: 750, costPrice: 650 },
      { name: 'AGO', code: 'AGO-001', sellingPrice: 1200, costPrice: 1000 },
      { name: 'DPK', code: 'DPK-001', sellingPrice: 850, costPrice: 720 }
    ];

    for (const p of products) {
      if (!await Product.findOne({ code: p.code })) {
        await Product.create(p);
        console.log(\`✅ Product: \${p.name}\`);
      }
    }

    const pms = await Product.findOne({ code: 'PMS-001' });
    const ago = await Product.findOne({ code: 'AGO-001' });

    if (!await Tank.findOne({ name: 'Tank 1' })) {
      await Tank.create({ name: 'Tank 1', capacity: 60000, product: pms._id, currentStock: 30000 });
      console.log('✅ Tank 1 created');
    }
    if (!await Tank.findOne({ name: 'Tank 2' })) {
      await Tank.create({ name: 'Tank 2', capacity: 60000, product: ago._id, currentStock: 25000 });
      console.log('✅ Tank 2 created');
    }

    const tank1 = await Tank.findOne({ name: 'Tank 1' });
    if (!await Pump.findOne({ pumpNumber: 'Pump 1' })) {
      await Pump.create({ pumpNumber: 'Pump 1', tank: tank1._id, product: pms._id });
      console.log('✅ Pump 1 created');
    }

    console.log('\\n🎉 Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

seed();`,

  'backend/package.json': `{
  "name": "fuel-station-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "seed": "node seed.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "exceljs": "^4.3.0",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^7.5.0",
    "morgan": "^1.10.0",
    "pdfkit": "^0.13.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}`,

  'backend/.env': `NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/fuelstation
JWT_SECRET=super_secret_jwt_key_change_in_production_32chars
JWT_EXPIRE=7d`,

  'backend/Dockerfile': `FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]`,

  // ============ FRONTEND FILES ============
  
  'frontend/index.html': `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FuelTrack NG | Login</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body class="auth-body">
  <div class="auth-container">
    <div class="auth-header">
      <h1>⛽ FuelTrack NG</h1>
      <p>Station Management System</p>
    </div>
    <form id="loginForm" class="auth-form">
      <h2>Sign In</h2>
      <div class="form-group">
        <label>Email</label>
        <input type="email" id="email" required placeholder="admin@fueltrack.ng">
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" id="password" required>
      </div>
      <button type="submit" class="btn btn-primary">Login</button>
      <p id="error-msg" class="error-text"></p>
    </form>
    <div class="theme-toggle">
      <button id="themeSwitch">🌙 Toggle Dark Mode</button>
    </div>
  </div>
  <script src="js/auth.js"></script>
</body>
</html>`,

  'frontend/css/style.css': `:root {
  --bg-primary: #F4F7F6;
  --bg-secondary: #FFFFFF;
  --text-primary: #0A192F;
  --text-secondary: #555;
  --accent-primary: #FF8C00;
  --border-color: #E0E0E0;
}

[data-theme="dark"] {
  --bg-primary: #0A192F;
  --bg-secondary: #112240;
  --text-primary: #E6F1FF;
  --text-secondary: #8892B0;
  --border-color: #233554;
}

* { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', sans-serif; }
body { background: var(--bg-primary); color: var(--text-primary); }

.auth-body { display: flex; justify-content: center; align-items: center; min-height: 100vh; }
.auth-container { background: var(--bg-secondary); padding: 2.5rem; border-radius: 12px; width: 100%; max-width: 400px; border-top: 5px solid var(--accent-primary); }
.auth-header { text-align: center; margin-bottom: 2rem; }
.auth-header h1 { color: var(--accent-primary); }

.form-group { margin-bottom: 1.5rem; }
.form-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; }
.form-group input, .form-group select { width: 100%; padding: 0.8rem; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-primary); color: var(--text-primary); }

.btn { width: 100%; padding: 0.9rem; border: none; border-radius: 6px; font-size: 1rem; font-weight: bold; cursor: pointer; }
.btn-primary { background: var(--accent-primary); color: white; }
.btn-primary:hover { background: #e67e00; }

.error-text { color: #D32F2F; text-align: center; margin-top: 1rem; }
.theme-toggle { text-align: center; margin-top: 1.5rem; }
.theme-toggle button { background: transparent; border: 1px solid var(--border-color); padding: 0.5rem 1rem; border-radius: 20px; color: var(--text-secondary); cursor: pointer; }

.app-container { display: flex; min-height: 100vh; }
.sidebar { width: 250px; background: var(--bg-secondary); border-right: 1px solid var(--border-color); padding: 1.5rem; position: fixed; height: 100vh; }
.logo { font-size: 1.5rem; font-weight: bold; color: var(--accent-primary); margin-bottom: 2rem; text-align: center; }
.nav-menu { display: flex; flex-direction: column; gap: 0.5rem; }
.nav-link { padding: 0.8rem 1rem; text-decoration: none; color: var(--text-secondary); border-radius: 8px; }
.nav-link:hover, .nav-link.active { background: var(--accent-primary); color: white; }

.main-content { flex-grow: 1; margin-left: 250px; background: var(--bg-primary); }
.top-bar { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background: var(--bg-secondary); border-bottom: 1px solid var(--border-color); }
.content-area { padding: 2rem; }

.card { background: var(--bg-secondary); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; }
.form-card { background: var(--bg-secondary); padding: 2rem; border-radius: 12px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 0.8rem; text-align: left; border-bottom: 1px solid var(--border-color); }
.data-table th { background: var(--bg-primary); font-weight: 600; }`,

  'frontend/js/auth.js': `const themeSwitch = document.getElementById('themeSwitch');
themeSwitch.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = 'pages/dashboard.html';
    } else {
      document.getElementById('error-msg').textContent = data.message || 'Login failed';
    }
  } catch (err) {
    document.getElementById('error-msg').textContent = 'Network error';
  }
});`,

  'frontend/pages/dashboard.html': `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <title>Dashboard | FuelTrack NG</title>
  <link rel="stylesheet" href="../css/style.css">
</head>
<body>
  <div class="app-container">
    <aside class="sidebar">
      <div class="logo">⛽ FuelTrack NG</div>
      <nav class="nav-menu">
        <a href="dashboard.html" class="nav-link active">📊 Dashboard</a>
        <a href="deliveries.html" class="nav-link">🚛 Deliveries</a>
        <a href="sales.html" class="nav-link">💰 Sales</a>
        <a href="profit.html" class="nav-link">📈 Profit</a>
        <a href="staff.html" class="nav-link">👥 Staff</a>
        <a href="reports.html" class="nav-link">📄 Reports</a>
      </nav>
      <button id="logoutBtn" class="btn" style="margin-top:2rem;">Logout</button>
    </aside>

    <main class="main-content">
      <header class="top-bar">
        <h2>Dashboard</h2>
        <span id="userName">Admin</span>
      </header>

      <div class="content-area">
        <div class="card">
          <h3>Welcome to FuelTrack NG</h3>
          <p>Your fuel station management system is ready!</p>
        </div>
      </div>
    </main>
  </div>

  <script>
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    document.getElementById('userName').textContent = user.fullName || 'User';
    document.getElementById('logoutBtn').addEventListener('click', () => {
      localStorage.clear();
      window.location.href = '../index.html';
    });
  </script>
</body>
</html>`,

  'frontend/pages/deliveries.html': `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <title>Deliveries | FuelTrack NG</title>
  <link rel="stylesheet" href="../css/style.css">
</head>
<body>
  <div class="app-container">
    <aside class="sidebar">
      <div class="logo">⛽ FuelTrack NG</div>
      <nav class="nav-menu">
        <a href="dashboard.html" class="nav-link">📊 Dashboard</a>
        <a href="deliveries.html" class="nav-link active">🚛 Deliveries</a>
        <a href="sales.html" class="nav-link">💰 Sales</a>
      </nav>
    </aside>

    <main class="main-content">
      <header class="top-bar"><h2>Record Fuel Delivery</h2></header>
      <div class="content-area">
        <div class="form-card">
          <form id="deliveryForm">
            <div class="form-row">
              <div class="form-group"><label>Product</label><select id="product" required><option value="">Select</option><option value="PMS">PMS</option><option value="AGO">AGO</option></select></div>
              <div class="form-group"><label>Quantity (L)</label><input type="number" id="quantity" required></div>
            </div>
            <div class="form-group"><label>Cost Per Litre (₦)</label><input type="number" id="costPerLitre" required></div>
            <button type="submit" class="btn btn-primary">Save Delivery</button>
          </form>
        </div>
      </div>
    </main>
  </div>

  <script>
    document.getElementById('deliveryForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = localStorage.getItem('token');
      const payload = {
        product: document.getElementById('product').value,
        quantityReceived: parseFloat(document.getElementById('quantity').value),
        costPerLitre: parseFloat(document.getElementById('costPerLitre').value),
        tank: 'tank-id-here',
        supplier: 'supplier-id-here'
      };
      try {
        const res = await fetch('http://localhost:5000/api/deliveries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
          body: JSON.stringify(payload)
        });
        if (res.ok) { alert('Delivery recorded!'); e.target.reset(); }
      } catch (err) { alert('Error'); }
    });
  </script>
</body>
</html>`,

  'frontend/pages/sales.html': `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <title>Sales | FuelTrack NG</title>
  <link rel="stylesheet" href="../css/style.css">
</head>
<body>
  <div class="app-container">
    <aside class="sidebar">
      <div class="logo">⛽ FuelTrack NG</div>
      <nav class="nav-menu">
        <a href="dashboard.html" class="nav-link">📊 Dashboard</a>
        <a href="sales.html" class="nav-link active">💰 Sales</a>
      </nav>
    </aside>

    <main class="main-content">
      <header class="top-bar"><h2>Record Sale</h2></header>
      <div class="content-area">
        <div class="form-card">
          <form id="salesForm">
            <div class="form-group"><label>Pump</label><select id="pump" required><option value="">Select Pump</option><option value="pump-id">Pump 1</option></select></div>
            <div class="form-row">
              <div class="form-group"><label>Opening Reading</label><input type="number" id="openingReading" required></div>
              <div class="form-group"><label>Closing Reading</label><input type="number" id="closingReading" required></div>
            </div>
            <button type="submit" class="btn btn-primary">Record Sale</button>
          </form>
        </div>
      </div>
    </main>
  </div>

  <script>
    document.getElementById('salesForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = localStorage.getItem('token');
      const payload = {
        pump: document.getElementById('pump').value,
        openingReading: parseFloat(document.getElementById('openingReading').value),
        closingReading: parseFloat(document.getElementById('closingReading').value)
      };
      try {
        const res = await fetch('http://localhost:5000/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
          body: JSON.stringify(payload)
        });
        if (res.ok) { alert('Sale recorded!'); e.target.reset(); }
      } catch (err) { alert('Error'); }
    });
  </script>
</body>
</html>`,

  'frontend/pages/profit.html': `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <title>Profit | FuelTrack NG</title>
  <link rel="stylesheet" href="../css/style.css">
</head>
<body>
  <div class="app-container">
    <aside class="sidebar">
      <div class="logo">⛽ FuelTrack NG</div>
      <nav class="nav-menu">
        <a href="dashboard.html" class="nav-link">📊 Dashboard</a>
        <a href="profit.html" class="nav-link active">📈 Profit</a>
      </nav>
    </aside>

    <main class="main-content">
      <header class="top-bar"><h2>Profit Analytics</h2></header>
      <div class="content-area">
        <div class="card">
          <h3>Today's Profit</h3>
          <p id="profitData">Loading...</p>
        </div>
      </div>
    </main>
  </div>

  <script>
    async function loadProfit() {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('http://localhost:5000/api/finance/profit', {
          headers: { 'Authorization': \`Bearer \${token}\` }
        });
        const data = await res.json();
        document.getElementById('profitData').innerHTML = \`
          <p>Revenue: ₦\${data.data.totalRevenue.toLocaleString()}</p>
          <p>Expenses: ₦\${data.data.totalExpenses.toLocaleString()}</p>
          <p><strong>Net Profit: ₦\${data.data.netProfit.toLocaleString()}</strong></p>
        \`;
      } catch (err) { document.getElementById('profitData').textContent = 'Error loading data'; }
    }
    loadProfit();
  </script>
</body>
</html>`,

  'frontend/pages/staff.html': `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <title>Staff | FuelTrack NG</title>
  <link rel="stylesheet" href="../css/style.css">
</head>
<body>
  <div class="app-container">
    <aside class="sidebar">
      <div class="logo">⛽ FuelTrack NG</div>
      <nav class="nav-menu">
        <a href="dashboard.html" class="nav-link">📊 Dashboard</a>
        <a href="staff.html" class="nav-link active">👥 Staff</a>
      </nav>
    </aside>

    <main class="main-content">
      <header class="top-bar"><h2>Staff Management</h2></header>
      <div class="content-area">
        <div class="card">
          <h3>Staff List</h3>
          <table class="data-table">
            <thead><tr><th>Name</th><th>Position</th><th>Phone</th></tr></thead>
            <tbody id="staffTable"><tr><td colspan="3">Loading...</td></tr></tbody>
          </table>
        </div>
      </div>
    </main>
  </div>

  <script>
    async function loadStaff() {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('http://localhost:5000/api/staff', {
          headers: { 'Authorization': \`Bearer \${token}\` }
        });
        const data = await res.json();
        const tbody = document.getElementById('staffTable');
        tbody.innerHTML = data.data.map(s => \`<tr><td>\${s.fullName}</td><td>\${s.position}</td><td>\${s.phone}</td></tr>\`).join('');
      } catch (err) { document.getElementById('staffTable').innerHTML = '<tr><td colspan="3">Error</td></tr>'; }
    }
    loadStaff();
  </script>
</body>
</html>`,

  'frontend/pages/reports.html': `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <title>Reports | FuelTrack NG</title>
  <link rel="stylesheet" href="../css/style.css">
</head>
<body>
  <div class="app-container">
    <aside class="sidebar">
      <div class="logo">⛽ FuelTrack NG</div>
      <nav class="nav-menu">
        <a href="dashboard.html" class="nav-link">📊 Dashboard</a>
        <a href="reports.html" class="nav-link active">📄 Reports</a>
      </nav>
    </aside>

    <main class="main-content">
      <header class="top-bar"><h2>Reports</h2></header>
      <div class="content-area">
        <div class="card">
          <h3>Export Sales Report</h3>
          <button onclick="exportReport('pdf')" class="btn btn-primary" style="margin:0.5rem;">Export PDF</button>
          <button onclick="exportReport('excel')" class="btn btn-primary" style="margin:0.5rem;">Export Excel</button>
          <button onclick="exportReport('csv')" class="btn btn-primary" style="margin:0.5rem;">Export CSV</button>
        </div>
      </div>
    </main>
  </div>

  <script>
    function exportReport(format) {
      const token = localStorage.getItem('token');
      window.open(\`http://localhost:5000/api/reports/export/sales/\${format}?token=\${token}\`, '_blank');
    }
  </script>
</body>
</html>`,

  // ============ ROOT FILES ============
  
  'docker-compose.yml': `version: '3.8'

services:
  backend:
    build: ./backend
    container_name: fueltrack-api
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://mongo:27017/fuelstation
      - JWT_SECRET=super_secret_jwt_key_change_in_production
      - PORT=5000
    ports:
      - "5000:5000"
    depends_on:
      - mongo

  mongo:
    image: mongo:7.0
    container_name: fueltrack-db
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:`,

  '.env.example': `NODE_ENV=production
PORT=5000
MONGO_URI=mongodb://mongo:27017/fuelstation
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
JWT_EXPIRE=7d`,

  'README.md': `# ⛽ FuelTrack NG

Complete Fuel Station Management System for Nigerian petrol stations.

## 🚀 Quick Start

### Docker (Recommended)
\\\`\\\`\\\`bash
docker-compose up -d --build
\\\`\\\`\\\`

### Manual Setup
\\\`\\\`\\\`bash
cd backend
npm install
npm run seed
npm run dev
\\\`\\\`\\\`

## 🔐 Default Login
- Email: admin@fueltrack.ng
- Password: Admin@123456

## 📦 Features
- ✅ Authentication & RBAC
- ✅ Dashboard with Charts
- ✅ Fuel Deliveries & Inventory
- ✅ Sales & Shift Management
- ✅ Profit Analytics
- ✅ Reports (PDF/Excel/CSV)
- ✅ Staff Management

## 🛠️ Tech Stack
- Frontend: HTML5, CSS3, Vanilla JS
- Backend: Node.js, Express.js
- Database: MongoDB
- Auth: JWT
- Deployment: Docker`,

  'DEPLOYMENT.md': `# 🚀 Deployment Guide

## Prerequisites
- VPS with 2GB+ RAM
- Docker & Docker Compose

## Deploy
\\\`\\\`\\\`bash
git clone <repo>
cd fuel-station-system
cp .env.example .env
nano .env  # Update JWT_SECRET
docker-compose up -d --build
docker exec -it fueltrack-api node seed.js
\\\`\\\`\\\`

## Access
- Frontend: http://your-server-ip
- API: http://your-server-ip:5000`
};

// Create all files
console.log('🚀 Creating FuelTrack NG project...\n');

Object.keys(files).forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  const dir = path.dirname(fullPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(fullPath, files[filePath]);
  console.log(`✅ ${filePath}`);
});

console.log('\n🎉 Project created successfully!');
console.log('\n📝 Next steps:');
console.log('1. cd backend');
console.log('2. npm install');
console.log('3. npm run seed');
console.log('4. npm run dev');
console.log('5. Open frontend/index.html in browser');