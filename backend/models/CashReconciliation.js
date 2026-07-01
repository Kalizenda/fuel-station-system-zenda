const mongoose = require('mongoose');

const cashReconciliationSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  shift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: true },
  expectedCash: { type: Number, required: true },
  actualCash: { type: Number, required: true },
  difference: { type: Number, required: true },
  reconciledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notes: { type: String },
  status: { type: String, enum: ['Balanced', 'Short', 'Over'], required: true },
  paymentMethods: {
    cash: { type: Number, default: 0 },
    card: { type: Number, default: 0 },
    transfer: { type: Number, default: 0 },
    credit: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('CashReconciliation', cashReconciliationSchema);
