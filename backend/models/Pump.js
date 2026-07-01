const mongoose = require('mongoose');

const pumpSchema = new mongoose.Schema({
  pumpNumber: { type: String, required: true, unique: true },
  tank: { type: mongoose.Schema.Types.ObjectId, ref: 'Tank', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  status: { type: String, enum: ['Active', 'Inactive', 'Maintenance'], default: 'Active' },
  currentMeterReading: { type: Number, default: 0 },
  assignedAttendant: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  assignmentDate: { type: Date },
  assignmentShift: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Pump', pumpSchema);