const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function createDefaultAdmin() {
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@mail.com' });
    
    if (existingAdmin) {
      console.log('Default admin user already exists');
      return;
    }

    // Create new admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@mail.com',
      password: 'admin@1234',
      role: 'admin',
      balance: 1000000, // Give admin a large balance
      firstName: 'System',
      lastName: 'Administrator'
    });

    await adminUser.save();
    console.log('Default admin user created successfully');
    console.log('Email: admin@mail.com');
    console.log('Password: admin@1234');
    
  } catch (error) {
    console.error('Error creating default admin user:', error);
  }
}

module.exports = { createDefaultAdmin };

