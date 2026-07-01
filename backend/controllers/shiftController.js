const Shift = require('../models/Shift');

exports.getCurrentShift = async (req, res) => {
  try {
    const shift = await Shift.findOne({ status: 'Open' }).populate('openedBy', 'fullName');
    res.status(200).json({ success: true, data: shift });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.openShift = async (req, res) => {
  try {
    const existing = await Shift.findOne({ status: 'Open' });
    if (existing) return res.status(400).json({ success: false, message: 'A shift is already open' });

    const { type } = req.body;
    const shift = await Shift.create({
      type: type || 'Morning',
      openedBy: req.user.id,
      status: 'Open'
    });
    res.status(201).json({ success: true, data: shift });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.closeShift = async (req, res) => {
  try {
    const shift = await Shift.findOne({ status: 'Open' });
    if (!shift) return res.status(400).json({ success: false, message: 'No open shift to close' });

    shift.status = 'Closed';
    shift.closedBy = req.user.id;
    shift.closingTime = new Date();
    await shift.save();
    res.status(200).json({ success: true, data: shift });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
