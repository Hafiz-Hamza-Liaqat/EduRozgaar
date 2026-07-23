/**
 * Phase-9 seed: internships, webinars, intl scholarships, universities, badges, sample data.
 * Run from server: node src/scripts/seedPhase9.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { Internship } from '../models/Internship.js';
import { Webinar } from '../models/Webinar.js';
import { IntlScholarship } from '../models/IntlScholarship.js';
import { University } from '../models/University.js';
import { BadgeDefinition } from '../models/BadgeDefinition.js';
import { User } from '../models/User.js';
import { slugify } from '../utils/slugify.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/edurozgaar';

const INTERNSHIPS = [
  { title: 'Software Development Intern', organization: 'Tech Solutions Pakistan', location: 'Lahore', province: 'Punjab', duration: '3 months', skillset: ['JavaScript', 'React', 'Node.js'] },
  { title: 'Marketing Intern', organization: 'Digital Agency Co', location: 'Karachi', province: 'Sindh', duration: '2 months', skillset: ['Digital Marketing', 'SEO', 'Content Writing'] },
  { title: 'Data Analyst Intern', organization: 'DataPro Analytics', location: 'Islamabad', province: 'Punjab', duration: '4 months', skillset: ['Python', 'SQL', 'Excel'] },
  { title: 'Graphic Design Intern', organization: 'Creative Studio', location: 'Lahore', province: 'Punjab', duration: '2 months', skillset: ['Adobe Illustrator', 'Photoshop', 'UI/UX'] },
  { title: 'HR Intern', organization: 'HR Solutions Ltd', location: 'Karachi', province: 'Sindh', duration: '3 months', skillset: ['Recruitment', 'Communication'] },
  { title: 'Civil Engineering Intern', organization: 'BuildRight Consultants', location: 'Lahore', province: 'Punjab', duration: '6 months', skillset: ['AutoCAD', 'MS Project'] },
  { title: 'Content Writer Intern', organization: 'EduRozgaar', location: 'Remote', province: 'Punjab', duration: '2 months', skillset: ['Writing', 'Research', 'SEO'] },
  { title: 'Backend Developer Intern', organization: 'StartupPK', location: 'Lahore', province: 'Punjab', duration: '3 months', skillset: ['Node.js', 'MongoDB', 'API'] },
  { title: 'Finance Intern', organization: 'First Capital', location: 'Karachi', province: 'Sindh', duration: '4 months', skillset: ['Excel', 'Financial Analysis'] },
  { title: 'Teaching Assistant Intern', organization: 'Punjab University', location: 'Lahore', province: 'Punjab', duration: '6 months', skillset: ['Teaching', 'Research'] },
  { title: 'Mobile App Intern', organization: 'AppWorks', location: 'Islamabad', province: 'Punjab', duration: '3 months', skillset: ['React Native', 'Flutter'] },
  { title: 'Social Media Intern', organization: 'Brandify', location: 'Lahore', province: 'Punjab', duration: '2 months', skillset: ['Social Media', 'Content Creation'] },
  { title: 'QA Engineer Intern', organization: 'QualityFirst', location: 'Karachi', province: 'Sindh', duration: '3 months', skillset: ['Testing', 'Automation', 'Selenium'] },
  { title: 'Legal Research Intern', organization: 'Legal Associates', location: 'Lahore', province: 'Punjab', duration: '4 months', skillset: ['Legal Research', 'Drafting'] },
  { title: 'Supply Chain Intern', organization: 'LogiPak', location: 'Karachi', province: 'Sindh', duration: '3 months', skillset: ['Logistics', 'Inventory'] },
  { title: 'UI/UX Design Intern', organization: 'DesignHub', location: 'Lahore', province: 'Punjab', duration: '3 months', skillset: ['Figma', 'Prototyping'] },
  { title: 'DevOps Intern', organization: 'CloudTech', location: 'Islamabad', province: 'Punjab', duration: '4 months', skillset: ['Docker', 'AWS', 'CI/CD'] },
  { title: 'Journalism Intern', organization: 'Daily News', location: 'Karachi', province: 'Sindh', duration: '2 months', skillset: ['Writing', 'Reporting'] },
  { title: 'Research Intern', organization: 'LUMS', location: 'Lahore', province: 'Punjab', duration: '6 months', skillset: ['Research', 'Data Analysis'] },
  { title: 'Sales Intern', organization: 'RetailMax', location: 'Lahore', province: 'Punjab', duration: '2 months', skillset: ['Sales', 'Communication'] },
];

const WEBINARS = [
  { title: 'How to Crack PPSC Exams', scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), durationMinutes: 60 },
  { title: 'Scholarship Application Tips 2025', scheduledAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), durationMinutes: 45 },
  { title: 'Resume Building Workshop', scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), durationMinutes: 60 },
  { title: 'Career in Tech: Panel Discussion', scheduledAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), durationMinutes: 90 },
  { title: 'FPSC CSS Preparation Strategy', scheduledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), durationMinutes: 75, status: 'recorded', recordingUrl: 'https://example.com/recorded/fpsc-workshop' },
];

const BADGE_DEFINITIONS = [
  { badgeType: 'job_applied', name: 'First Application', description: 'Applied to your first job', points: 5 },
  { badgeType: 'internship_applied', name: 'Intern Seeker', description: 'Applied to an internship', points: 5 },
  { badgeType: 'quiz_completed', name: 'Quiz Master', description: 'Completed a practice quiz', points: 10 },
  { badgeType: 'webinar_registered', name: 'Learner', description: 'Registered for a webinar', points: 5 },
  { badgeType: 'webinar_attended', name: 'Workshop Attendee', description: 'Attended a webinar', points: 15 },
  { badgeType: 'resume_scan', name: 'Resume Ready', description: 'Used the resume scanner', points: 5 },
  { badgeType: 'cover_letter', name: 'Cover Letter Pro', description: 'Generated a cover letter', points: 5 },
  { badgeType: 'referral', name: 'Referral Champion', description: 'Referred a friend', points: 20 },
  { badgeType: 'early_adopter', name: 'Early Adopter', description: 'Joined EduRozgaar early', points: 10 },
  { badgeType: 'streak_7', name: 'Week Streak', description: '7-day activity streak', points: 15 },
];

async function seed() {
  await mongoose.connect(MONGO_URI);

  for (let i = 0; i < INTERNSHIPS.length; i++) {
    const d = INTERNSHIPS[i];
    const slug = slugify(d.title) + '-' + Date.now().toString(36) + '-' + i;
    await Internship.findOneAndUpdate(
      { title: d.title, organization: d.organization },
      {
        $setOnInsert: {
          title: d.title,
          slug,
          organization: d.organization,
          location: d.location,
          province: d.province,
          duration: d.duration,
          skillset: d.skillset,
          description: `Internship opportunity: ${d.title} at ${d.organization}. Apply now.`,
          status: 'active',
        },
      },
      { upsert: true }
    );
  }
  console.log('Internships:', INTERNSHIPS.length);

  const universityData = [
    { name: 'University of Oxford', country: 'UK', website: 'https://www.oxford.ac.uk' },
    { name: 'MIT', country: 'USA', website: 'https://www.mit.edu' },
    { name: 'University of Melbourne', country: 'Australia', website: 'https://www.unimelb.edu.au' },
    { name: 'TU Munich', country: 'Germany', website: 'https://www.tum.de' },
    { name: 'National University of Singapore', country: 'Singapore', website: 'https://www.nus.edu.sg' },
  ];
  const universityIds = [];
  for (const u of universityData) {
    const doc = await University.findOneAndUpdate(
      { name: u.name },
      { $setOnInsert: { ...u, status: 'active' } },
      { upsert: true, new: true }
    );
    universityIds.push(doc._id);
  }

  const countries = ['UK', 'USA', 'Australia', 'Germany', 'Canada', 'Singapore'];
  for (let i = 0; i < 15; i++) {
    const c = countries[i % countries.length];
    await IntlScholarship.findOneAndUpdate(
      { title: `International Scholarship ${i + 1} - ${c}` },
      {
        $setOnInsert: {
          title: `International Scholarship ${i + 1} - ${c}`,
          country: c,
          university: c === 'UK' ? 'University of Oxford' : c === 'USA' ? 'MIT' : undefined,
          universityId: universityIds[i % universityIds.length],
          deadline: new Date(Date.now() + (30 + i * 5) * 24 * 60 * 60 * 1000),
          description: 'Full scholarship for international students.',
          eligibility: ['Bachelor degree', 'English proficiency'],
          status: 'active',
        },
      },
      { upsert: true }
    );
  }
  console.log('Intl scholarships: 15, Universities: 5');

  for (const w of WEBINARS) {
    await Webinar.findOneAndUpdate(
      { title: w.title },
      {
        $setOnInsert: {
          title: w.title,
          scheduledAt: w.scheduledAt,
          durationMinutes: w.durationMinutes || 60,
          status: w.status || 'scheduled',
          recordingUrl: w.recordingUrl,
        },
      },
      { upsert: true }
    );
  }
  console.log('Webinars:', WEBINARS.length);

  for (const b of BADGE_DEFINITIONS) {
    await BadgeDefinition.findOneAndUpdate({ badgeType: b.badgeType }, { $setOnInsert: b }, { upsert: true });
  }
  console.log('Badge definitions:', BADGE_DEFINITIONS.length);

  const users = await User.find({ role: 'User' }).limit(10).lean();
  for (let i = 0; i < users.length; i++) {
    await User.updateOne({ _id: users[i]._id }, { $set: { totalPoints: (i + 1) * 10 } });
  }
  console.log('Leaderboard sample: updated', users.length, 'users with points');

  await mongoose.disconnect();
  console.log('Phase-9 seed done.');
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
