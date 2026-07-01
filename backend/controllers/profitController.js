const Sale = require('../models/Sale');
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
};