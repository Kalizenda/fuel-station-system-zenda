require('dotenv').config();
const mongoose = require('mongoose');
const Tank = require('./models/Tank');
const Pump = require('./models/Pump');
const Product = require('./models/Product');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Products:', await Product.countDocuments());
  console.log('Tanks:', await Tank.countDocuments());
  console.log('Pumps:', await Pump.countDocuments());
  
  const tanks = await Tank.find().populate('product');
  console.log('\nTanks:');
  tanks.forEach(t => console.log(`- ${t.name}: ${t.product?.name || 'N/A'}`));
  
  const pumps = await Pump.find().populate('product');
  console.log('\nPumps:');
  pumps.forEach(p => console.log(`- ${p.pumpNumber}: ${p.product?.name || 'N/A'}`));
  
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
