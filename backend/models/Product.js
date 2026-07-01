const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  unit: { type: String, default: 'Litre' },
  sellingPrice: { type: Number, required: true },
  costPrice: { type: Number, default: 0 },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);