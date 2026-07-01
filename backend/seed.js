require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Tank = require('./models/Tank');
const Pump = require('./models/Pump');
const Supplier = require('./models/Supplier');
const Shift = require('./models/Shift');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    if (!await User.findOne({ email: process.env.ADMIN_EMAIL || 'admin@fueltrack.ng' })) {
      await User.create({ 
        fullName: 'Admin', 
        email: process.env.ADMIN_EMAIL || 'admin@fueltrack.ng', 
        password: process.env.ADMIN_PASSWORD || 'Admin@123456', 
        role: 'Super Admin' 
      });
      console.log(`✅ Admin created: ${process.env.ADMIN_EMAIL || 'admin@fueltrack.ng'} / ${process.env.ADMIN_PASSWORD || 'Admin@123456'}`);
    }

    const admin = await User.findOne({ email: process.env.ADMIN_EMAIL || 'admin@fueltrack.ng' });
    if (!await Shift.findOne({ status: 'Open' })) {
      await Shift.create({ type: 'Morning', status: 'Open', openedBy: admin._id });
      console.log('✅ Default open shift created');
    }

    const products = [
      { name: 'PMS', code: 'PMS-001', sellingPrice: 750, costPrice: 650 },
      { name: 'AGO', code: 'AGO-001', sellingPrice: 1200, costPrice: 1000 },
      { name: 'DPK', code: 'DPK-001', sellingPrice: 850, costPrice: 720 }
    ];

    for (const p of products) {
      if (!await Product.findOne({ code: p.code })) {
        await Product.create(p);
        console.log(`✅ Product: ${p.name}`);
      }
    }

    const pms = await Product.findOne({ code: 'PMS-001' });
    const ago = await Product.findOne({ code: 'AGO-001' });
    const dpk = await Product.findOne({ code: 'DPK-001' });

    // Create 5 tanks with specific configuration: 3 PMS, 1 AGO, 1 DPK
    const tanks = [
      { name: 'Tank 1', capacity: 40000, product: pms._id, currentStock: 20000 },
      { name: 'Tank 2', capacity: 40000, product: pms._id, currentStock: 25000 },
      { name: 'Tank 3', capacity: 40000, product: pms._id, currentStock: 22000 },
      { name: 'Tank 4', capacity: 35000, product: ago._id, currentStock: 18000 },
      { name: 'Tank 5', capacity: 30000, product: dpk._id, currentStock: 15000 } // Kerosene
    ];

    for (const t of tanks) {
      if (!await Tank.findOne({ name: t.name })) {
        await Tank.create(t);
        console.log(`✅ ${t.name} created`);
      }
    }

    const tank1 = await Tank.findOne({ name: 'Tank 1' });
    const tank2 = await Tank.findOne({ name: 'Tank 2' });
    const tank3 = await Tank.findOne({ name: 'Tank 3' });
    const tank4 = await Tank.findOne({ name: 'Tank 4' });
    const tank5 = await Tank.findOne({ name: 'Tank 5' }); // Kerosene tank

    // Create 8 pumps: 6 for PMS, 1 for AGO, 1 for DPK
    const pumps = [
      { pumpNumber: 'Pump 1', tank: tank1._id, product: pms._id },
      { pumpNumber: 'Pump 2', tank: tank1._id, product: pms._id },
      { pumpNumber: 'Pump 3', tank: tank2._id, product: pms._id },
      { pumpNumber: 'Pump 4', tank: tank2._id, product: pms._id },
      { pumpNumber: 'Pump 5', tank: tank3._id, product: pms._id },
      { pumpNumber: 'Pump 6', tank: tank3._id, product: pms._id },
      { pumpNumber: 'Pump 7', tank: tank4._id, product: ago._id }, // AGO pump
      { pumpNumber: 'Pump 8', tank: tank5._id, product: dpk._id }  // DPK pump
    ];

    for (const p of pumps) {
      if (!await Pump.findOne({ pumpNumber: p.pumpNumber })) {
        await Pump.create(p);
        console.log(`✅ ${p.pumpNumber} created`);
      }
    }

    const suppliers = [
      { name: 'Dangote Oil & Gas', contactPerson: 'Mr. Okonkwo', phone: '08012345678', email: 'contact@dangote.com', productTypes: ['PMS', 'AGO', 'DPK'] },
      { name: 'Shell Nigeria', contactPerson: 'Mr. Adeyemi', phone: '08087654321', email: 'contact@shell.com.ng', productTypes: ['PMS', 'AGO'] },
      { name: 'Mobil Nigeria', contactPerson: 'Miss Chioma', phone: '08098765432', email: 'contact@mobil.com.ng', productTypes: ['DPK', 'PMS'] }
    ];

    for (const s of suppliers) {
      if (!await Supplier.findOne({ name: s.name })) {
        await Supplier.create(s);
        console.log(`✅ Supplier: ${s.name}`);
      }
    }

    console.log('\n🎉 Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

seed();