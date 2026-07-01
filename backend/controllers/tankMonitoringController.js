const Tank = require('../models/Tank');
const Notification = require('../models/Notification');

exports.getTankLevels = async (req, res) => {
  try {
    const tanks = await Tank.find().populate('product', 'name code');
    const tankData = tanks.map(tank => {
      const percentage = (tank.currentStock / tank.capacity) * 100;
      let status = 'Normal';
      if (percentage <= 10) status = 'Critical';
      else if (percentage <= 25) status = 'Low';
      else if (percentage >= 90) status = 'High';
      
      // Check if tank needs attention based on actual stock level vs minStockLevel (in litres)
      const needsAttention = tank.currentStock <= tank.minStockLevel || percentage >= 90;
      
      return {
        ...tank.toObject(),
        percentage: percentage.toFixed(1),
        levelStatus: status,
        needsAttention: needsAttention
      };
    });
    
    res.status(200).json({ success: true, data: tankData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.recordDipReading = async (req, res) => {
  try {
    const { tankId, dipReading } = req.body;
    const tank = await Tank.findByIdAndUpdate(
      tankId,
      { 
        currentStock: dipReading,
        lastDipReading: dipReading,
        lastDipDate: new Date()
      },
      { new: true }
    ).populate('product');
    
    if (!tank) {
      return res.status(404).json({ success: false, message: 'Tank not found' });
    }
    
    // Check if level is critical (compare litres with litres, not percentage with litres)
    const percentage = (tank.currentStock / tank.capacity) * 100;
    if (tank.currentStock <= tank.minStockLevel) {
      try {
        await Notification.create({
          title: 'Critical Tank Level',
          message: `Tank ${tank.name} is at critical level (${percentage.toFixed(1)}%)`,
          type: 'LOW_STOCK',
          priority: 'High',
          recipient: req.user?._id || null
        });
      } catch (notifError) {
        console.error('Failed to create notification:', notifError.message);
        // Continue even if notification fails
      }
    }
    
    res.status(200).json({ success: true, data: tank });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTankThresholds = async (req, res) => {
  try {
    const { tankId, minStockLevel, maxStockLevel } = req.body;
    const tank = await Tank.findByIdAndUpdate(
      tankId,
      { minStockLevel, maxStockLevel },
      { new: true }
    );
    
    if (!tank) {
      return res.status(404).json({ success: false, message: 'Tank not found' });
    }
    
    res.status(200).json({ success: true, data: tank });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
