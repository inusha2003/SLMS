import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

const result = dotenv.config();
console.log('ENV loaded:', result.parsed);
console.log('MONGO_URI:', process.env.MONGO_URI);

const seedAdmin = async () => {
  try {
    const uri = process.env.MONGO_URI;

    if (!uri) {
      console.error('MONGO_URI is undefined! Check .env file');
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const exists = await User.findOne({ email: 'admin@smartlms.com' });
    if (exists) {
      console.log('Admin already exists - skipping seed');
      process.exit(0);
    }

    await User.create({
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@smartlms.com',
      password: 'admin123',
      role: 'Admin',
      isProfileComplete: true,
      isActive: true,
    });

    console.log('✅  Admin seeded');
    console.log('   Email:    admin@smartlms.com');
    console.log('   Password: admin123');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seedAdmin();