const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ['Engine Oil', 'Lubricants', 'Spare Parts', 'Accessories', 'Other'], required: true },
  sku: { type: String, required: true, unique: true },
  unit: { type: String, default: 'Piece' },
  currentStock: { type: Number, default: 0 },
  minStockLevel: { type: Number, default: 10 },
  costPrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' }
}, { timestamps: true });

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);