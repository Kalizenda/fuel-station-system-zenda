const mongoose = require('mongoose');

const profitLossSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  period: {
    type: String,
    enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUMULATIVE'],
    required: true,
    index: true
  },
  periodStart: {
    type: Date,
    required: true
  },
  periodEnd: {
    type: Date,
    required: true
  },
  
  // Revenue
  totalRevenue: {
    type: Number,
    default: 0
  },
  salesRevenue: {
    type: Number,
    default: 0
  },
  otherRevenue: {
    type: Number,
    default: 0
  },
  
  // Cost of Goods Sold
  totalCostOfGoods: {
    type: Number,
    default: 0
  },
  fuelCost: {
    type: Number,
    default: 0
  },
  otherCostOfGoods: {
    type: Number,
    default: 0
  },
  
  // Operating Expenses
  totalExpenses: {
    type: Number,
    default: 0
  },
  staffExpenses: {
    type: Number,
    default: 0
  },
  maintenanceExpenses: {
    type: Number,
    default: 0
  },
  utilityExpenses: {
    type: Number,
    default: 0
  },
  otherExpenses: {
    type: Number,
    default: 0
  },
  
  // Profit/Loss
  grossProfit: {
    type: Number,
    default: 0
  },
  operatingProfit: {
    type: Number,
    default: 0
  },
  netProfit: {
    type: Number,
    default: 0
  },
  profitMargin: {
    type: Number,
    default: 0
  },
  
  // Sales Metrics
  totalSales: {
    type: Number,
    default: 0
  },
  totalLitresSold: {
    type: Number,
    default: 0
  },
  averageSaleValue: {
    type: Number,
    default: 0
  },
  
  // Pump-Level Performance
  pumpPerformance: [{
    pumpId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pump'
    },
    pumpNumber: {
      type: String
    },
    productName: {
      type: String
    },
    sales: {
      type: Number,
      default: 0
    },
    litresSold: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    },
    cost: {
      type: Number,
      default: 0
    },
    profit: {
      type: Number,
      default: 0
    },
    profitPerLitre: {
      type: Number,
      default: 0
    }
  }],
  
  // Product-Level Performance
  productPerformance: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    productName: {
      type: String
    },
    productCode: {
      type: String
    },
    sales: {
      type: Number,
      default: 0
    },
    litresSold: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    },
    cost: {
      type: Number,
      default: 0
    },
    profit: {
      type: Number,
      default: 0
    },
    profitMargin: {
      type: Number,
      default: 0
    }
  }],
  
  // Loss Tracking
  totalLoss: {
    type: Number,
    default: 0
  },
  fuelLoss: {
    type: Number,
    default: 0
  },
  theftLoss: {
    type: Number,
    default: 0
  },
  spillageLoss: {
    type: Number,
    default: 0
  },
  otherLoss: {
    type: Number,
    default: 0
  },
  
  // Additional Metrics
  totalDeliveries: {
    type: Number,
    default: 0
  },
  totalLitresDelivered: {
    type: Number,
    default: 0
  },
  averagePricePerLitre: {
    type: Number,
    default: 0
  },
  
  // Accountability
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recordedByName: {
    type: String,
    required: true
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedByName: {
    type: String
  },
  verifiedAt: {
    type: Date
  },
  
  // Data Protection
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedAt: {
    type: Date
  },
  deletionReason: {
    type: String
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lockedAt: {
    type: Date
  },
  lockReason: {
    type: String
  },
  
  notes: {
    type: String
  },
  attachments: [{
    type: String
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
profitLossSchema.index({ date: -1 });
profitLossSchema.index({ period: 1, date: -1 });
profitLossSchema.index({ periodStart: 1, periodEnd: 1 });
profitLossSchema.index({ isDeleted: 1 });
profitLossSchema.index({ isLocked: 1 });

module.exports = mongoose.model('ProfitLoss', profitLossSchema);
