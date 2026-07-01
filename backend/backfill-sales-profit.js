const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Sale = require('./models/Sale');
const Product = require('./models/Product');
const Pump = require('./models/Pump');
const ProfitLoss = require('./models/ProfitLoss');
const User = require('./models/User');

dotenv.config();

const backfillSalesAndGenerateProfitLoss = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    // Get a valid user for recordedBy field
    const systemUser = await User.findOne({ role: 'Super Admin' });
    if (!systemUser) {
      console.log('❌ No Super Admin user found. Please create one first.');
      process.exit(1);
    }

    // Backfill existing sales with costPrice, totalCost, and profit
    console.log('\n🔄 Backfilling existing sales...');
    const sales = await Sale.find({ costPrice: { $exists: false } }).populate('product');
    
    for (const sale of sales) {
      if (sale.product && sale.product.costPrice !== undefined) {
        const costPrice = sale.product.costPrice || 0;
        const totalCost = sale.litresSold * costPrice;
        const profit = sale.totalRevenue - totalCost;
        
        await Sale.findByIdAndUpdate(sale._id, {
          costPrice,
          totalCost,
          profit
        });
        console.log(`✅ Updated sale ${sale._id}: costPrice=${costPrice}, totalCost=${totalCost}, profit=${profit}`);
      }
    }

    // Generate ProfitLoss records for each day with sales
    console.log('\n🔄 Generating ProfitLoss records...');
    const salesGroupedByDate = await Sale.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    for (const group of salesGroupedByDate) {
      const dateStr = group._id;
      const startOfDay = new Date(dateStr);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateStr);
      endOfDay.setHours(23, 59, 59, 999);

      // Check if ProfitLoss record already exists
      const existing = await ProfitLoss.findOne({
        date: startOfDay,
        period: 'DAILY',
        isDeleted: false
      });

      if (existing) {
        console.log(`⏭️  ProfitLoss record already exists for ${dateStr}`);
        continue;
      }

      // Get sales for the day with populated data
      const daySales = await Sale.find({
        date: { $gte: startOfDay, $lte: endOfDay }
      }).populate('pump', 'pumpNumber product')
       .populate('product', 'name code sellingPrice costPrice');

      // Get deliveries for the day
      const FuelDelivery = require('./models/FuelDelivery');
      const deliveries = await FuelDelivery.find({
        date: { $gte: startOfDay, $lte: endOfDay }
      }).populate('product', 'name code costPrice');

      // Get expenses for the day
      const Expense = require('./models/Expense');
      const expenses = await Expense.find({
        date: { $gte: startOfDay, $lte: endOfDay }
      });

      // Calculate totals
      let totalRevenue = 0;
      let totalLitresSold = 0;
      let totalFuelCost = 0;
      let totalExpenses = 0;
      const pumpPerformance = {};
      const productPerformance = {};

      daySales.forEach(sale => {
        const revenue = sale.totalRevenue || 0;
        const litres = sale.litresSold || 0;
        const cost = sale.totalCost || 0;
        const product = sale.product;
        const pump = sale.pump;

        totalRevenue += revenue;
        totalLitresSold += litres;
        totalFuelCost += cost;

        // Pump performance
        if (pump) {
          if (!pumpPerformance[pump._id]) {
            pumpPerformance[pump._id] = {
              pumpId: pump._id,
              pumpNumber: pump.pumpNumber,
              sales: 0,
              litresSold: 0,
              revenue: 0,
              cost: 0,
              profit: 0
            };
          }
          pumpPerformance[pump._id].sales += 1;
          pumpPerformance[pump._id].litresSold += litres;
          pumpPerformance[pump._id].revenue += revenue;
          pumpPerformance[pump._id].cost += cost;
          pumpPerformance[pump._id].profit += (revenue - cost);
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
              profit: 0
            };
          }
          productPerformance[product._id].sales += 1;
          productPerformance[product._id].litresSold += litres;
          productPerformance[product._id].revenue += revenue;
          productPerformance[product._id].cost += cost;
          productPerformance[product._id].profit += (revenue - cost);
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

      // Create ProfitLoss record
      await ProfitLoss.create({
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
        totalSales: daySales.length,
        totalLitresSold,
        averageSaleValue: daySales.length > 0 ? totalRevenue / daySales.length : 0,
        pumpPerformance: Object.values(pumpPerformance),
        productPerformance: Object.values(productPerformance),
        totalDeliveries: deliveries.length,
        totalLitresDelivered: deliveries.reduce((sum, d) => sum + (d.quantity || 0), 0),
        recordedBy: systemUser._id,
        recordedByName: systemUser.fullName
      });

      console.log(`✅ Created ProfitLoss record for ${dateStr}: Revenue=${totalRevenue}, Profit=${netProfit}`);
    }

    console.log('\n✅ Backfill complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

backfillSalesAndGenerateProfitLoss();
