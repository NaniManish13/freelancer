import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { SampleDataService } from '../services/sampleDataService.js';

dotenv.config();

export async function seedDatabase() {
  console.log('Seeding FreelanceFlow database...');
  if (mongoose.connection.readyState === 0) {
    await connectDB();
  }

  const demoEmail = 'demo@freelanceflow.dev';
  const demoPassword = 'Demo123456!';

  let demoUser = await User.findOne({ email: demoEmail });
  if (!demoUser) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(demoPassword, salt);
    demoUser = await User.create({
      name: 'Alex Morgan',
      email: demoEmail,
      passwordHash,
      plan: 'PRO',
    });
    console.log(`Created default demo user: ${demoEmail} / ${demoPassword}`);
  } else {
    demoUser.plan = 'PRO';
    await demoUser.save();
    console.log(`Demo user exists: ${demoEmail}`);
  }

  // Load rich sample data for demo user
  const result = await SampleDataService.loadSampleDataForUser(demoUser._id.toString());
  console.log('Sample Data Load Result:', result.message);

  return demoUser;
}

// Run standalone if executed directly
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase()
    .then(async () => {
      console.log('Database seeding finished successfully.');
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Seeding error:', err);
      await disconnectDB();
      process.exit(1);
    });
}
