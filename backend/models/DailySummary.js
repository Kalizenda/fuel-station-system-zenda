const mongoose = require('mongoose');

const dailySummarySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true,
    index: true
  },
  
  // Sales Summary
  totalSales: {
    type: Number,
    default: 0
  },
  totalRevenue: {
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
  
  // Cost Summary
  totalCost: {
    type: Number,
    default: 0
  },
  fuelCost: {
    type: Number,
    default: 0
  },
  operatingCost: {
    type: Number,
    default: 0
  },
  
  // Profit Summary
  grossProfit: {
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
  
  // Pump-Level Sales
  pumpSales: [{
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
    },
    openingMeter: {
      type: Number,
      default: 0
    },
    closingMeter: {
      type: Number,
      default: 0
    }
  }],
  
  // Product-Level Sales
  productSales: [{
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
  
  // Payment Method Breakdown
  paymentMethods: [{
    method: {
      type: String,
      enum: ['Cash', 'Transfer', 'Card']
    },
    count: {
      type: Number,
      default: 0
    },
    amount: {
      type: Number,
      default: 0
    }
  }],
  
  // Shift Summary
  shiftSummary: [{
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shift'
    },
    shiftType: {
      type: String
    },
    sales: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    },
    profit: {
      type: Number,
      default: 0
    }
  }],
  
  // Staff Performance
  staffPerformance: [{
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff'
    },
    staffName: {
      type: String
    },
    sales: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    },
    profit: {
      type: Number,
      default: 0
    }
  }],
  
  // Deliveries
  totalDeliveries: {
    type: Number,
    default: 0
  },
  totalLitresDelivered: {
    type: Number,
    default: 0
  },
  deliveryCost: {
    type: Number,
    default: 0
  },
  
  // Expenses
  totalExpenses: {
    type: Number,
    default: 0
  },
  expenseCategories: [{
    category: {
      type: String
    },
    amount: {
      type: Number,
      default: 0
    }
  }],
  
  // Loss Tracking
  totalLoss: {
    type: Number,
    default: 0
  },
  lossBreakdown: [{
    type: {
      type: String,
      enum: ['fuel', 'theft', 'spillage', 'other']
    },
    amount: {
      type: Number,
      default: 0
    },
    description: {
      type: String
    }
  }],
  
  // Tank Levels
  tankLevels: [{
    tankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tank'
    },
    tankName: {
      type: String
    },
    productName: {
      type: String
    },
    openingLevel: {
      type: Number,
      default: 0
    },
    closingLevel: {
      type: Number,
      default: 0
    },
    litresSold: {
      type: Number,
      default: 0
    },
    litresDelivered: {
      type: Number,
      default: 0
    }
  }],
  
  // Operational Metrics
  totalTransactions: {
    type: Number,
    default: 0
  },
  averageTransactionValue: {
    type: Number,
    default: 0
  },
  peakHour: {
    type: String
  },
  peakHourSales: {
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
  anomalies: [{
    type: {
      type: String
    },
    description: {
      type: String
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high']
    }
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
dailySummarySchema.index({ date: -1 });
dailySummarySchema.index({ isDeleted: 1 });
dailySummarySchema.index({ isLocked: 1 });

module.exports = mongoose.model('DailySummary', dailySummarySchema);
