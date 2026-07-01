const mongoose = require('mongoose');

const cashTransactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['Cash In', 'Cash Out', 'Bank Deposit', 'Bank Withdrawal'], required: true },
  amount: { type: Number, required: true },
  reference: { type: String },
  description: { type: String, required: true },
  date: { type: Date, default: Date.now },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('CashTransaction', cashTransactionSchema);