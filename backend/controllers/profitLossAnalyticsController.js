const ProfitLoss = require('../models/ProfitLoss');
const DailySummary = require('../models/DailySummary');
const Sale = require('../models/Sale');
const FuelDelivery = require('../models/FuelDelivery');
const Expense = require('../models/Expense');
const Product = require('../models/Product');
const Pump = require('../models/Pump');
const Tank = require('../models/Tank');

// Generate daily profit/loss report
exports.generateDailyProfitLoss = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Get sales for the day
    const sales = await Sale.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('pump', 'pumpNumber product')
     .populate('product', 'name code sellingPrice costPrice');

    // Get deliveries for the day
    const deliveries = await FuelDelivery.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('product', 'name code costPrice');

    // Get expenses for the day
    const expenses = await Expense.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    // Calculate totals
    let totalRevenue = 0;
    let totalLitresSold = 0;
    let totalFuelCost = 0;
    let totalExpenses = 0;

    // Pump-level performance
    const pumpPerformance = {};
    const productPerformance = {};

    sales.forEach(sale => {
      const revenue = sale.totalRevenue || 0;
      const litres = sale.litresSold || 0;
      const product = sale.product;
      const pump = sale.pump;

      totalRevenue += revenue;
      totalLitresSold += litres;

      // Calculate fuel cost
      const fuelCost = litres * (product?.costPrice || 0);
      totalFuelCost += fuelCost;

      // Pump performance
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

      // Product performance
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

    // Calculate expenses
    expenses.forEach(expense => {
      totalExpenses += expense.amount || 0;
    });

    // Calculate profit metrics
    const grossProfit = totalRevenue - totalFuelCost;
    const operatingProfit = grossProfit - totalExpenses;
    const netProfit = operatingProfit;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Create or update profit/loss record
    const profitLossData = {
      date: startOfDay,
      period: 'DAILY',
      periodStart: startOfDay,
      periodEnd: endOfDay,
      totalRevenue,
      salesRevenue: totalRevenue,
      totalCostOfGoods: totalFuelCost,
      fuelCost: totalFuelCost,
      totalExpenses,
      grossProfit,
      operatingProfit,
      netProfit,
      profitMargin,
      totalSales: sales.length,
      totalLitresSold,
      averageSaleValue: sales.length > 0 ? totalRevenue / sales.length : 0,
      pumpPerformance: Object.values(pumpPerformance),
      productPerformance: Object.values(productPerformance),
      totalDeliveries: deliveries.length,
      totalLitresDelivered: deliveries.reduce((sum, d) => sum + (d.quantity || 0), 0),
      recordedBy: req.user._id,
      recordedByName: req.user.fullName
    };

    let profitLoss = await ProfitLoss.findOne({
      date: startOfDay,
      period: 'DAILY',
      isDeleted: false
    });

    if (profitLoss) {
      profitLoss = await ProfitLoss.findByIdAndUpdate(
        profitLoss._id,
        profitLossData,
        { new: true }
      );
    } else {
      profitLoss = await ProfitLoss.create(profitLossData);
    }

    res.status(200).json({ success: true, data: profitLoss });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get profit/loss analytics for different periods
exports.getProfitLossAnalytics = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    
    const query = { isDeleted: false };
    
    if (period) {
      query.period = period.toUpperCase();
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const profitLossData = await ProfitLoss.find(query)
      .sort({ date: -1 })
      .populate('recordedBy', 'fullName email')
      .populate('verifiedBy', 'fullName email');
    
    res.status(200).json({ success: true, data: profitLossData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get comprehensive profit/loss summary
exports.getProfitLossSummary = async (req, res) => {
  try {
    const { period = 'DAILY' } = req.query;
    
    const now = new Date();
    let startDate, endDate;
    
    switch (period.toUpperCase()) {
      case 'DAILY':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'WEEKLY':
        startDate = new Date(now.setDate(now.getDate() - now.getDay()));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.setDate(now.getDate() + 6));
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'MONTHLY':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'YEARLY':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'CUMULATIVE':
        startDate = new Date(0);
        endDate = new Date();
        break;
    }
    
    const profitLossData = await ProfitLoss.find({
      date: { $gte: startDate, $lte: endDate },
      isDeleted: false
    }).sort({ date: -1 });
    
    // Calculate aggregates
    const summary = {
      totalRevenue: 0,
      totalCostOfGoods: 0,
      totalExpenses: 0,
      grossProfit: 0,
      operatingProfit: 0,
      netProfit: 0,
      totalSales: 0,
      totalLitresSold: 0,
      totalLoss: 0,
      pumpPerformance: {},
      productPerformance: {}
    };
    
    profitLossData.forEach(pl => {
      summary.totalRevenue += pl.totalRevenue || 0;
      summary.totalCostOfGoods += pl.totalCostOfGoods || 0;
      summary.totalExpenses += pl.totalExpenses || 0;
      summary.grossProfit += pl.grossProfit || 0;
      summary.operatingProfit += pl.operatingProfit || 0;
      summary.netProfit += pl.netProfit || 0;
      summary.totalSales += pl.totalSales || 0;
      summary.totalLitresSold += pl.totalLitresSold || 0;
      summary.totalLoss += pl.totalLoss || 0;
      
      // Aggregate pump performance
      pl.pumpPerformance.forEach(pp => {
        if (!summary.pumpPerformance[pp.pumpId]) {
          summary.pumpPerformance[pp.pumpId] = { ...pp };
        } else {
          summary.pumpPerformance[pp.pumpId].sales += pp.sales;
          summary.pumpPerformance[pp.pumpId].litresSold += pp.litresSold;
          summary.pumpPerformance[pp.pumpId].revenue += pp.revenue;
          summary.pumpPerformance[pp.pumpId].cost += pp.cost;
          summary.pumpPerformance[pp.pumpId].profit += pp.profit;
        }
      });
      
      // Aggregate product performance
      pl.productPerformance.forEach(pp => {
        if (!summary.productPerformance[pp.productId]) {
          summary.productPerformance[pp.productId] = { ...pp };
        } else {
          summary.productPerformance[pp.productId].sales += pp.sales;
          summary.productPerformance[pp.productId].litresSold += pp.litresSold;
          summary.productPerformance[pp.productId].revenue += pp.revenue;
          summary.productPerformance[pp.productId].cost += pp.cost;
          summary.productPerformance[pp.productId].profit += pp.profit;
        }
      });
    });
    
    summary.profitMargin = summary.totalRevenue > 0 ? (summary.netProfit / summary.totalRevenue) * 100 : 0;
    summary.pumpPerformance = Object.values(summary.pumpPerformance);
    summary.productPerformance = Object.values(summary.productPerformance);
    
    res.status(200).json({ 
      success: true, 
      data: {
        period: period.toUpperCase(),
        startDate,
        endDate,
        summary,
        details: profitLossData
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get pump-level performance with gains
exports.getPumpPerformance = async (req, res) => {
  try {
    const { startDate, endDate, pumpId } = req.query;
    
    const matchQuery = { isDeleted: false };
    
    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchQuery.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchQuery.date.$lte = end;
      }
    }
    
    const profitLossData = await ProfitLoss.find(matchQuery)
      .sort({ date: -1 });
    
    const pumpPerformance = {};
    
    profitLossData.forEach(pl => {
      pl.pumpPerformance.forEach(pp => {
        if (pumpId && pp.pumpId.toString() !== pumpId) return;
        
        if (!pumpPerformance[pp.pumpId]) {
          pumpPerformance[pp.pumpId] = {
            pumpId: pp.pumpId,
            pumpNumber: pp.pumpNumber,
            productName: pp.productName,
            totalSales: 0,
            totalLitresSold: 0,
            totalRevenue: 0,
            totalCost: 0,
            totalProfit: 0,
            averageProfitPerLitre: 0,
            dailyPerformance: []
          };
        }
        
        pumpPerformance[pp.pumpId].totalSales += pp.sales;
        pumpPerformance[pp.pumpId].totalLitresSold += pp.litresSold;
        pumpPerformance[pp.pumpId].totalRevenue += pp.revenue;
        pumpPerformance[pp.pumpId].totalCost += pp.cost;
        pumpPerformance[pp.pumpId].totalProfit += pp.profit;
        pumpPerformance[pp.pumpId].averageProfitPerLitre = pumpPerformance[pp.pumpId].totalProfit / pumpPerformance[pp.pumpId].totalLitresSold;
        
        pumpPerformance[pp.pumpId].dailyPerformance.push({
          date: pl.date,
          sales: pp.sales,
          litresSold: pp.litresSold,
          revenue: pp.revenue,
          cost: pp.cost,
          profit: pp.profit,
          profitPerLitre: pp.profitPerLitre
        });
      });
    });
    
    res.status(200).json({ 
      success: true, 
      data: Object.values(pumpPerformance) 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lock profit/loss record (admin only)
exports.lockProfitLoss = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const profitLoss = await ProfitLoss.findByIdAndUpdate(
      req.params.id,
      {
        isLocked: true,
        lockedBy: req.user._id,
        lockedAt: new Date(),
        lockReason: reason
      },
      { new: true }
    );
    
    if (!profitLoss) {
      return res.status(404).json({ success: false, message: 'Profit/loss record not found' });
    }
    
    res.status(200).json({ success: true, data: profitLoss });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete profit/loss record (admin only with reason)
exports.deleteProfitLoss = async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Deletion reason is required' });
    }
    
    const profitLoss = await ProfitLoss.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: true,
        deletedBy: req.user._id,
        deletedAt: new Date(),
        deletionReason: reason
      },
      { new: true }
    );
    
    if (!profitLoss) {
      return res.status(404).json({ success: false, message: 'Profit/loss record not found' });
    }
    
    res.status(200).json({ success: true, data: profitLoss });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
