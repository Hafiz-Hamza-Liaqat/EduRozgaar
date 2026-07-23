import { asyncHandler } from '../utils/asyncHandler.js';
import { Employer } from '../models/Employer.js';
import { Company } from '../models/Company.js';
import { University } from '../models/University.js';
import { Job } from '../models/Job.js';
import { Admission } from '../models/Admission.js';
import { Scholarship } from '../models/Scholarship.js';
import { ForeignStudy } from '../models/ForeignStudy.js';
import {
  getRequestLocale,
  findLocalizedBySlug,
  withListLocaleFilter,
} from '../utils/localeQuery.js';

function employerPublicFields(e) {
  return {
    _id: e._id,
    companyName: e.companyName,
    slug: e.slug,
    website: e.website,
    companyDescription: e.companyDescription,
    logoUrl: e.logoUrl,
    bannerUrl: e.bannerUrl,
    industry: e.industry,
    companySize: e.companySize,
    location: e.location,
    city: e.city,
    province: e.province,
    socialLinks: e.socialLinks,
    verified: e.verified,
    verificationLevel: e.verificationLevel || (e.verified ? 'verified' : 'basic'),
    totalJobsPosted: e.totalJobsPosted,
    createdAt: e.createdAt,
  };
}

export const getEmployerProfile = asyncHandler(async (req, res) => {
  const employer = await Employer.findOne({
    slug: req.params.slug,
    isPublicProfile: { $ne: false },
  }).select('-password -email');

  if (!employer) {
    return res.status(404).json({ error: 'Employer profile not found' });
  }

  const [activeJobs, recentJobs, closedJobs] = await Promise.all([
    Job.find({ employerId: employer._id, status: 'active' }).sort({ createdAt: -1 }).limit(20).lean(),
    Job.find({ $or: [{ employerId: employer._id }, { company: employer.companyName }], status: 'active' })
      .sort({ createdAt: -1 }).limit(10).lean(),
    Job.find({ $or: [{ employerId: employer._id }, { company: employer.companyName }], status: 'closed' })
      .sort({ updatedAt: -1 }).limit(5).lean(),
  ]);

  const allCompanyJobs = await Job.find({
    $or: [{ employerId: employer._id }, { company: employer.companyName }],
  }).select('status').lean();

  res.json({
    profile: employerPublicFields(employer),
    stats: {
      totalJobs: allCompanyJobs.length,
      activeJobs: allCompanyJobs.filter((j) => j.status === 'active').length,
      closedJobs: allCompanyJobs.filter((j) => j.status === 'closed').length,
    },
    activeJobs,
    recentJobs,
    hiringHistory: closedJobs,
  });
});

export const getCompanyProfile = asyncHandler(async (req, res) => {
  const company = await Company.findOne({ slug: req.params.slug, status: 'active' }).lean();
  if (!company) {
    return res.status(404).json({ error: 'Company not found' });
  }

  let employer = null;
  if (company.employerId) {
    employer = await Employer.findById(company.employerId).select('-password -email').lean();
  }

  const jobs = await Job.find({ company: company.name, status: 'active' }).sort({ createdAt: -1 }).limit(20).lean();
  const allJobs = await Job.find({ company: company.name }).select('status createdAt').lean();

  res.json({
    company,
    employer,
    stats: {
      totalJobs: allJobs.length,
      activeJobs: allJobs.filter((j) => j.status === 'active').length,
      closedJobs: allJobs.filter((j) => j.status === 'closed').length,
    },
    activeJobs: jobs,
    openPositions: jobs,
    recentJobs: jobs.slice(0, 10),
  });
});

export const getUniversityProfile = asyncHandler(async (req, res) => {
  const locale = getRequestLocale(req);
  const university = await findLocalizedBySlug(
    University,
    req.params.slug,
    { status: 'active' },
    locale,
  );
  if (!university) {
    return res.status(404).json({ error: 'University not found' });
  }

  const namePattern = new RegExp(university.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const docLocale = university.locale || locale;
  const localizedActive = (extra) => withListLocaleFilter({ status: 'active', ...extra }, docLocale);

  const [admissions, scholarships, foreignStudies] = await Promise.all([
    Admission.find(localizedActive({
      $or: [{ institution: namePattern }, { university: namePattern }],
    })).sort({ deadline: 1 }).limit(15).lean(),
    Scholarship.find(localizedActive({
      $or: [{ university: namePattern }, { provider: /HEC/i }],
    })).sort({ deadline: 1 }).limit(10).lean(),
    ForeignStudy.find({ status: 'active' }).sort({ createdAt: -1 }).limit(8).lean(),
  ]);

  res.json({
    university,
    admissions,
    scholarships,
    foreignStudies,
  });
});

export const listCompanies = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);
  const filter = { status: 'active' };
  if (req.query.industry) filter.industry = new RegExp(req.query.industry, 'i');

  const [data, total] = await Promise.all([
    Company.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    Company.countDocuments(filter),
  ]);

  res.json({ data, page, limit, total, pages: Math.ceil(total / limit) });
});

export const listUniversities = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);
  const filter = { status: 'active', country: 'Pakistan' };

  const [data, total] = await Promise.all([
    University.find(filter).sort({ ranking: 1, name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    University.countDocuments(filter),
  ]);

  res.json({ data, page, limit, total, pages: Math.ceil(total / limit) });
});
