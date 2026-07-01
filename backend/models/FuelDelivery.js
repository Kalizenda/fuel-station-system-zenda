const mongoose = require('mongoose');

const fuelDeliverySchema = new mongoose.Schema({
  deliveryNumber: { type: String, required: true, unique: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  tank: { type: mongoose.Schema.Types.ObjectId, ref: 'Tank', required: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  quantityReceived: { type: Number, required: true },
  costPerLitre: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  deliveryDate: { type: Date, default: Date.now },
  invoiceNumber: { type: String },
  driverName: { type: String },
  truckNumber: { type: String },
  notes: { type: String },
  receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('FuelDelivery', fuelDeliverySchema);