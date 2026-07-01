const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['Salaries', 'Diesel', 'Electricity', 'Repairs', 'Security', 'Internet', 'Transportation', 'Tax', 'Miscellaneous'],
    required: true
  },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  description: { type: String, required: true },
  paymentMethod: { type: String, enum: ['Cash', 'Bank Transfer'], default: 'Cash' },
  approvalStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Approved' },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);