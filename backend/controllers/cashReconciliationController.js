const CashReconciliation = require('../models/CashReconciliation');
const Sale = require('../models/Sale');
const Shift = require('../models/Shift');

exports.createReconciliation = async (req, res) => {
  try {
    const { shiftId, actualCash, paymentMethods, notes } = req.body;
    
    // Get expected cash from sales for this shift
    const sales = await Sale.find({ shift: shiftId });
    const expectedCash = sales.reduce((sum, sale) => sum + sale.totalRevenue, 0);
    
    const difference = actualCash - expectedCash;
    let status = 'Balanced';
    if (difference < 0) status = 'Short';
    if (difference > 0) status = 'Over';
    
    const reconciliation = await CashReconciliation.create({
      date: new Date(),
      shift: shiftId,
      expectedCash,
      actualCash,
      difference,
      reconciledBy: req.user.id,
      notes,
      status,
      paymentMethods: paymentMethods || { cash: 0, card: 0, transfer: 0, credit: 0 }
    });
    
    res.status(201).json({ success: true, data: reconciliation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getReconciliations = async (req, res) => {
  try {
    const reconciliations = await CashReconciliation.find()
      .populate('shift', 'type')
      .populate('reconciledBy', 'fullName')
      .sort('-date');
    res.status(200).json({ success: true, data: reconciliations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTodayReconciliation = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const reconciliation = await CashReconciliation.findOne({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('shift', 'type').populate('reconciledBy', 'fullName');
    
    res.status(200).json({ success: true, data: reconciliation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
