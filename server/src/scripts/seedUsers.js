/**
 * Seed sample users for Phase-2 testing.
 * Run: node src/scripts/seedUsers.js (from server dir, with MONGO_URI set)
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/User.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/edurozgaar';

const STUDENTS = [
  { name: 'Ali Khan', email: 'ali@example.com', password: 'Test1234', role: 'User', province: 'Punjab', interests: ['Software', 'Scholarships', 'Admissions'] },
  { name: 'Sara Ahmed', email: 'sara@example.com', password: 'Test1234', role: 'User', province: 'Sindh', interests: ['Data Science', 'Scholarships'] },
  { name: 'Hassan Raza', email: 'hassan@example.com', password: 'Test1234', role: 'User', province: 'KPK', interests: ['Teaching', 'Admissions', 'Foreign Studies'] },
  { name: 'Fatima Noor', email: 'fatima@example.com', password: 'Test1234', role: 'User', province: 'Punjab', interests: ['Medicine', 'Scholarships'] },
  { name: 'Omar Sheikh', email: 'omar@example.com', password: 'Test1234', role: 'User', province: 'Balochistan', interests: ['Engineering', 'Jobs', 'Admissions'] },
];

const ADMIN = { name: 'Admin User', email: 'admin@strideto.com', password: 'Admin1234', role: 'Admin', province: '', interests: [] };

async function seed() {
  await mongoose.connect(MONGO_URI);
  const existing = await User.countDocuments();
  if (existing > 0) {
    console.log('Users already exist. Skip seed or delete collection first.');
    await mongoose.disconnect();
    process.exit(0);
    return;
  }
  for (const s of STUDENTS) {
    await User.create(s);
    console.log('Created student:', s.email);
  }
  await User.create(ADMIN);
  console.log('Created admin:', ADMIN.email);
  await mongoose.disconnect();
  console.log('Seed done.');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
