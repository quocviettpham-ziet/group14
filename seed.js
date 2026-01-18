require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if admin user exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      password: 'admin123', // Will be hashed by pre-save hook
      email: 'admin@vov.edu.vn',
      role: 'admin',
    });

    await adminUser.save();
    console.log('Admin user created successfully');

    // Create sample student user
    const studentUser = new User({
      username: 'student',
      password: 'student123',
      email: 'student@vov.edu.vn',
      role: 'student',
    });

    await studentUser.save();
    console.log('Student user created successfully');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedDatabase();