import 'dotenv/config';
import { connectDB } from '../server/src/config/db.js';
import { SearchIndexer } from '../server/src/services/search/SearchIndexer.js';
import { Assessment } from '../server/src/models/career/Assessment.js';
import { User } from '../server/src/models/User.js';
import { Job } from '../server/src/models/Job.js';
import bcrypt from 'bcryptjs';

await connectDB();

const published = await Assessment.countDocuments({ status: 'published' });
console.log('published_assessments', published);

const admins = await User.find({ role: { $in: ['Admin', 'SuperAdmin', 'Editor', 'Moderator'] } })
  .select('email role')
  .limit(10)
  .lean();
console.log('admins', JSON.stringify(admins));

const jobs = await Job.countDocuments({ status: 'active' });
console.log('active_jobs', jobs);

let admin = await User.findOne({ email: 'verify-admin@edurozgaar.local' });
if (!admin) {
  const hash = await bcrypt.hash('VerifyAdmin!23456', 10);
  admin = await User.create({
    name: 'Verify Admin',
    email: 'verify-admin@edurozgaar.local',
    password: hash,
    role: 'Admin',
  });
  console.log('created_verify_admin', admin.email);
} else {
  console.log('verify_admin_exists', admin.email, admin.role);
}

const results = await SearchIndexer.rebuildAll();
const indexed = results.reduce((n, r) => n + (r.indexed || 0), 0);
console.log('reindex_total', indexed);
console.log('reindex_by_type', results);
process.exit(0);
