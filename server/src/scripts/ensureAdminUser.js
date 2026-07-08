/**
 * Ensure an admin user exists. Safe to run anytime (updates existing or creates).
 * Run from server dir: node src/scripts/ensureAdminUser.js
 *
 * Development default: admin@edurozgaar.pk / Admin1234
 * Production: ADMIN_EMAIL and ADMIN_PASSWORD are required (NODE_ENV=production).
 *
 * Example:
 *   ADMIN_EMAIL=admin@yourdomain.com ADMIN_PASSWORD=YourSecurePass node src/scripts/ensureAdminUser.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/User.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/edurozgaar';
const isProduction = process.env.NODE_ENV === 'production';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@edurozgaar.pk').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (isProduction ? null : 'Admin1234');

if (isProduction && !ADMIN_PASSWORD) {
  console.error('❌ ADMIN_PASSWORD is required when NODE_ENV=production.');
  console.error('   Example: ADMIN_EMAIL=admin@yourdomain.com ADMIN_PASSWORD=YourSecurePass node src/scripts/ensureAdminUser.js');
  process.exit(1);
}

async function ensureAdmin() {
  await mongoose.connect(MONGO_URI);
  let user = await User.findOne({ email: ADMIN_EMAIL }).select('+password');
  if (user) {
    user.role = 'Admin';
    if (ADMIN_PASSWORD && process.env.ADMIN_PASSWORD) {
      user.password = ADMIN_PASSWORD;
      await user.save();
    } else {
      await user.save({ validateBeforeSave: false });
    }
    console.log('Updated existing user to Admin:', ADMIN_EMAIL);
  } else {
    user = await User.create({
      name: 'Admin User',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'Admin',
    });
    console.log('Created admin user:', ADMIN_EMAIL);
  }
  console.log('Login at /auth/login then open /admin');
  await mongoose.disconnect();
  process.exit(0);
}

ensureAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
