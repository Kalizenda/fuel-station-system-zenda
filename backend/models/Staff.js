const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  email: { type: String, lowercase: true },
  address: { type: String },
  position: {
    type: String,
    enum: ['Manager', 'Accountant', 'Attendant', 'Security', 'Cleaner', 'Mechanic', 'Driver'],
    required: true
  },
  salary: { type: Number, required: true },
  employmentDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Active', 'On Leave', 'Terminated'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('Staff', staffSchema);