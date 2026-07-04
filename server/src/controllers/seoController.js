import { Job } from '../models/Job.js';
import { Scholarship } from '../models/Scholarship.js';
import { Admission } from '../models/Admission.js';
import { Blog } from '../models/Blog.js';
import { Internship } from '../models/Internship.js';
import { Exam } from '../models/Exam.js';
import { IntlScholarship } from '../models/IntlScholarship.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const SITE_URL = process.env.SITE_URL || 'https://edurozgaar.pk';
const CITIES = ['lahore', 'karachi', 'islamabad', 'rawalpindi', 'faisalabad', 'multan', 'peshawar', 'quetta', 'sialkot', 'gujranwala'];
const PROVINCES = ['punjab', 'sindh', 'khyber-pakhtunkhwa', 'balochistan', 'islamabad', 'gilgit-baltistan'];
const JOB_CATEGORIES = ['government-jobs', 'private-jobs', 'internships', 'internship-jobs'];
const SCHOLARSHIP_COUNTRIES = ['turkey', 'germany', 'china', 'uk', 'usa', 'australia', 'canada', 'hungary', 'italy'];
const JOB_SOURCE_SLUGS = ['fpsc', 'ppsc', 'nts', 'wapda'];

const STATIC_PAGES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/jobs', changefreq: 'daily', priority: '0.9' },
  { path: '/scholarships', changefreq: 'daily', priority: '0.9' },
  { path: '/admissions', changefreq: 'daily', priority: '0.9' },
  { path: '/internships', changefreq: 'daily', priority: '0.9' },
  { path: '/intl-scholarships', changefreq: 'weekly', priority: '0.8' },
  { path: '/blog', changefreq: 'weekly', priority: '0.8' },
  { path: '/exam-prep', changefreq: 'weekly', priority: '0.8' },
  { path: '/resume-builder', changefreq: 'monthly', priority: '0.7' },
  { path: '/career-guidance', changefreq: 'monthly', priority: '0.7' },
  { path: '/webinars', changefreq: 'weekly', priority: '0.7' },
  { path: '/about', changefreq: 'monthly', priority: '0.6' },
  { path: '/services', changefreq: 'monthly', priority: '0.6' },
  { path: '/contact', changefreq: 'monthly', priority: '0.6' },
  { path: '/faq', changefreq: 'monthly', priority: '0.6' },
  { path: '/help-center', changefreq: 'monthly', priority: '0.5' },
  { path: '/advertise', changefreq: 'monthly', priority: '0.5' },
  { path: '/submit-opportunity', changefreq: 'monthly', priority: '0.5' },
  { path: '/privacy-policy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
  { path: '/cookies', changefreq: 'yearly', priority: '0.3' },
  { path: '/latest-government-jobs', changefreq: 'daily', priority: '0.9' },
];

function escapeXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function formatLastmod(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function urlEntry(base, path, { changefreq = 'weekly', priority = '0.5', lastmod } = {}) {
  const loc = `${base}${path}`.replace(/([^:]\/)\/+/g, '$1');
  return { loc, changefreq, priority, lastmod: lastmod ? formatLastmod(lastmod) : undefined };
}

/**
 * GET /sitemap.xml - Comprehensive dynamic sitemap
 */
export const getSitemap = asyncHandler(async (_req, res) => {
  const base = SITE_URL.replace(/\/$/, '');
  const urlMap = new Map();

  const addUrl = (path, opts) => {
    const entry = urlEntry(base, path, opts);
    urlMap.set(entry.loc, entry);
  };

  STATIC_PAGES.forEach((p) => addUrl(p.path, p));

  JOB_SOURCE_SLUGS.forEach((src) => addUrl(`/${src}-jobs`, { changefreq: 'daily', priority: '0.8' }));
  CITIES.forEach((city) => addUrl(`/jobs-in-${city}`, { changefreq: 'daily', priority: '0.8' }));
  PROVINCES.forEach((prov) => {
    addUrl(`/jobs-in-${prov}`, { changefreq: 'daily', priority: '0.8' });
    addUrl(`/jobs/province/${prov}`, { changefreq: 'daily', priority: '0.75' });
  });
  JOB_CATEGORIES.forEach((cat) => {
    addUrl(`/${cat}`, { changefreq: 'daily', priority: '0.8' });
    addUrl(`/jobs/category/${cat}`, { changefreq: 'daily', priority: '0.75' });
  });
  SCHOLARSHIP_COUNTRIES.forEach((c) => addUrl(`/scholarships-in-${c}`, { changefreq: 'weekly', priority: '0.7' }));

  const [jobs, scholarships, admissions, blogs, internships, exams, intlScholarships] = await Promise.all([
    Job.find({ status: 'active' }).select('slug updatedAt').limit(5000).lean(),
    Scholarship.find({ status: 'active' }).select('slug updatedAt').limit(2000).lean(),
    Admission.find({ status: 'active' }).select('slug updatedAt').limit(2000).lean(),
    Blog.find({ status: 'published' }).select('slug updatedAt publishedAt').limit(2000).lean(),
    Internship.find({ status: 'active' }).select('slug updatedAt').limit(1000).lean(),
    Exam.find({ status: 'active' }).select('slug updatedAt').limit(200).lean(),
    IntlScholarship.find({ status: 'active' }).select('_id updatedAt').limit(500).lean(),
  ]);

  jobs.forEach((j) => addUrl(`/jobs/${j.slug}`, { changefreq: 'weekly', priority: '0.6', lastmod: j.updatedAt }));
  scholarships.forEach((s) => addUrl(`/scholarships/${s.slug}`, { changefreq: 'weekly', priority: '0.6', lastmod: s.updatedAt }));
  admissions.forEach((a) => addUrl(`/admissions/${a.slug}`, { changefreq: 'weekly', priority: '0.6', lastmod: a.updatedAt }));
  blogs.forEach((b) => addUrl(`/blog/${b.slug}`, { changefreq: 'monthly', priority: '0.6', lastmod: b.updatedAt || b.publishedAt }));
  internships.forEach((i) => addUrl(`/internships/${i.slug}`, { changefreq: 'weekly', priority: '0.6', lastmod: i.updatedAt }));
  exams.forEach((e) => addUrl(`/exam-prep/${e.slug}`, { changefreq: 'monthly', priority: '0.6', lastmod: e.updatedAt }));
  intlScholarships.forEach((s) => addUrl(`/intl-scholarships/${s._id}`, { changefreq: 'weekly', priority: '0.6', lastmod: s.updatedAt }));

  const urls = [...urlMap.values()];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${escapeXml(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>`;

  res.type('application/xml').send(xml);
});

const SLUG_TO_PROVINCE = {
  'khyber-pakhtunkhwa': 'Khyber Pakhtunkhwa', kpk: 'Khyber Pakhtunkhwa',
  punjab: 'Punjab', sindh: 'Sindh', balochistan: 'Balochistan', islamabad: 'Islamabad', 'gilgit-baltistan': 'Gilgit-Baltistan',
};
const SLUG_TO_JOB_TYPE = { 'government-jobs': 'Government', 'private-jobs': 'Private', internships: 'Internship', 'internship-jobs': 'Internship' };

export const getSeoJobsPage = asyncHandler(async (req, res) => {
  const slug = (req.params.slug || '').toLowerCase().replace(/\s+/g, '-');
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 24);
  const filter = { status: 'active' };
  const province = SLUG_TO_PROVINCE[slug];
  if (province) {
    filter.province = new RegExp(province, 'i');
  } else {
    filter.$or = [
      { city: new RegExp(slug.replace(/-/g, ' '), 'i') },
      { province: new RegExp(slug.replace(/-/g, ' '), 'i') },
      { location: new RegExp(slug.replace(/-/g, ' '), 'i') },
    ];
  }
  const jobs = await Job.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
  const title = province
    ? `Latest Government & Private Jobs in ${province} 2026 | EduRozgaar`
    : `Latest Jobs in ${slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} 2026 | EduRozgaar`;
  const description = `Find the latest government and private jobs in ${slug.replace(/-/g, ' ')}. Updated daily with verified opportunities.`;
  const base = SITE_URL.replace(/\/$/, '');
  res.json({
    meta: { title, description, canonical: `${base}/jobs-in-${slug}` },
    data: jobs,
    total: jobs.length,
  });
});

export const getSeoJobsByCategory = asyncHandler(async (req, res) => {
  const slug = (req.params.slug || '').toLowerCase();
  const jobType = SLUG_TO_JOB_TYPE[slug];
  if (!jobType) return res.status(404).json({ error: 'Invalid category' });
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 24);
  const jobs = await Job.find({ status: 'active', jobType }).sort({ createdAt: -1 }).limit(limit).lean();
  const title = `Latest ${jobType} in Pakistan 2026 | EduRozgaar`;
  const description = `Find the latest ${jobType.toLowerCase()} in Pakistan. Updated daily with verified opportunities.`;
  const base = SITE_URL.replace(/\/$/, '');
  res.json({
    meta: { title, description, canonical: `${base}/${slug}` },
    data: jobs,
    total: jobs.length,
  });
});

export const getSeoJobsBySource = asyncHandler(async (req, res) => {
  const source = (req.params.source || '').toLowerCase().replace(/\s+/g, '-');
  if (!JOB_SOURCE_SLUGS.includes(source)) return res.status(404).json({ error: 'Invalid source' });
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 24);
  const sourceWebsite = source.toUpperCase().replace(/-/g, ' ');
  const jobs = await Job.find({ status: 'active', sourceWebsite: new RegExp(sourceWebsite, 'i') })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  const sourceName = source.toUpperCase();
  const title = `Latest ${sourceName} Jobs in Pakistan 2026 | EduRozgaar`;
  const description = `Find the latest ${sourceName} jobs and vacancies. Apply before deadline. Updated regularly.`;
  const base = SITE_URL.replace(/\/$/, '');
  res.json({
    meta: { title, description, canonical: `${base}/${source}-jobs` },
    data: jobs,
    total: jobs.length,
  });
});

export const getLatestGovernmentJobs = asyncHandler(async (req, res) => {
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 24);
  const jobs = await Job.find({ status: 'active', jobType: 'Government' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  const title = 'Latest Government Jobs in Pakistan 2026 | FPSC, PPSC, NTS, WAPDA | EduRozgaar';
  const description = 'Find the latest government jobs in Pakistan. FPSC, PPSC, NTS, WAPDA and more. Updated every 6 hours.';
  const base = SITE_URL.replace(/\/$/, '');
  res.json({
    meta: { title, description, canonical: `${base}/latest-government-jobs` },
    data: jobs,
    total: jobs.length,
  });
});

export const getSeoScholarshipsPage = asyncHandler(async (req, res) => {
  const country = (req.params.country || '').toLowerCase().replace(/-/g, ' ');
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 24);
  const filter = { status: 'active', country: new RegExp(country, 'i') };
  const scholarships = await Scholarship.find(filter).sort({ deadline: 1 }).limit(limit).lean();
  const countryTitle = country.replace(/\b\w/g, (c) => c.toUpperCase());
  const title = `Scholarships in ${countryTitle} for Pakistani Students 2026 | EduRozgaar`;
  const description = `Find scholarships in ${countryTitle} for Pakistani students. Fully funded and partial scholarships.`;
  const base = SITE_URL.replace(/\/$/, '');
  res.json({
    meta: { title, description, canonical: `${base}/scholarships-in-${req.params.country}` },
    data: scholarships,
    total: scholarships.length,
  });
});

/**
 * GET /robots.txt - Production robots with private route exclusions
 */
export const getRobots = (_req, res) => {
  const base = SITE_URL.replace(/\/$/, '');
  const txt = `User-agent: *
Allow: /
Disallow: /auth/
Disallow: /profile
Disallow: /dashboard
Disallow: /saved-jobs
Disallow: /employer
Disallow: /admin
Disallow: /resume-analyzer
Disallow: /badges
Disallow: /exam-prep/quiz/
Disallow: /schools-and-colleges
Disallow: /foreign-studies

Sitemap: ${base}/sitemap.xml
`;
  res.type('text/plain').send(txt);
};
