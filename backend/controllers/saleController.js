const Sale = require('../models/Sale');
const Tank = require('../models/Tank');
const Pump = require('../models/Pump');
const Shift = require('../models/Shift');
const { logActivity } = require('./activityLogController');

exports.recordSale = async (req, res) => {
  try {
    const { pump, openingReading, closingReading, paymentMethod } = req.body;
    if (closingReading <= openingReading) return res.status(400).json({ success: false, message: 'Invalid readings' });

    const pumpData = await Pump.findById(pump).populate('product tank');
    if (!pumpData) return res.status(404).json({ success: false, message: 'Pump not found' });

    // Sales must be tied to an open shift — block sales outside an open shift
    const openShift = await Shift.findOne({ status: 'Open' });
    if (!openShift) return res.status(400).json({ success: false, message: 'No open shift. Cannot record sale.' });

    // Always compute total server-side from authoritative product price — never trust client totals
    const litresSold = closingReading - openingReading;
    const sellingPrice = pumpData.product.sellingPrice;
    const costPrice = pumpData.product.costPrice || 0;
    const totalRevenue = litresSold * sellingPrice;
    const totalCost = litresSold * costPrice;
    const profit = totalRevenue - totalCost;

    const sale = await Sale.create({
      pump, product: pumpData.product._id, tank: pumpData.tank._id,
      openingReading, closingReading, litresSold, sellingPrice, costPrice, totalRevenue, totalCost, profit,
      attendant: req.user.id, paymentMethod, shift: openShift._id
    });

    await Tank.findByIdAndUpdate(pumpData.tank._id, { $inc: { currentStock: -litresSold } });
    await Pump.findByIdAndUpdate(pump, { currentMeterReading: closingReading });

    // Log activity
    await logActivity(
      'SALE',
      `Recorded sale: ${litresSold.toFixed(2)}L of ${pumpData.product.name} for ₦${totalRevenue.toFixed(2)}`,
      req.user._id,
      req.user.fullName,
      {
        entityType: 'SALE',
        entityId: sale._id,
        entityName: `Sale #${sale._id}`,
        details: {
          pump: pumpData.pumpNumber,
          product: pumpData.product.name,
          litresSold,
          totalRevenue,
          paymentMethod
        }
      }
    );

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
};