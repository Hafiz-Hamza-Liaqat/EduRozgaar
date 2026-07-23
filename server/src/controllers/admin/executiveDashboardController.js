import { User } from '../../models/User.js';
import { Employer } from '../../models/Employer.js';
import { Job } from '../../models/Job.js';
import { Application } from '../../models/Application.js';
import { Scholarship } from '../../models/Scholarship.js';
import { Admission } from '../../models/Admission.js';
import { Blog } from '../../models/Blog.js';
import { CareerArticle } from '../../models/CareerArticle.js';
import { ForeignStudy } from '../../models/ForeignStudy.js';
import { ResumeTemplateCatalog } from '../../models/ResumeTemplateCatalog.js';
import { Payment } from '../../models/Payment.js';
import { AnalyticsEvent } from '../../models/AnalyticsEvent.js';
import { ContentReport } from '../../models/ContentReport.js';
import { AdSlotConfig } from '../../models/AdSlotConfig.js';
import { SupportTicket } from '../../models/SupportTicket.js';
import { Resume } from '../../models/Resume.js';
import { ResumeScan } from '../../models/ResumeScan.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getQueueStats } from '../../services/jobQueueService.js';

function startOfDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function dailySeries(days, matchFn) {
  const results = [];
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = startOfDay(daysAgo(i));
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const count = await matchFn(dayStart, dayEnd);
    results.push({
      date: dayStart.toISOString().slice(0, 10),
      value: count,
    });
  }
  return results;
}

export async function collectExecutiveMetrics() {
  const now = new Date();
  const today = startOfDay(now);
  const weekAgo = daysAgo(7);
  const monthAgo = daysAgo(30);

  const [
    totalUsers,
    activeToday,
    activeWeek,
    activeMonth,
    newUsersToday,
    newUsersMonth,
    totalEmployers,
    verifiedEmployers,
    trustedEmployers,
    totalJobs,
    pendingJobs,
    totalApplications,
    totalScholarships,
    totalAdmissions,
    totalBlogs,
    totalCareerArticles,
    totalForeignStudies,
    totalResumeTemplates,
    revenueCompleted,
    revenuePending,
    pendingReports,
    activeAds,
    monthlyRegistrations,
    dailyActiveSeries,
    applicationsSeries,
    jobsPostedSeries,
    revenueSeries,
    employerGrowthSeries,
    resumesCreated,
    resumeScans,
    resumeDownloads,
    applicationsToday,
    applicationsMonth,
    scholarshipSaves,
    admissionSaves,
    openSupportTickets,
    emailsSentToday,
    queueStats,
    deviceStats,
    browserStats,
    countryStats,
  ] = await Promise.all([
    User.countDocuments({ role: { $in: ['User', 'Editor', 'Moderator', 'Admin', 'SuperAdmin'] } }),
    AnalyticsEvent.distinct('userId', { createdAt: { $gte: today }, userId: { $ne: null } }).then((a) => a.length),
    AnalyticsEvent.distinct('userId', { createdAt: { $gte: weekAgo }, userId: { $ne: null } }).then((a) => a.length),
    AnalyticsEvent.distinct('userId', { createdAt: { $gte: monthAgo }, userId: { $ne: null } }).then((a) => a.length),
    User.countDocuments({ createdAt: { $gte: today } }),
    User.countDocuments({ createdAt: { $gte: monthAgo } }),
    Employer.countDocuments(),
    Employer.countDocuments({ verificationLevel: { $in: ['verified', 'trusted'] } }),
    Employer.countDocuments({ verificationLevel: 'trusted' }),
    Job.countDocuments({ status: 'active' }),
    Job.countDocuments({ approvalStatus: 'pending' }),
    Application.countDocuments(),
    Scholarship.countDocuments({ status: 'active' }),
    Admission.countDocuments({ status: 'active' }),
    Blog.countDocuments({ status: 'published' }),
    CareerArticle.countDocuments({ status: 'published' }),
    ForeignStudy.countDocuments({ status: 'active' }),
    ResumeTemplateCatalog.countDocuments({ status: 'active' }),
    Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then((r) => r[0]?.total ?? 0),
    Payment.countDocuments({ status: 'pending' }),
    ContentReport.countDocuments({ status: 'pending' }),
    AdSlotConfig.countDocuments({ active: true }),
    User.aggregate([
      { $match: { createdAt: { $gte: daysAgo(365) } } },
      { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
      { $limit: 12 },
    ]),
    dailySeries(30, async (start, end) => {
      const ids = await AnalyticsEvent.distinct('userId', { createdAt: { $gte: start, $lt: end }, userId: { $ne: null } });
      return ids.length;
    }),
    dailySeries(30, (start, end) => Application.countDocuments({ createdAt: { $gte: start, $lt: end } })),
    dailySeries(30, (start, end) => Job.countDocuments({ createdAt: { $gte: start, $lt: end } })),
    dailySeries(30, async (start, end) => {
      const r = await Payment.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: start, $lt: end } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      return r[0]?.total ?? 0;
    }),
    dailySeries(30, (start, end) => Employer.countDocuments({ createdAt: { $gte: start, $lt: end } })),
    Resume.countDocuments(),
    ResumeScan.countDocuments(),
    AnalyticsEvent.countDocuments({ eventType: 'resume_download', createdAt: { $gte: monthAgo } }),
    Application.countDocuments({ createdAt: { $gte: today } }),
    Application.countDocuments({ createdAt: { $gte: monthAgo } }),
    User.aggregate([{ $project: { n: { $size: { $ifNull: ['$savedScholarships', []] } } } }, { $group: { _id: null, total: { $sum: '$n' } } }]).then((r) => r[0]?.total ?? 0),
    User.aggregate([{ $project: { n: { $size: { $ifNull: ['$savedAdmissions', []] } } } }, { $group: { _id: null, total: { $sum: '$n' } } }]).then((r) => r[0]?.total ?? 0),
    SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress', 'waiting'] } }),
    AnalyticsEvent.countDocuments({ eventType: 'email_sent', createdAt: { $gte: today } }),
    getQueueStats(),
    AnalyticsEvent.aggregate([
      { $match: { createdAt: { $gte: monthAgo }, 'metadata.device': { $exists: true } } },
      { $group: { _id: '$metadata.device', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { createdAt: { $gte: monthAgo }, 'metadata.browser': { $exists: true } } },
      { $group: { _id: '$metadata.browser', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { createdAt: { $gte: monthAgo }, 'metadata.country': { $exists: true } } },
      { $group: { _id: '$metadata.country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const trafficSources = await AnalyticsEvent.aggregate([
    { $match: { eventType: 'view', createdAt: { $gte: monthAgo } } },
    { $group: { _id: '$listingType', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 8 },
  ]);

  const contentPublishing = await Promise.all([
    Blog.countDocuments({ publishedAt: { $gte: monthAgo } }),
    CareerArticle.countDocuments({ publishedAt: { $gte: monthAgo } }),
    Job.countDocuments({ createdAt: { $gte: monthAgo } }),
  ]);

  return {
    cards: {
      totalUsers,
      activeToday,
      activeWeek,
      activeMonth,
      newUsersToday,
      newUsersMonth,
      employers: totalEmployers,
      verifiedEmployers,
      trustedEmployers,
      jobs: totalJobs,
      pendingJobs,
      applications: totalApplications,
      scholarships: totalScholarships,
      admissions: totalAdmissions,
      blogs: totalBlogs,
      careerArticles: totalCareerArticles,
      foreignStudies: totalForeignStudies,
      resumeTemplates: totalResumeTemplates,
      revenue: revenueCompleted,
      pendingPayments: revenuePending,
      supportTickets: openSupportTickets,
      pendingReports,
      advertisements: activeAds,
      dau: activeToday,
      wau: activeWeek,
      mau: activeMonth,
      resumesCreated,
      resumeAiUsage: resumeScans,
      resumeDownloads,
      applicationsToday,
      applicationsMonth,
      scholarshipSaves,
      admissionSaves,
      emailsSentToday,
      queuePending: queueStats.pending,
      queueDead24h: queueStats.dead24h,
    },
    charts: {
      dailyActiveUsers: dailyActiveSeries,
      monthlyRegistrations: monthlyRegistrations.map((r) => ({
        label: `${r._id.y}-${String(r._id.m).padStart(2, '0')}`,
        value: r.count,
      })),
      applications: applicationsSeries,
      jobsPosted: jobsPostedSeries,
      revenue: revenueSeries,
      employerGrowth: employerGrowthSeries,
      trafficSources: trafficSources.map((t) => ({ label: t._id || 'unknown', value: t.count })),
      contentPublishing: [
        { label: 'Blogs', value: contentPublishing[0] },
        { label: 'Career', value: contentPublishing[1] },
        { label: 'Jobs', value: contentPublishing[2] },
      ],
      deviceStats: deviceStats.map((d) => ({ label: d._id || 'unknown', value: d.count })),
      browserStats: browserStats.map((b) => ({ label: b._id || 'unknown', value: b.count })),
      countryStats: countryStats.map((c) => ({ label: c._id || 'unknown', value: c.count })),
      queueStats,
    },
    generatedAt: now.toISOString(),
    dataSource: 'mongodb',
  };
}

export const getExecutiveDashboard = asyncHandler(async (_req, res) => {
  res.json(await collectExecutiveMetrics());
});
