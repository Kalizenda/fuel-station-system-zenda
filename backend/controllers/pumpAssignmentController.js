const Pump = require('../models/Pump');
const Staff = require('../models/Staff');

exports.assignAttendantToPump = async (req, res) => {
  try {
    const { pumpId, attendantId, shift } = req.body;
    
    const pump = await Pump.findByIdAndUpdate(
      pumpId,
      { 
        assignedAttendant: attendantId,
        assignmentDate: new Date(),
        assignmentShift: shift
      },
      { new: true }
    ).populate('assignedAttendant', 'fullName position').populate('tank', 'name product').populate('product', 'name');
    
    if (!pump) {
      return res.status(404).json({ success: false, message: 'Pump not found' });
    }
    
    res.status(200).json({ success: true, data: pump });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPumpAssignments = async (req, res) => {
  try {
    const pumps = await Pump.find()
      .populate('assignedAttendant', 'fullName position phone')
      .populate('tank', 'name product')
      .populate('product', 'name code')
      .sort('pumpNumber');
    
    res.status(200).json({ success: true, data: pumps });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTodayAssignments = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const pumps = await Pump.find({
      assignmentDate: { $gte: startOfDay, $lte: endOfDay }
    })
      .populate('assignedAttendant', 'fullName position phone')
      .populate('tank', 'name product')
      .populate('product', 'name code')
      .sort('pumpNumber');
    
    res.status(200).json({ success: true, data: pumps });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.clearPumpAssignment = async (req, res) => {
  try {
    const pump = await Pump.findByIdAndUpdate(
      req.params.id,
      { 
        assignedAttendant: null,
        assignmentDate: null,
        assignmentShift: null
      },
      { new: true }
    ).populate('assignedAttendant', 'fullName position');
    
    if (!pump) {
      return res.status(404).json({ success: false, message: 'Pump not found' });
    }
    
    res.status(200).json({ success: true, data: pump });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
