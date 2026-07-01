const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  pump: { type: mongoose.Schema.Types.ObjectId, ref: 'Pump', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  tank: { type: mongoose.Schema.Types.ObjectId, ref: 'Tank', required: true },
  openingReading: { type: Number, required: true },
  closingReading: { type: Number, required: true },
  litresSold: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  costPrice: { type: Number, default: 0 },
  totalRevenue: { type: Number, required: true },
  totalCost: { type: Number, default: 0 },
  profit: { type: Number, default: 0 },
  attendant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift' },
  paymentMethod: { type: String, enum: ['Cash', 'Transfer', 'Card'], default: 'Cash' }
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);