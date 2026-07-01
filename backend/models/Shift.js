const mongoose = require('mongoose');

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

module.exports = mongoose.model('Shift', shiftSchema);