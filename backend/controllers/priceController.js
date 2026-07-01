const Product = require('../models/Product');

exports.updateProductPrice = async (req, res) => {
  try {
    const { productId, sellingPrice, costPrice } = req.body;
    const product = await Product.findByIdAndUpdate(
      productId,
      { sellingPrice, costPrice },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPriceHistory = async (req, res) => {
  try {
    const products = await Product.find().sort('name');
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.bulkPriceUpdate = async (req, res) => {
  try {
    const { priceUpdates } = req.body; // Array of { productId, sellingPrice, costPrice }
    
    const updatePromises = priceUpdates.map(update => 
      Product.findByIdAndUpdate(
        update.productId,
        { sellingPrice: update.sellingPrice, costPrice: update.costPrice },
        { new: true }
      )
    );
    
    const updatedProducts = await Promise.all(updatePromises);
    
    res.status(200).json({ success: true, data: updatedProducts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
