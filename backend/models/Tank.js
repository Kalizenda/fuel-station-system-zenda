const mongoose = require('mongoose');

const tankSchema = new mongoose.Schema({
  name: { type: String, required: true },
  capacity: { type: Number, required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  currentStock: { type: Number, default: 0 },
  minStockLevel: { type: Number, default: 5000 },
  maxStockLevel: { type: Number }, // Maximum safe level
  lastDipReading: { type: Number }, // Manual dip reading
  lastDipDate: { type: Date }, // When dip was taken
  status: { type: String, enum: ['Active', 'Inactive', 'Maintenance', 'Critical'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('Tank', tankSchema);