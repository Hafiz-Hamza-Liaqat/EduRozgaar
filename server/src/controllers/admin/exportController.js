import XLSX from 'xlsx';
import { User } from '../../models/User.js';
import { Employer } from '../../models/Employer.js';
import { Job } from '../../models/Job.js';
import { Application } from '../../models/Application.js';
import { Scholarship } from '../../models/Scholarship.js';
import { Admission } from '../../models/Admission.js';
import { Blog } from '../../models/Blog.js';
import { Company } from '../../models/Company.js';
import { CareerArticle } from '../../models/CareerArticle.js';
import { Internship } from '../../models/Internship.js';
import { IntlScholarship } from '../../models/IntlScholarship.js';
import { University } from '../../models/University.js';
import { ContactMessage } from '../../models/ContactMessage.js';
import { Institution } from '../../models/Institution.js';
import { NewsletterSubscriber } from '../../models/NewsletterSubscriber.js';
import { ForeignStudy } from '../../models/ForeignStudy.js';
import { Payment } from '../../models/Payment.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { logAudit, auditFromRequest } from '../../services/auditService.js';
import { collectExecutiveMetrics } from './executiveDashboardController.js';
import { getPlatformInsightsDashboard } from '../../services/analytics/AnalyticsAggregator.js';
import { flattenDashboardForExport } from '../../../../shared/analytics/exportHelpers.js';

const EXPORTERS = {
  users: async () => User.find().select('-password -refreshToken -fcmToken').lean(),
  employers: async () => Employer.find().select('-password').lean(),
  jobs: async () => Job.find().lean(),
  scholarships: async () => Scholarship.find().lean(),
  admissions: async () => Admission.find().lean(),
  blogs: async () => Blog.find().lean(),
  companies: async () => Company.find().lean(),
  'career-articles': async () => CareerArticle.find().lean(),
  internships: async () => Internship.find().lean(),
  'intl-scholarships': async () => IntlScholarship.find().lean(),
  universities: async () => University.find().lean(),
  'foreign-studies': async () => ForeignStudy.find().lean(),
  'contact-messages': async () => ContactMessage.find().lean(),
  institutions: async () => Institution.find().lean(),
  'newsletter-subscribers': async () => NewsletterSubscriber.find().lean(),
  applications: async () => Application.find().populate('job', 'title').populate('user', 'email name').lean(),
  payments: async () => Payment.find().lean(),
  analytics: async () => {
    const metrics = await collectExecutiveMetrics();
    return [{ ...metrics.cards, generatedAt: metrics.generatedAt, dataSource: metrics.dataSource }];
  },
  'content-insights': async () => {
    const dashboard = await getPlatformInsightsDashboard({ range: '30d' });
    return flattenDashboardForExport({
      cards: dashboard.overview?.cards,
      topPages: dashboard.content?.topPages,
      topSearches: dashboard.search?.topSearches,
      topAds: dashboard.ads?.topAds,
    });
  },
};

function toCsv(rows) {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const header = keys.join(',');
  const lines = rows.map((row) =>
    keys.map((k) => {
      const v = row[k];
      const s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    }).join(',')
  );
  return [header, ...lines].join('\n');
}

export const exportData = asyncHandler(async (req, res) => {
  const { resource } = req.params;
  const format = (req.query.format || 'csv').toLowerCase();
  const exporter = EXPORTERS[resource];
  if (!exporter) return res.status(400).json({ error: `Unknown export resource: ${resource}` });

  const rows = await exporter();
  const flatRows = rows.map((r) => {
    const o = { ...r };
    if (o._id) o._id = String(o._id);
    return o;
  });

  await logAudit({
    ...auditFromRequest(req),
    action: 'export.data',
    targetType: resource,
    metadata: { format, count: flatRows.length },
  });

  if (format === 'xlsx' || format === 'excel') {
    const ws = XLSX.utils.json_to_sheet(flatRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, resource);
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${resource}-export.xlsx"`);
    return res.send(buf);
  }

  if (format === 'pdf') {
    const html = `<html><head><title>${resource} export</title></head><body><h1>${resource}</h1><pre>${toCsv(flatRows).replace(/</g, '&lt;')}</pre></body></html>`;
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${resource}-export.html"`);
    return res.send(html);
  }

  const csv = toCsv(flatRows);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${resource}-export.csv"`);
  res.send(csv);
});
