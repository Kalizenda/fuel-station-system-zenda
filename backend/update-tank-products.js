require('dotenv').config();
const mongoose = require('mongoose');
const Tank = require('./models/Tank');
const Product = require('./models/Product');

const update = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const pms = await Product.findOne({ code: 'PMS-001' });
    const ago = await Product.findOne({ code: 'AGO-001' });
    const dpk = await Product.findOne({ code: 'DPK-001' });

    console.log('Products found:', { pms: pms?.name, ago: ago?.name, dpk: dpk?.name });

    // Update tanks with correct products
    await Tank.updateOne({ name: 'Tank 1' }, { product: pms._id });
    await Tank.updateOne({ name: 'Tank 2' }, { product: pms._id });
    await Tank.updateOne({ name: 'Tank 3' }, { product: pms._id });
    await Tank.updateOne({ name: 'Tank 4' }, { product: ago._id });
    await Tank.updateOne({ name: 'Tank 5' }, { product: dpk._id });

    console.log('✅ Tank products updated');

    // Verify
    const tanks = await Tank.find({}).populate('product');
    console.log('Updated tanks:', tanks.map(t => ({name: t.name, capacity: t.capacity, product: t.product?.name})));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

update();
