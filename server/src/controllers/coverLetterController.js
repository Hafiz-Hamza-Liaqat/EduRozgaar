import { Job } from '../models/Job.js';
import { ResumeScan } from '../models/ResumeScan.js';
import { User } from '../models/User.js';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * AI placeholder: generate cover letter from job + user profile.
 */
function generateCoverLetterText(job, userName) {
  const name = userName || 'Candidate';
  const company = job.company || job.organization || 'your organization';
  const title = job.title || 'the position';
  return `Dear Hiring Manager,\n\nI am writing to express my interest in the ${title} position at ${company}. With my background and skills, I believe I would be a strong fit for your team.\n\nI have reviewed the role requirements and am excited about the opportunity to contribute. I would welcome the chance to discuss how my experience aligns with your needs.\n\nSincerely,\n${name}`;
}

export const generateCoverLetter = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const { jobId } = req.body || {};
  if (!jobId) return res.status(400).json({ error: 'jobId is required' });
  if (!mongoose.Types.ObjectId.isValid(jobId)) return res.status(400).json({ error: 'Invalid jobId' });
  const job = await Job.findById(jobId).lean();
  if (!job || job.status !== 'active') return res.status(404).json({ error: 'Job not found' });
  const user = await User.findById(userId).select('name').lean();
  const generated = generateCoverLetterText(job, user?.name);
  const scan = await ResumeScan.create({
    userId,
    type: 'cover_letter',
    jobId: job._id,
    generatedCoverLetter: generated,
  });
  res.status(201).json({ coverLetter: generated, id: scan._id });
});
