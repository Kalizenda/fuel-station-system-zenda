const Sale = require('../models/Sale');
const Tank = require('../models/Tank');
const Pump = require('../models/Pump');
const Shift = require('../models/Shift');
const ProfitLoss = require('../models/ProfitLoss');
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

    // Auto-generate/update daily profit/loss report
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    // Get all sales for today
    const todaySales = await Sale.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('pump', 'pumpNumber product')
     .populate('product', 'name code sellingPrice costPrice');

    // Get deliveries for today
    const FuelDelivery = require('../models/FuelDelivery');
    const todayDeliveries = await FuelDelivery.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('product', 'name code costPrice');

    // Get expenses for today
    const Expense = require('../models/Expense');
    const todayExpenses = await Expense.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    // Calculate totals
    let dayTotalRevenue = 0;
    let totalLitresSold = 0;
    let totalFuelCost = 0;
    let totalExpenses = 0;
    const pumpPerformance = {};
    const productPerformance = {};

    todaySales.forEach(sale => {
      const revenue = sale.totalRevenue || 0;
      const litres = sale.litresSold || 0;
      const product = sale.product;
      const pump = sale.pump;

      dayTotalRevenue += revenue;
      totalLitresSold += litres;

      const fuelCost = litres * (product?.costPrice || 0);
      totalFuelCost += fuelCost;

      if (pump) {
        if (!pumpPerformance[pump._id]) {
          pumpPerformance[pump._id] = {
            pumpId: pump._id,
            pumpNumber: pump.pumpNumber,
            productName: product?.name || 'N/A',
            sales: 0,
            litresSold: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
            profitPerLitre: 0
          };
        }
        pumpPerformance[pump._id].sales += 1;
        pumpPerformance[pump._id].litresSold += litres;
        pumpPerformance[pump._id].revenue += revenue;
        pumpPerformance[pump._id].cost += fuelCost;
        pumpPerformance[pump._id].profit += (revenue - fuelCost);
        pumpPerformance[pump._id].profitPerLitre = pumpPerformance[pump._id].profit / pumpPerformance[pump._id].litresSold;
      }

      if (product) {
        if (!productPerformance[product._id]) {
          productPerformance[product._id] = {
            productId: product._id,
            productName: product.name,
            productCode: product.code,
            sales: 0,
            litresSold: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
            profitMargin: 0
          };
        }
        productPerformance[product._id].sales += 1;
        productPerformance[product._id].litresSold += litres;
        productPerformance[product._id].revenue += revenue;
        productPerformance[product._id].cost += fuelCost;
        productPerformance[product._id].profit += (revenue - fuelCost);
        productPerformance[product._id].profitMargin = (productPerformance[product._id].profit / productPerformance[product._id].revenue) * 100;
      }
    });

    todayExpenses.forEach(expense => {
      totalExpenses += expense.amount || 0;
    });

    const grossProfit = dayTotalRevenue - totalFuelCost;
    const operatingProfit = grossProfit - totalExpenses;
    const netProfit = operatingProfit;
    const profitMargin = dayTotalRevenue > 0 ? (netProfit / dayTotalRevenue) * 100 : 0;

    const profitLossData = {
      date: startOfDay,
      period: 'DAILY',
      periodStart: startOfDay,
      periodEnd: endOfDay,
      totalRevenue: dayTotalRevenue,
      salesRevenue: dayTotalRevenue,
      totalCostOfGoods: totalFuelCost,
      fuelCost: totalFuelCost,
      totalExpenses,
      grossProfit,
      operatingProfit,
      netProfit,
      profitMargin,
      totalSales: todaySales.length,
      totalLitresSold,
      averageSaleValue: todaySales.length > 0 ? dayTotalRevenue / todaySales.length : 0,
      pumpPerformance: Object.values(pumpPerformance),
      productPerformance: Object.values(productPerformance),
      totalDeliveries: todayDeliveries.length,
      totalLitresDelivered: todayDeliveries.reduce((sum, d) => sum + (d.quantity || 0), 0),
      recordedBy: req.user._id,
      recordedByName: req.user.fullName
    };

    await ProfitLoss.findOneAndUpdate(
      { date: startOfDay, period: 'DAILY', isDeleted: false },
      profitLossData,
      { upsert: true, new: true }
    );

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