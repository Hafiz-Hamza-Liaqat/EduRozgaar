/**
 * Phase-5 seed: newsletter subscribers, user bookmarks, view counts for trending.
 * Run after seedUsers + seedPhase4. From server dir: node src/scripts/seedPhase5.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Job } from '../models/Job.js';
import { Scholarship } from '../models/Scholarship.js';
import { Admission } from '../models/Admission.js';
import { NewsletterSubscriber } from '../models/NewsletterSubscriber.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/edurozgaar';

const STUDENT_EMAILS = ['ali@example.com', 'sara@example.com', 'hassan@example.com', 'fatima@example.com', 'omar@example.com'];

const NEWSLETTER_EMAILS = [
  'student1@example.com',
  'student2@example.com',
  'subscriber@test.com',
  'alerts@edu.pk',
  'demo@edurozgaar.pk',
];

async function seed() {
  await mongoose.connect(MONGO_URI);

  const jobs = await Job.find({ status: 'active' }).limit(15).lean();
  const scholarships = await Scholarship.find({ status: 'active' }).limit(10).lean();
  const admissions = await Admission.find({ status: 'active' }).limit(10).lean();

  for (const email of NEWSLETTER_EMAILS) {
    await NewsletterSubscriber.findOneAndUpdate(
      { email },
      { email, subscribed: true, frequency: 'weekly' },
      { upsert: true }
    );
  }
  console.log('Newsletter subscribers:', NEWSLETTER_EMAILS.length);

  for (let i = 0; i < STUDENT_EMAILS.length; i++) {
    const user = await User.findOne({ email: STUDENT_EMAILS[i] });
    if (!user) continue;
    const jobIds = jobs.slice(i * 2, i * 2 + 4).map((j) => j._id);
    const scholarshipIds = scholarships.slice(i, i + 2).map((s) => s._id);
    const admissionIds = admissions.slice(i, i + 2).map((a) => a._id);
    user.savedJobs = [...new Set([...(user.savedJobs || []), ...jobIds])].slice(0, 10);
    user.savedScholarships = [...new Set([...(user.savedScholarships || []), ...scholarshipIds])].slice(0, 10);
    user.savedAdmissions = [...new Set([...(user.savedAdmissions || []), ...admissionIds])].slice(0, 10);
    user.recentlyViewedJobs = jobIds.slice(0, 5);
    user.recentlyViewedScholarships = scholarshipIds.slice(0, 3);
    user.recentlyViewedAdmissions = admissionIds.slice(0, 3);
    await user.save();
    console.log('Updated bookmarks for', user.email);
  }

  for (let i = 0; i < jobs.length; i++) {
    await Job.findByIdAndUpdate(jobs[i]._id, { $inc: { views: Math.floor(Math.random() * 80) + 10 } });
  }
  for (let i = 0; i < scholarships.length; i++) {
    await Scholarship.findByIdAndUpdate(scholarships[i]._id, { $inc: { views: Math.floor(Math.random() * 50) + 5 } });
  }
  for (let i = 0; i < admissions.length; i++) {
    await Admission.findByIdAndUpdate(admissions[i]._id, { $inc: { views: Math.floor(Math.random() * 40) + 5 } });
  }
  console.log('Updated view counts for trending.');

  await mongoose.disconnect();
  console.log('Phase-5 seed done.');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
