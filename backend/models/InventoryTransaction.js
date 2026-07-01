const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
  type: { type: String, enum: ['Stock In', 'Stock Out', 'Adjustment'], required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalValue: { type: Number, required: true },
  reference: { type: String },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);