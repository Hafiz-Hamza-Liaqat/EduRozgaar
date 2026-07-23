import { CmsHomepage } from '../models/CmsHomepage.js';
import { CmsNavigation } from '../models/CmsNavigation.js';
import { CmsStaticPage } from '../models/CmsStaticPage.js';

/** Detect C.6.1 verify-script markers left in published CMS. */
export function isC61TestMarker(value) {
  return typeof value === 'string' && /^c61-test-/i.test(value);
}

/** Default header nav mirroring client Navbar.jsx */
export function defaultHeaderItems() {
  return [
    { label: 'Home', path: '/', visible: true, order: 0 },
    { label: 'Jobs', path: '/jobs', visible: true, order: 1 },
    { label: 'Scholarships', path: '/scholarships', visible: true, order: 2 },
    { label: 'Admissions', path: '/admissions', visible: true, order: 3 },
    { label: 'Internships', path: '/internships', visible: true, order: 4 },
    {
      label: 'Education',
      path: '#',
      visible: true,
      order: 5,
      children: [
        { label: 'Schools & Colleges', path: '/schools-and-colleges', visible: true, order: 0 },
        { label: 'Universities', path: '/intl-scholarships', visible: true, order: 1 },
        { label: 'Foreign Studies', path: '/foreign-studies', visible: true, order: 2 },
      ],
    },
    { label: 'Exam Prep', path: '/exam-prep', visible: true, order: 6 },
    { label: 'Blog', path: '/blog', visible: true, order: 7 },
    { label: 'Contact', path: '/contact', visible: true, order: 8 },
  ];
}

function defaultFooterColumns() {
  return [
    {
      title: 'Quick Links',
      links: [
        { label: 'Jobs', path: '/jobs' },
        { label: 'Scholarships', path: '/scholarships' },
        { label: 'Admissions', path: '/admissions' },
        { label: 'Internships', path: '/internships' },
        { label: 'Exam Preparation', path: '/exam-prep' },
        { label: 'Career Guidance', path: '/career-guidance' },
        { label: 'Blog', path: '/blog' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', path: '/about' },
        { label: 'Contact', path: '/contact' },
        { label: 'Careers', path: '/careers' },
        { label: 'Advertise With Us', path: '/advertise' },
        { label: 'Help Center', path: '/help-center' },
        { label: 'FAQ', path: '/faq' },
        { label: 'Support', path: '/support' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', path: '/privacy-policy' },
        { label: 'Terms & Conditions', path: '/terms' },
        { label: 'Cookie Policy', path: '/cookies' },
        { label: 'Disclaimer', path: '/disclaimer' },
        { label: 'Refund Policy', path: '/refund-policy' },
        { label: 'License', path: '/license' },
      ],
    },
    {
      title: 'Portals',
      links: [
        { label: 'Student Portal', path: '/dashboard' },
        { label: 'Employer Portal', path: '/employer/login' },
        { label: 'Resume Builder', path: '/resume-builder' },
        { label: 'Submit Opportunity', path: '/submit-opportunity' },
      ],
    },
  ];
}

const STATIC_PAGE_SEEDS = [
  { slug: 'about', pageType: 'about', title: 'About Us', heading: 'About EduRozgaar' },
  { slug: 'contact', pageType: 'contact', title: 'Contact', heading: 'Contact Us' },
  { slug: 'faq', pageType: 'faq', title: 'FAQ', heading: 'Frequently Asked Questions' },
  { slug: 'privacy-policy', pageType: 'privacy', title: 'Privacy Policy', heading: 'Privacy Policy' },
  { slug: 'terms', pageType: 'terms', title: 'Terms of Service', heading: 'Terms of Service' },
  { slug: 'cookies', pageType: 'cookies', title: 'Cookie Policy', heading: 'Cookie Policy' },
  { slug: 'disclaimer', pageType: 'disclaimer', title: 'Disclaimer', heading: 'Disclaimer' },
  { slug: 'refund-policy', pageType: 'refund', title: 'Refund Policy', heading: 'Refund Policy' },
  { slug: 'careers', pageType: 'careers', title: 'Careers', heading: 'Careers at EduRozgaar' },
  { slug: 'advertise', pageType: 'advertise', title: 'Advertise', heading: 'Advertise With Us' },
  { slug: 'help-center', pageType: 'help', title: 'Help Center', heading: 'Help Center' },
  { slug: 'support', pageType: 'support', title: 'Support', heading: 'Support' },
  { slug: 'services', pageType: 'services', title: 'Services', heading: 'Our Services' },
  { slug: 'license', pageType: 'license', title: 'License', heading: 'License' },
];

/**
 * Insert CMS defaults only when a document does not exist.
 * Never updates status, content, or admin edits on existing documents.
 */
async function insertIfMissing(Model, filter, defaults) {
  const existing = await Model.findOne(filter).select('_id').lean();
  if (existing) return 'skipped';
  await Model.create({ ...defaults, ...filter });
  return 'inserted';
}

/**
 * Production-safe CMS bootstrap: insert-only defaults for empty collections.
 * Set CMS_SEED_ON_START=0 to skip entirely at startup.
 */
export async function seedCmsSiteContent() {
  const locales = ['en'];
  const stats = {
    mode: 'insert_only',
    homepage: { inserted: 0, skipped: 0 },
    headerNav: { inserted: 0, skipped: 0 },
    footerNav: { inserted: 0, skipped: 0 },
    staticPages: { inserted: 0, skipped: 0 },
  };

  for (const locale of locales) {
    const homepageResult = await insertIfMissing(
      CmsHomepage,
      { locale },
      {
        status: 'draft',
        hero: {
          headline: 'Find Jobs, Scholarships & Admissions in Pakistan',
          subheadline: 'Find jobs, scholarships, admissions, and study abroad opportunities — all in one place.',
          ctas: [
            { label: 'Government Jobs', url: '/jobs', style: 'secondary' },
            { label: 'Scholarships', url: '/scholarships', style: 'secondary' },
            { label: 'Start Exploring', url: '/jobs', style: 'primary' },
          ],
        },
        stats: [
          { label: 'Jobs', value: '1000+', icon: 'briefcase' },
          { label: 'Scholarships', value: '500+', icon: 'graduation-cap' },
          { label: 'Admissions', value: '200+', icon: 'university' },
        ],
        sections: {
          featuredJobs: { enabled: true, title: 'Trending Jobs', limit: 8 },
          featuredScholarships: { enabled: true, title: 'Latest Scholarships', limit: 6 },
          featuredAdmissions: { enabled: true, title: 'Upcoming Admissions', limit: 6 },
          testimonials: { enabled: false, title: 'What Students Say', items: [] },
          partners: { enabled: false, title: 'Our Partners', logos: [] },
          newsletter: { enabled: true, title: 'Get Daily Job & Scholarship Alerts', subtitle: 'Subscribe and we\'ll send you the latest opportunities.' },
        },
        seoTitle: 'EduRozgaar – Jobs & Education Portal Pakistan',
        metaDescription: 'Pakistan\'s job and education portal. Find jobs, scholarships, admissions, internships, and study abroad opportunities.',
      }
    );
    stats.homepage[homepageResult] += 1;

    const headerResult = await insertIfMissing(
      CmsNavigation,
      { locale, placement: 'header' },
      { status: 'draft', items: defaultHeaderItems() }
    );
    stats.headerNav[headerResult] += 1;

    const footerResult = await insertIfMissing(
      CmsNavigation,
      { locale, placement: 'footer' },
      {
        status: 'draft',
        columns: defaultFooterColumns(),
        socialLinks: [
          { platform: 'twitter', url: 'https://twitter.com/edurozgaar', icon: 'twitter' },
          { platform: 'linkedin', url: 'https://linkedin.com/company/edurozgaar', icon: 'linkedin' },
          { platform: 'telegram', url: 'https://t.me/edurozgaar', icon: 'telegram' },
        ],
        contact: { email: 'contact@edurozgaar.pk', phone: '', address: 'Pakistan' },
        newsletterText: 'Get jobs, scholarships & admission alerts.',
        copyrightText: '© 2026 EduRozgaar. All rights reserved.',
      }
    );
    stats.footerNav[footerResult] += 1;
  }

  for (const page of STATIC_PAGE_SEEDS) {
    for (const locale of locales) {
      const pageResult = await insertIfMissing(
        CmsStaticPage,
        { slug: page.slug, locale },
        {
          ...page,
          status: 'draft',
          content: '',
          sections: [],
          lastUpdatedManually: new Date(),
        }
      );
      stats.staticPages[pageResult] += 1;
    }
  }

  return stats;
}

const DEFAULT_HERO = {
  headline: 'Find Jobs, Scholarships & Admissions in Pakistan',
  subheadline: 'Find jobs, scholarships, admissions, and study abroad opportunities — all in one place.',
  ctas: [
    { label: 'Government Jobs', url: '/jobs', style: 'secondary' },
    { label: 'Scholarships', url: '/scholarships', style: 'secondary' },
    { label: 'Start Exploring', url: '/jobs', style: 'primary' },
  ],
};

/**
 * Reset published CMS docs corrupted by verify-sprint-c6-1 markers or truncated nav.
 * Safe to run repeatedly; only updates when corruption is detected.
 */
export async function restorePublishedCmsDefaults(locale = 'en') {
  const restored = { homepage: false, header: false, footer: false, about: false };

  const homepage = await CmsHomepage.findOne({ locale });
  if (homepage?.status === 'published' && isC61TestMarker(homepage.hero?.headline)) {
    homepage.hero = { ...(homepage.hero?.toObject?.() || homepage.hero || {}), ...DEFAULT_HERO };
    await homepage.save();
    restored.homepage = true;
  }

  const header = await CmsNavigation.findOne({ locale, placement: 'header' });
  const headerCorrupt = header?.status === 'published' && (
    (header.items?.length ?? 0) < 3
    || header.items?.some((i) => isC61TestMarker(i.label))
  );
  if (headerCorrupt) {
    header.items = defaultHeaderItems();
    await header.save();
    restored.header = true;
  }

  const footer = await CmsNavigation.findOne({ locale, placement: 'footer' });
  if (footer?.status === 'published' && isC61TestMarker(footer.copyrightText)) {
    footer.copyrightText = '© 2026 EduRozgaar. All rights reserved.';
    await footer.save();
    restored.footer = true;
  }

  const about = await CmsStaticPage.findOne({ slug: 'about', locale });
  if (about?.status === 'published' && isC61TestMarker(about.content)) {
    about.content = '';
    await about.save();
    restored.about = true;
  }

  return restored;
}
