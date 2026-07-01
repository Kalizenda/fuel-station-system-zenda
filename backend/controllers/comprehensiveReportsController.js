const Sale = require('../models/Sale');
const FuelDelivery = require('../models/FuelDelivery');
const Expense = require('../models/Expense');
const Product = require('../models/Product');
const Pump = require('../models/Pump');
const Tank = require('../models/Tank');
const Staff = require('../models/Staff');
const ProfitLoss = require('../models/ProfitLoss');
const DailySummary = require('../models/DailySummary');
const ActivityLog = require('../models/ActivityLog');

// Generate comprehensive sales report with pump-level gains
exports.generateComprehensiveSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get sales data
    const sales = await Sale.find({
      date: { $gte: start, $lte: end }
    }).populate('pump', 'pumpNumber product')
     .populate('product', 'name code sellingPrice costPrice')
     .populate('tank', 'name product')
     .populate('attendant', 'name')
     .sort({ date: -1 });
    
    // Calculate pump-level gains
    const pumpGains = {};
    const productGains = {};
    const attendantGains = {};
    
    sales.forEach(sale => {
      const revenue = sale.totalRevenue || 0;
      const litres = sale.litresSold || 0;
      const product = sale.product;
      const pump = sale.pump;
      const attendant = sale.attendant;
      
      // Calculate cost and gain
      const cost = litres * (product?.costPrice || 0);
      const gain = revenue - cost;
      
      // Pump gains
      if (pump) {
        if (!pumpGains[pump._id]) {
          pumpGains[pump._id] = {
            pumpId: pump._id,
            pumpNumber: pump.pumpNumber,
            productName: product?.name || 'N/A',
            sales: 0,
            litresSold: 0,
            revenue: 0,
            cost: 0,
            gain: 0,
            gainPerLitre: 0,
            gainPercentage: 0
          };
        }
        pumpGains[pump._id].sales += 1;
        pumpGains[pump._id].litresSold += litres;
        pumpGains[pump._id].revenue += revenue;
        pumpGains[pump._id].cost += cost;
        pumpGains[pump._id].gain += gain;
        pumpGains[pump._id].gainPerLitre = pumpGains[pump._id].gain / pumpGains[pump._id].litresSold;
        pumpGains[pump._id].gainPercentage = (pumpGains[pump._id].gain / pumpGains[pump._id].revenue) * 100;
      }
      
      // Product gains
      if (product) {
        if (!productGains[product._id]) {
          productGains[product._id] = {
            productId: product._id,
            productName: product.name,
            productCode: product.code,
            sales: 0,
            litresSold: 0,
            revenue: 0,
            cost: 0,
            gain: 0,
            gainPerLitre: 0,
            gainPercentage: 0
          };
        }
        productGains[product._id].sales += 1;
        productGains[product._id].litresSold += litres;
        productGains[product._id].revenue += revenue;
        productGains[product._id].cost += cost;
        productGains[product._id].gain += gain;
        productGains[product._id].gainPerLitre = productGains[product._id].gain / productGains[product._id].litresSold;
        productGains[product._id].gainPercentage = (productGains[product._id].gain / productGains[product._id].revenue) * 100;
      }
      
      // Attendant gains
      if (attendant) {
        if (!attendantGains[attendant._id]) {
          attendantGains[attendant._id] = {
            attendantId: attendant._id,
            attendantName: attendant.name,
            sales: 0,
            litresSold: 0,
            revenue: 0,
            cost: 0,
            gain: 0,
            gainPerSale: 0
          };
        }
        attendantGains[attendant._id].sales += 1;
        attendantGains[attendant._id].litresSold += litres;
        attendantGains[attendant._id].revenue += revenue;
        attendantGains[attendant._id].cost += cost;
        attendantGains[attendant._id].gain += gain;
        attendantGains[attendant._id].gainPerSale = attendantGains[attendant._id].gain / attendantGains[attendant._id].sales;
      }
    });
    
    const reportData = {
      period: {
        startDate: start,
        endDate: end
      },
      summary: {
        totalSales: sales.length,
        totalRevenue: sales.reduce((sum, s) => sum + (s.totalRevenue || 0), 0),
        totalLitresSold: sales.reduce((sum, s) => sum + (s.litresSold || 0), 0),
        totalCost: sales.reduce((sum, s) => sum + (s.litresSold * (s.product?.costPrice || 0)), 0),
        totalGain: Object.values(pumpGains).reduce((sum, p) => sum + p.gain, 0)
      },
      pumpGains: Object.values(pumpGains),
      productGains: Object.values(productGains),
      attendantGains: Object.values(attendantGains),
      sales: sales
    };
    
    if (format === 'csv' || format === 'excel') {
      // Generate CSV format
      const csvHeaders = ['Date', 'Pump', 'Product', 'Attendant', 'Litres', 'Revenue', 'Cost', 'Gain', 'Gain %'];
      const csvRows = sales.map(s => [
        s.date.toISOString().split('T')[0],
        s.pump?.pumpNumber || 'N/A',
        s.product?.name || 'N/A',
        s.attendant?.name || 'N/A',
        s.litresSold || 0,
        s.totalRevenue || 0,
        s.litresSold * (s.product?.costPrice || 0),
        s.totalRevenue - (s.litresSold * (s.product?.costPrice || 0)),
        ((s.totalRevenue - (s.litresSold * (s.product?.costPrice || 0))) / s.totalRevenue * 100).toFixed(2)
      ]);
      
      const csvContent = [csvHeaders, ...csvRows].map(row => row.join(',')).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="sales-report-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } else {
      res.status(200).json({ success: true, data: reportData });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generate comprehensive profit/loss report
exports.generateComprehensiveProfitLossReport = async (req, res) => {
  try {
    const { startDate, endDate, period = 'DAILY' } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    
    const profitLossData = await ProfitLoss.find({
      date: { $gte: start, $lte: end },
      period: period.toUpperCase(),
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
      profitMargin: 0,
      totalSales: 0,
      totalLitresSold: 0,
      totalLoss: 0,
      totalDeliveries: 0,
      totalLitresDelivered: 0
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
      summary.totalDeliveries += pl.totalDeliveries || 0;
      summary.totalLitresDelivered += pl.totalLitresDelivered || 0;
    });
    
    summary.profitMargin = summary.totalRevenue > 0 ? (summary.netProfit / summary.totalRevenue) * 100 : 0;
    
    res.status(200).json({ 
      success: true, 
      data: {
        period: {
          startDate: start,
          endDate: end,
          type: period.toUpperCase()
        },
        summary,
        details: profitLossData
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generate activity report
exports.generateActivityReport = async (req, res) => {
  try {
    const { startDate, endDate, action, userId } = req.query;
    
    const query = { isDeleted: false };
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    if (action) query.action = action;
    if (userId) query.userId = userId;
    
    const activities = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .populate('userId', 'fullName email')
      .limit(1000);
    
    // Generate summary statistics
    const actionStats = {};
    const userStats = {};
    
    activities.forEach(activity => {
      if (!actionStats[activity.action]) {
        actionStats[activity.action] = 0;
      }
      actionStats[activity.action]++;
      
      if (!userStats[activity.userId?._id]) {
        userStats[activity.userId?._id] = {
          userName: activity.userName,
          count: 0
        };
      }
      userStats[activity.userId?._id].count++;
    });
    
    res.status(200).json({ 
      success: true, 
      data: {
        totalActivities: activities.length,
        actionStats,
        userStats,
        activities
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generate inventory report
exports.generateInventoryReport = async (req, res) => {
  try {
    const tanks = await Tank.find().populate('product', 'name code');
    const pumps = await Pump.find().populate('product', 'name code').populate('tank', 'name');
    const products = await Product.find();
    
    // Calculate tank utilization
    const tankUtilization = tanks.map(tank => {
      const percentage = (tank.currentStock / tank.capacity) * 100;
      return {
        name: tank.name,
        product: tank.product?.name || 'N/A',
        capacity: tank.capacity,
        currentStock: tank.currentStock,
        percentage: percentage.toFixed(1),
        status: percentage <= 10 ? 'Critical' : percentage <= 25 ? 'Low' : percentage >= 90 ? 'High' : 'Normal'
      };
    });
    
    // Calculate pump utilization
    const pumpUtilization = pumps.map(pump => ({
      pumpNumber: pump.pumpNumber,
      product: pump.product?.name || 'N/A',
      tank: pump.tank?.name || 'N/A',
      status: pump.status,
      currentMeterReading: pump.currentMeterReading
    }));
    
    res.status(200).json({ 
      success: true, 
      data: {
        tanks: tankUtilization,
        pumps: pumpUtilization,
        products: products.map(p => ({
          name: p.name,
          code: p.code,
          sellingPrice: p.sellingPrice,
          costPrice: p.costPrice,
          profitMargin: ((p.sellingPrice - p.costPrice) / p.sellingPrice * 100).toFixed(2)
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generate executive summary report
exports.generateExecutiveSummary = async (req, res) => {
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
    }
    
    // Get key metrics
    const sales = await Sale.find({
      date: { $gte: startDate, $lte: endDate }
    });
    
    const deliveries = await FuelDelivery.find({
      date: { $gte: startDate, $lte: endDate }
    });
    
    const expenses = await Expense.find({
      date: { $gte: startDate, $lte: endDate }
    });
    
    const totalRevenue = sales.reduce((sum, s) => sum + (s.totalRevenue || 0), 0);
    const totalLitresSold = sales.reduce((sum, s) => sum + (s.litresSold || 0), 0);
    const totalFuelCost = sales.reduce((sum, s) => sum + (s.litresSold * (s.product?.costPrice || 0)), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    
    const grossProfit = totalRevenue - totalFuelCost;
    const netProfit = grossProfit - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    // Get top performing pumps
    const pumpPerformance = {};
    sales.forEach(sale => {
      if (sale.pump) {
        if (!pumpPerformance[sale.pump._id]) {
          pumpPerformance[sale.pump._id] = {
            pumpNumber: sale.pump.pumpNumber,
            revenue: 0,
            litres: 0,
            sales: 0
          };
        }
        pumpPerformance[sale.pump._id].revenue += sale.totalRevenue || 0;
        pumpPerformance[sale.pump._id].litres += sale.litresSold || 0;
        pumpPerformance[sale.pump._id].sales += 1;
      }
    });
    
    const topPumps = Object.values(pumpPerformance)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    
    res.status(200).json({ 
      success: true, 
      data: {
        period: period.toUpperCase(),
        dateRange: { startDate, endDate },
        financials: {
          totalRevenue,
          totalFuelCost,
          totalExpenses,
          grossProfit,
          netProfit,
          profitMargin
        },
        operations: {
          totalSales: sales.length,
          totalLitresSold,
          totalDeliveries: deliveries.length,
          totalLitresDelivered: deliveries.reduce((sum, d) => sum + (d.quantity || 0), 0),
          totalExpenses: expenses.length
        },
        topPumps,
        averageSaleValue: sales.length > 0 ? totalRevenue / sales.length : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
