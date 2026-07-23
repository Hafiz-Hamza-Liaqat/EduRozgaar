import 'dotenv/config';
import { connectDB } from '../config/db.js';
import { seedAssessments } from '../seed/assessments.js';

async function run() {
  try {
    await connectDB();
    await seedAssessments();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
