require('dotenv').config();
const mongoose = require('mongoose');
const Tank = require('./models/Tank');
const Pump = require('./models/Pump');

const reset = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Delete all tanks and pumps
    await Tank.deleteMany({});
    await Pump.deleteMany({});
    console.log('✅ Deleted all tanks and pumps');

    console.log('\n🎉 Reset complete! Now run node seed.js to create new tanks and pumps.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

reset();
