require('dotenv').config();
const mongoose = require('mongoose');
const Tank = require('./models/Tank');
const Pump = require('./models/Pump');
const Product = require('./models/Product');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('=== TANKS ===');
  const tanks = await Tank.find().populate('product');
  tanks.forEach(t => {
    console.log(`${t.name}: ${t.product?.name || 'N/A'} - ${t.currentStock}L / ${t.capacity}L`);
  });
  
  console.log('\n=== PUMPS ===');
  const pumps = await Pump.find().populate('product').populate('tank');
  pumps.forEach(p => {
    console.log(`${p.pumpNumber}: ${p.product?.name || 'N/A'} - Tank: ${p.tank?.name || 'N/A'}`);
  });
  
  console.log('\n=== PRODUCTS ===');
  const products = await Product.find();
  products.forEach(p => {
    console.log(`${p.name} (${p.code}): ₦${p.sellingPrice}/L`);
  });
  
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
