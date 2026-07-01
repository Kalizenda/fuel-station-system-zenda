const FuelDelivery = require('../models/FuelDelivery');
const Tank = require('../models/Tank');
const Product = require('../models/Product');
const { logActivity } = require('./activityLogController');

exports.addDelivery = async (req, res) => {
  try {
    const { tank, quantityReceived, costPerLitre, product } = req.body;
    const totalCost = quantityReceived * costPerLitre;
    const deliveryNumber = `DEL-${Date.now()}`;

    const delivery = await FuelDelivery.create({ ...req.body, totalCost, deliveryNumber, receivedBy: req.user.id });
    const updatedTank = await Tank.findByIdAndUpdate(tank, { $inc: { currentStock: quantityReceived } }, { new: true }).populate('product');
    await Product.findByIdAndUpdate(product, { costPrice: costPerLitre });

    // Log activity
    await logActivity(
      'DELIVERY',
      `Recorded delivery: ${quantityReceived}L of ${updatedTank.product.name} for ₦${totalCost.toFixed(2)}`,
      req.user._id,
      req.user.fullName,
      {
        entityType: 'DELIVERY',
        entityId: delivery._id,
        entityName: deliveryNumber,
        details: {
          tank: updatedTank.name,
          product: updatedTank.product.name,
          quantityReceived,
          totalCost,
          costPerLitre
        }
      }
    );

    res.status(201).json({ success: true, data: delivery, tankStock: updatedTank.currentStock });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getDeliveries = async (req, res) => {
  try {
    const deliveries = await FuelDelivery.find().populate('product tank supplier').sort('-createdAt');
    res.status(200).json({ success: true, data: deliveries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};