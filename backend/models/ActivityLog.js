const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['SALE', 'DELIVERY', 'EXPENSE', 'PUMP_ASSIGNMENT', 'TANK_DIP', 'PRICE_CHANGE', 'STAFF_CHANGE', 'SYSTEM_RESET', 'DATA_DELETE', 'LOGIN', 'LOGOUT', 'OTHER']
  },
  description: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  entityType: {
    type: String,
    enum: ['SALE', 'DELIVERY', 'EXPENSE', 'PUMP', 'TANK', 'STAFF', 'PRODUCT', 'PRICE', 'SYSTEM']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId
  },
  entityName: {
    type: String
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
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
  }
}, {
  timestamps: true
});

// Index for efficient queries
activityLogSchema.index({ timestamp: -1 });
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });
activityLogSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
