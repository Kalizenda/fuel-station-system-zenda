const mongoose = require('mongoose');

const pumpMaintenanceSchema = new mongoose.Schema({
  pump: { type: mongoose.Schema.Types.ObjectId, ref: 'Pump', required: true },
  maintenanceType: { type: String, enum: ['Routine', 'Repair', 'Emergency', 'Calibration'], required: true },
  description: { type: String, required: true },
  performedBy: { type: String, required: true },
  cost: { type: Number, default: 0 },
  status: { type: String, enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'], default: 'Scheduled' },
  scheduledDate: { type: Date, required: true },
  completedDate: { type: Date },
  nextMaintenanceDate: { type: Date },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('PumpMaintenance', pumpMaintenanceSchema);
