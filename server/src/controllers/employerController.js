import mongoose from 'mongoose';
import { Job } from '../models/Job.js';
import { Application } from '../models/Application.js';
import { onApplicationStatusChange } from '../services/automationService.js';
import { Employer } from '../models/Employer.js';
import { JobPlan } from '../models/JobPlan.js';
import { verifyPaymentForActivation } from '../services/paymentService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { jobSlug } from '../utils/slugify.js';
import { sanitizeString } from '../utils/sanitize.js';
import { stripAllHtml } from '../utils/htmlSanitize.js';
import { TalentProfileReadService } from '../services/career/TalentProfileReadService.js';

/** GET /employer/dashboard - Stats for employer dashboard */
export const getDashboard = asyncHandler(async (req, res) => {
  const employerId = req.employer.employerId;
  const [activeJobs, totalApplications, jobsWithCounts] = await Promise.all([
    Job.countDocuments({ employerId, status: 'active' }),
    Application.countDocuments({ jobId: { $in: await Job.find({ employerId }).distinct('_id') } }),
    Job.aggregate([
      { $match: { employerId: new mongoose.Types.ObjectId(employerId) } },
      { $lookup: { from: 'applications', localField: '_id', foreignField: 'jobId', as: 'apps' } },
      {
        $project: {
          _id: 1,
          title: 1,
          views: 1,
          applicationsCount: 1,
          apps: 1,
          shortlisted: { $size: { $filter: { input: '$apps', as: 'a', cond: { $eq: ['$$a.status', 'shortlisted'] } } } },
        },
      },
    ]),
  ]);
  const totalViews = jobsWithCounts.reduce((s, j) => s + (j.views || 0), 0);
  const shortlistedCandidates = jobsWithCounts.reduce((s, j) => s + (j.shortlisted || 0), 0);
  const employer = await Employer.findById(employerId).select('verificationLevel verified companyName').lean();
  res.json({
    activeJobs,
    totalApplications,
    totalViews,
    shortlistedCandidates,
    verificationLevel: employer?.verificationLevel || 'basic',
    verified: employer?.verified || false,
    jobs: jobsWithCounts.slice(0, 10).map((j) => ({
      _id: j._id,
      title: j.title,
      views: j.views || 0,
      applications: (j.apps?.length ?? 0) || (j.applicationsCount || 0),
      shortlisted: j.shortlisted || 0,
    })),
  });
});

/** GET /employer/jobs - List employer's job posts */
export const getMyJobs = asyncHandler(async (req, res) => {
  const employerId = req.employer.employerId;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const status = req.query.status; // draft | active | closed
  const filter = { employerId };
  if (status && ['draft', 'active', 'closed'].includes(status)) filter.status = status;
  const [data, total] = await Promise.all([
    Job.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Job.countDocuments(filter),
  ]);
  res.json({ data, total, page, limit });
});

/** POST /employer/jobs - Create job as draft (first job can be free) */
export const createJob = asyncHandler(async (req, res) => {
  const employerId = req.employer.employerId;
  const employer = await Employer.findById(employerId);
  if (!employer) return res.status(404).json({ error: 'Employer not found' });

  const body = req.body;
  const title = (body.jobTitle || body.title || '').trim();
  const companyName = (body.companyName || employer.companyName || '').trim();
  if (!title || !companyName) return res.status(400).json({ error: 'jobTitle and companyName are required' });

  const slug = jobSlug(title, body.location || '');
  const existingSlug = await Job.findOne({ slug });
  const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

  const isFirstJob = (employer.totalJobsPosted || 0) === 0;
  const approvalStatus = 'pending';
  const job = await Job.create({
    title,
    slug: finalSlug,
    company: companyName,
    organization: companyName,
    location: body.location,
    province: body.province,
    city: body.city,
    category: body.category,
    type: body.type || 'full-time',
    jobType: body.jobType || 'Private',
    educationRequirement: body.educationRequirement,
    experience: body.experience,
    applyType: body.applyLink || body.applyEmail ? 'external' : 'internal',
    applicationLink: body.applyLink || null,
    applyEmail: body.applyEmail || null,
    description: stripAllHtml(body.jobDescription || body.description),
    requirements: body.requirements || [],
    salaryRange: body.salaryRange,
    skillsRequired: body.skillsRequired || [],
    deadline: body.applicationDeadline ? new Date(body.applicationDeadline) : null,
    employerId,
    source: 'employer',
    status: 'draft',
    approvalStatus,
    planType: isFirstJob ? 'free' : null,
  });

  if (isFirstJob) {
    await Employer.findByIdAndUpdate(employerId, { $inc: { totalJobsPosted: 1 } });
  }

  res.status(201).json({ job, isFirstJobFree: isFirstJob });
});

/** PATCH /employer/jobs/:id - Update job (draft only or own job) */
export const updateJob = asyncHandler(async (req, res) => {
  const employerId = req.employer.employerId;
  const job = await Job.findOne({ _id: req.params.id, employerId });
  if (!job) return res.status(404).json({ error: 'Job not found' });
  const body = req.body;
  const allowed = [
    'title', 'company', 'organization', 'location', 'province', 'city', 'category', 'type', 'jobType',
    'educationRequirement', 'experience', 'applicationLink', 'applyEmail', 'description', 'requirements',
    'salaryRange', 'skillsRequired', 'deadline', 'jobTitle', 'companyName', 'jobDescription', 'applyLink', 'applicationDeadline',
  ];
  allowed.forEach((key) => {
    if (body[key] !== undefined) {
      if (key === 'jobTitle') job.title = sanitizeString(body[key]);
      else if (key === 'companyName') job.company = job.organization = sanitizeString(body[key]);
      else if (key === 'jobDescription') job.description = stripAllHtml(body[key]);
      else if (key === 'description') job.description = stripAllHtml(body[key]);
      else if (key === 'applyLink') job.applicationLink = body[key];
      else if (key === 'applicationDeadline') job.deadline = body[key] ? new Date(body[key]) : null;
      else job[key] = body[key];
    }
  });
  if (body.requirements && Array.isArray(body.requirements)) job.requirements = body.requirements;
  if (body.skillsRequired && Array.isArray(body.skillsRequired)) job.skillsRequired = body.skillsRequired;
  await job.save();
  res.json({ job });
});

/** GET /employer/plans - List job posting plans */
export const getPlans = asyncHandler(async (_req, res) => {
  const plans = await JobPlan.find({ isActive: true }).sort({ price: 1 }).lean();
  res.json({ data: plans });
});

/** POST /employer/jobs/:id/activate - Activate job (free or after verified payment) */
export const activateJob = asyncHandler(async (req, res) => {
  const employerId = req.employer.employerId;
  const job = await Job.findOne({ _id: req.params.id, employerId });
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (job.status === 'active') return res.status(400).json({ error: 'Job is already active' });

  const { planId, paymentId } = req.body;
  const plan = planId ? await JobPlan.findById(planId) : null;
  const isFreeJob = job.planType === 'free';

  if (!isFreeJob) {
    if (!plan) return res.status(400).json({ error: 'planId is required for paid activation' });
    if (plan.price > 0) {
      const verification = await verifyPaymentForActivation({
        paymentId,
        employerId,
        jobId: job._id,
        planId: plan._id,
      });
      if (!verification.ok) {
        return res.status(402).json({ error: verification.error });
      }
    }
  }

  const planType = isFreeJob ? 'free' : (plan?.slug || 'standard');
  let expiresAt = null;
  if (plan?.durationDays) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + plan.durationDays);
  }

  job.status = 'active';
  job.planId = plan?._id || job.planId;
  job.planType = planType;
  job.expiresAt = expiresAt;
  job.paidUntil = expiresAt;
  job.approvalStatus = 'pending';
  await job.save();

  res.json({ job, message: 'Job activated. It will appear after admin approval.' });
});

/** GET /employer/jobs/:id/applications - List applications for a job */
export const getJobApplications = asyncHandler(async (req, res) => {
  const employerId = req.employer.employerId;
  const job = await Job.findOne({ _id: req.params.id, employerId });
  if (!job) return res.status(404).json({ error: 'Job not found' });
  const applications = await Application.find({ jobId: job._id })
    .populate('userId', 'name email')
    .sort({ appliedDate: -1 })
    .lean();

  const enriched = await Promise.all(
    applications.map(async (app) => {
      const userId = app.userId?._id || app.userId;
      const candidate = userId
        ? await TalentProfileReadService.getCandidateCardForUser(userId)
        : null;
      return {
        ...app,
        candidate,
      };
    })
  );

  res.json({ data: enriched });
});

/** PATCH /employer/applications/:id - Update application status (shortlist, reject, interview, hired) */
export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const employerId = req.employer.employerId;
  const application = await Application.findById(req.params.id).populate('jobId');
  if (!application || application.jobId.employerId?.toString() !== employerId) {
    return res.status(404).json({ error: 'Application not found' });
  }
  const { status } = req.body;
  const allowed = ['shortlisted', 'rejected', 'interview', 'hired'];
  if (!status || !allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Use: ' + allowed.join(', ') });
  }
  application.status = status;
  await application.save();
  onApplicationStatusChange({
    applicationId: application._id,
    userId: application.userId,
    status,
    jobTitle: application.jobId?.title || 'Job',
    interviewWhen: req.body?.interviewWhen,
    interviewLink: req.body?.interviewLink,
  }).catch(() => {});
  res.json({ application });
});

/** GET /employer/analytics/:jobId - Analytics for one job */
export const getJobAnalytics = asyncHandler(async (req, res) => {
  const employerId = req.employer.employerId;
  const job = await Job.findOne({ _id: req.params.jobId, employerId }).lean();
  if (!job) return res.status(404).json({ error: 'Job not found' });
  const applicationsCount = await Application.countDocuments({ jobId: job._id });
  const views = job.views || 0;
  const conversionRate = views > 0 ? ((applicationsCount / views) * 100).toFixed(2) : 0;
  res.json({
    views: views,
    applications: applicationsCount,
    conversionRate: conversionRate + '%',
  });
});
