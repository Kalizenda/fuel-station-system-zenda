require('dotenv').config();
const mongoose = require('mongoose');
const Tank = require('./models/Tank');
const Pump = require('./models/Pump');
const Product = require('./models/Product');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Testing API data structure...\n');
  
  const tanks = await Tank.find().populate('product', 'name code');
  console.log('TANKS API RESPONSE:');
  console.log(JSON.stringify(tanks.map(t => ({
    _id: t._id,
    name: t.name,
    capacity: t.capacity,
    currentStock: t.currentStock,
    product: t.product ? { name: t.product.name, code: t.product.code } : null
  })), null, 2));
  
  const pumps = await Pump.find().populate('product', 'name code sellingPrice').populate('tank', 'name');
  console.log('\nPUMPS API RESPONSE:');
  console.log(JSON.stringify(pumps.map(p => ({
    _id: p._id,
    pumpNumber: p.pumpNumber,
    product: p.product ? { name: p.product.name, code: p.product.code, sellingPrice: p.product.sellingPrice } : null,
    tank: p.tank ? { name: p.tank.name } : null
  })), null, 2));
  
  const products = await Product.find();
  console.log('\nPRODUCTS API RESPONSE:');
  console.log(JSON.stringify(products.map(p => ({
    _id: p._id,
    name: p.name,
    code: p.code,
    sellingPrice: p.sellingPrice,
    costPrice: p.costPrice
  })), null, 2));
  
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
