import { Job } from '../models/Job.js';
import { ResumeScan } from '../models/ResumeScan.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { cacheGet, cacheSet } from '../config/redis.js';
import { onResumeAnalysisComplete } from '../services/automationService.js';
import { validateResumeBuffer } from '../utils/fileValidation.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const CACHE_TTL = 300;
const CACHE_PREFIX = 'resume:match:';

/**
 * Placeholder NLP extraction. In production use pdf-parse + mammoth for DOCX + NLP/lib for skills.
 */
function extractFromFile(buffer, mimetype) {
  const skills = ['Communication', 'Teamwork', 'Microsoft Office', 'Problem Solving', 'Leadership', 'Project Management', 'Data Analysis', 'Writing'];
  const education = ['Bachelor\'s degree', 'Relevant field'];
  const experience = ['2+ years experience', 'Relevant industry'];
  return { skills, education, experience };
}

/**
 * Match jobs by overlapping skills/category. Placeholder: simple text match.
 */
async function matchJobs(skills, limit = 10) {
  if (!skills || !skills.length) {
    return Job.find({ status: 'active' }).sort({ views: -1, createdAt: -1 }).limit(limit).lean();
  }
  const or = skills.slice(0, 10).map((s) => ({ $or: [{ title: new RegExp(s, 'i') }, { category: new RegExp(s, 'i') }, { requirements: new RegExp(s, 'i') }] }));
  const jobs = await Job.find({ status: 'active', $or: or.length ? or : [{}] }).sort({ views: -1 }).limit(limit).lean();
  return jobs.length >= limit ? jobs : await Job.find({ status: 'active', _id: { $nin: jobs.map((j) => j._id) } }).sort({ createdAt: -1 }).limit(limit - jobs.length).lean().then((extra) => [...jobs, ...extra]);
}

/**
 * Build suggestions to improve match: missing skills from top jobs, add more keywords, etc.
 */
function buildSuggestions(extracted, jobs, matchedSkills) {
  const suggestions = [];
  if (!extracted.skills || extracted.skills.length < 3) {
    suggestions.push('Add more skills to your resume for better matches.');
  }
  const allJobReqs = new Set();
  jobs.forEach((j) => {
    (j.requirements || []).forEach((r) => allJobReqs.add(String(r).toLowerCase()));
    if (j.category) allJobReqs.add(String(j.category).toLowerCase());
  });
  const userSkillsLower = new Set((extracted.skills || []).map((s) => s.toLowerCase()));
  const missing = [...allJobReqs].filter((r) => !userSkillsLower.has(r) && r.length > 2).slice(0, 5);
  if (missing.length) {
    suggestions.push('Consider highlighting these skills to match more jobs: ' + missing.join(', ') + '.');
  }
  const lowMatchCount = (matchedSkills || []).filter((m) => !m.matched || m.matched.length === 0).length;
  if (lowMatchCount > 5) {
    suggestions.push('Expand your experience section with measurable achievements to improve job fit.');
  }
  if (suggestions.length === 0) suggestions.push('Your resume is well aligned with current listings. Keep it updated.');
  return suggestions;
}

export const analyzeResume = asyncHandler(async (req, res) => {
  if (!req.file || !req.file.buffer) return res.status(400).json({ error: 'No file uploaded' });
  const mimetype = await validateResumeBuffer(req.file.buffer, req.file.mimetype);
  if (req.file.size > MAX_FILE_SIZE) return res.status(400).json({ error: 'File too large (max 5MB)' });

  const userId = req.user?.userId;
  const extracted = extractFromFile(req.file.buffer, mimetype);
  const cacheKey = userId ? `${CACHE_PREFIX}${userId}:${extracted.skills?.length || 0}` : null;
  let jobs; let matchedSkills;
  if (cacheKey) {
    const cached = await cacheGet(cacheKey);
    if (cached?.jobs?.length) {
      jobs = cached.jobs;
      matchedSkills = cached.matchedSkills || [];
    }
  }
  if (!jobs || !jobs.length) {
    jobs = await matchJobs(extracted.skills, 10);
    matchedSkills = jobs.map((job) => {
      const jobSkills = [...(job.requirements || []), job.category, job.title].filter(Boolean).map((s) => String(s).toLowerCase());
      const found = (extracted.skills || []).filter((s) => jobSkills.some((js) => js.includes(s.toLowerCase())));
      return { jobId: job._id, matched: found.length ? found : ['Relevant background'] };
    });
    if (cacheKey) await cacheSet(cacheKey, { jobs, matchedSkills }, CACHE_TTL);
  }

  const suggestions = buildSuggestions(extracted, jobs, matchedSkills);

  if (userId) {
    const scan = await ResumeScan.create({
      userId,
      type: 'scan',
      extracted: { skills: extracted.skills, education: extracted.education, experience: extracted.experience },
      jobIds: jobs.map((j) => j._id),
      matchedSkills: matchedSkills.map((m) => ({ jobId: m.jobId, matched: m.matched })),
      suggestions,
    });
    onResumeAnalysisComplete({ userId, scanId: scan._id, score: null }).catch(() => {});
  }

  res.json({
    extracted: {
      skills: extracted.skills,
      education: extracted.education,
      experience: extracted.experience,
    },
    jobs,
    matchedSkills,
    suggestions,
  });
});

export const getScanHistory = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const limit = Math.min(20, parseInt(req.query.limit, 10) || 10);
  const scans = await ResumeScan.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
  res.json({ data: scans });
});
