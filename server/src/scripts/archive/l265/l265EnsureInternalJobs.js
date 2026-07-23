/**
 * L.2.6.5 — Ensure Beta has internal apply jobs (launch seed was 100% external).
 */
import 'dotenv/config';
import { connectDB } from '../../config/db.js';
import { Job } from '../../models/Job.js';

await connectDB();

const internalBefore = await Job.countDocuments({ applyType: 'internal', status: 'active' });
console.log('internal_before', internalBefore);

// Flip a deterministic set of private/internship jobs to internal for Apply → Tracker demos
const candidates = await Job.find({
  status: 'active',
  applyType: 'external',
  jobType: { $in: ['Private', 'Internship'] },
})
  .sort({ createdAt: -1 })
  .limit(40)
  .select('_id title')
  .lean();

if (candidates.length) {
  const ids = candidates.map((j) => j._id);
  const res = await Job.updateMany(
    { _id: { $in: ids } },
    { $set: { applyType: 'internal', applicationLink: null } },
  );
  console.log('flipped_to_internal', res.modifiedCount, 'samples', candidates.slice(0, 5).map((j) => j.title));
} else {
  console.log('no candidates to flip');
}

const internalAfter = await Job.countDocuments({ applyType: 'internal', status: 'active' });
console.log('internal_after', internalAfter);
process.exit(0);
