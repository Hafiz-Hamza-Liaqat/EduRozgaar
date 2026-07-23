import 'dotenv/config';
import { connectDB } from '../config/db.js';
import { Job } from '../models/Job.js';

await connectDB();
const types = await Job.aggregate([{ $group: { _id: '$applyType', n: { $sum: 1 } } }]);
console.log(types);
const internal = await Job.findOne({ applyType: 'internal', status: 'active' }).select('title applyType slug').lean();
console.log('internal', internal);
const sample = await Job.find({ status: 'active' }).select('title applyType').limit(5).lean();
console.log('sample', sample);
process.exit(0);
