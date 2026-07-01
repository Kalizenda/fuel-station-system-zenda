const PumpMaintenance = require('../models/PumpMaintenance');
const Pump = require('../models/Pump');

exports.addMaintenance = async (req, res) => {
  try {
    const maintenance = await PumpMaintenance.create(req.body);
    res.status(201).json({ success: true, data: maintenance });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getMaintenanceRecords = async (req, res) => {
  try {
    const maintenance = await PumpMaintenance.find().populate('pump', 'pumpNumber').sort('-scheduledDate');
    res.status(200).json({ success: true, data: maintenance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateMaintenance = async (req, res) => {
  try {
    const maintenance = await PumpMaintenance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!maintenance) {
      return res.status(404).json({ success: false, message: 'Maintenance record not found' });
    }
    res.status(200).json({ success: true, data: maintenance });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteMaintenance = async (req, res) => {
  try {
    const maintenance = await PumpMaintenance.findByIdAndDelete(req.params.id);
    if (!maintenance) {
      return res.status(404).json({ success: false, message: 'Maintenance record not found' });
    }
    res.status(200).json({ success: true, message: 'Maintenance record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUpcomingMaintenance = async (req, res) => {
  try {
    const today = new Date();
    const upcoming = await PumpMaintenance.find({
      scheduledDate: { $gte: today },
      status: { $ne: 'Completed' }
    }).populate('pump', 'pumpNumber').sort('scheduledDate');
    res.status(200).json({ success: true, data: upcoming });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
