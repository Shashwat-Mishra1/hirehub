require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const email = process.env.ADMIN_EMAIL;
  const exists = await User.findOne({ email });

  if (exists) {
    console.log('Admin already exists');
  } else {
    await User.create({ name: 'Admin', email, password: process.env.ADMIN_PASSWORD, role: 'admin' });
    console.log('Admin created:', email);
  }

  await mongoose.disconnect();
})();