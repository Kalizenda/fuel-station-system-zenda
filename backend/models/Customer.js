const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactPerson: { type: String },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  customerType: { type: String, enum: ['Individual', 'Corporate', 'Fleet'], default: 'Individual' },
  creditLimit: { type: Number, default: 0 },
  currentBalance: { type: Number, default: 0 },
  loyaltyPoints: { type: Number, default: 0 },
  discountRate: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive', 'Blacklisted'], default: 'Active' },
  vehicles: [{ type: String }], // Vehicle registration numbers
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
