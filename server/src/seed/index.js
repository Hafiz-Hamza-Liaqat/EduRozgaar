import 'dotenv/config';
import { connectDB } from '../config/db.js';
import { seedJobs } from './jobs.js';
import { seedScholarships } from './scholarships.js';
import { seedAdmissions } from './admissions.js';
import { seedUniversities } from './universities.js';
import { seedBlogs } from './blogs.js';
import { seedAssessments } from './assessments.js';
import { SearchIndexer } from '../services/search/SearchIndexer.js';

async function run() {
  try {
    await connectDB();
    console.log('Seeding database...\n');
    await seedUniversities();
    await seedJobs();
    await seedScholarships();
    await seedAdmissions();
    await seedBlogs();
    await seedAssessments();
    console.log('\nRebuilding search index…');
    const results = await SearchIndexer.rebuildAll();
    const indexed = results.reduce((n, r) => n + (r.indexed || 0), 0);
    console.log(`Search index rebuilt: ${indexed} documents`);
    console.log('\n✅ Seed completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

run();
