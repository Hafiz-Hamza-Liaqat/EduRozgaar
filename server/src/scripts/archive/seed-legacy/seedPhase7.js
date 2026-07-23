/**
 * Phase-7 seed: analytics events, preferred language, sample data for recommendations & alerts.
 * Run after seedUsers + seedPhase4 (+ seedPhase5). From server dir: node src/scripts/seedPhase7.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Job } from '../models/Job.js';
import { Scholarship } from '../models/Scholarship.js';
import { Admission } from '../models/Admission.js';
import { AnalyticsEvent } from '../models/AnalyticsEvent.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/edurozgaar';

async function seed() {
  await mongoose.connect(MONGO_URI);

  const users = await User.find({ role: 'User' }).limit(5).lean();
  const jobs = await Job.find({ status: 'active' }).limit(10).lean();
  const scholarships = await Scholarship.find({ status: 'active' }).limit(10).lean();
  const admissions = await Admission.find({ status: 'active' }).limit(10).lean();

  for (let i = 0; i < users.length; i++) {
    await User.findByIdAndUpdate(users[i]._id, {
      preferredLanguage: i % 2 === 0 ? 'en' : 'ur',
      'notifications.telegram': i < 2,
      'notifications.whatsapp': i < 3,
      'notifications.push': true,
    });
  }
  console.log('Updated', users.length, 'users with language and channel preferences.');

  const eventTypes = ['search', 'view', 'click', 'bookmark', 'notification_sent', 'notification_opened'];
  const queries = ['software engineer', 'scholarship 2024', 'admission punjab', 'HEC', 'MBA', 'data science'];
  const now = new Date();
  const events = [];
  for (let d = 0; d < 7; d++) {
    const day = new Date(now);
    day.setDate(day.getDate() - d);
    for (let i = 0; i < 5; i++) {
      const user = users[i % users.length];
      events.push({
        eventType: 'search',
        userId: user._id,
        metadata: { query: queries[i % queries.length] },
        createdAt: new Date(day.getTime() + i * 3600000),
      });
    }
    for (let i = 0; i < 3; i++) {
      events.push({
        eventType: 'view',
        userId: users[i % users.length]._id,
        listingType: 'job',
        listingId: jobs[i % jobs.length]._id,
        createdAt: new Date(day.getTime() + i * 7200000),
      });
    }
    events.push({
      eventType: 'notification_sent',
      metadata: { target: 'province', count: 10 },
      createdAt: day,
    });
    events.push({
      eventType: 'notification_opened',
      userId: users[0]._id,
      createdAt: new Date(day.getTime() + 3600000),
    });
  }
  await AnalyticsEvent.insertMany(events);
  console.log('Inserted', events.length, 'analytics events.');

  await mongoose.disconnect();
  console.log('Phase-7 seed done.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
