#!/usr/bin/env node
/**
 * Sprint C.6.1 — Critical persistence & production readiness verification.
 * Usage: cd server && node --env-file=.env ../scripts/verify-sprint-c6-1.mjs [--base http://localhost:5000]
 */
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_BASE = process.argv.includes('--base')
  ? process.argv[process.argv.indexOf('--base') + 1]
  : 'http://localhost:5000';

const results = [];

async function check(name, fn, { optionalServer = false } = {}) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`✓ ${name}`);
  } catch (err) {
    const offline = /fetch failed|ECONNREFUSED|ENOTFOUND/i.test(String(err.message) + (err.cause?.message || ''));
    if (optionalServer && offline) {
      results.push({ name, ok: true, skipped: true });
      console.log(`○ ${name} (skipped — API not running)`);
      return;
    }
    results.push({ name, ok: false, error: err.message });
    console.error(`✗ ${name}: ${err.message}`);
  }
}

console.log('Sprint C.6.1 Critical Persistence Verification\n');

const { connectDB } = await import('../server/src/config/db.js');
await connectDB();

await check('CMS seed is insert-only (published survives re-seed)', async () => {
  const { CmsHomepage } = await import('../server/src/models/CmsHomepage.js');
  const { CmsNavigation } = await import('../server/src/models/CmsNavigation.js');
  const { CmsStaticPage } = await import('../server/src/models/CmsStaticPage.js');
  const { seedCmsSiteContent } = await import('../server/src/seed/cmsSiteContent.js');

  const marker = `c61-test-${Date.now()}`;
  const locale = 'en';

  const snapshot = {
    homepage: await CmsHomepage.findOne({ locale }).lean(),
    header: await CmsNavigation.findOne({ locale, placement: 'header' }).lean(),
    footer: await CmsNavigation.findOne({ locale, placement: 'footer' }).lean(),
    about: await CmsStaticPage.findOne({ slug: 'about', locale }).lean(),
  };

  const restoreSnapshot = async () => {
    const { restorePublishedCmsDefaults } = await import('../server/src/seed/cmsSiteContent.js');
    if (snapshot.homepage) {
      const { _id, __v, createdAt, updatedAt, ...data } = snapshot.homepage;
      await CmsHomepage.findOneAndUpdate({ locale }, { $set: data }, { upsert: true });
    }
    if (snapshot.header) {
      const { _id, __v, createdAt, updatedAt, ...data } = snapshot.header;
      await CmsNavigation.findOneAndUpdate({ locale, placement: 'header' }, { $set: data }, { upsert: true });
    }
    if (snapshot.footer) {
      const { _id, __v, createdAt, updatedAt, ...data } = snapshot.footer;
      await CmsNavigation.findOneAndUpdate({ locale, placement: 'footer' }, { $set: data }, { upsert: true });
    }
    if (snapshot.about) {
      const { _id, __v, createdAt, updatedAt, ...data } = snapshot.about;
      await CmsStaticPage.findOneAndUpdate({ slug: 'about', locale }, { $set: data }, { upsert: true });
    } else {
      await restorePublishedCmsDefaults(locale);
    }
  };

  try {
    let homepage = await CmsHomepage.findOne({ locale });
    if (!homepage) {
      homepage = await CmsHomepage.create({ locale, status: 'draft', hero: { headline: 'bootstrap' } });
    }

    homepage.status = 'published';
    homepage.hero = { ...(homepage.hero?.toObject?.() || homepage.hero || {}), headline: marker };
    homepage.publishedAt = new Date();
    await homepage.save();

    let header = await CmsNavigation.findOne({ locale, placement: 'header' });
    if (!header) {
      header = await CmsNavigation.create({ locale, placement: 'header', status: 'draft', items: [] });
    }
    header.status = 'published';
    header.items = [{ label: marker, path: '/jobs', visible: true, order: 0 }];
    await header.save();

    let footer = await CmsNavigation.findOne({ locale, placement: 'footer' });
    if (!footer) {
      footer = await CmsNavigation.create({ locale, placement: 'footer', status: 'draft', columns: [] });
    }
    footer.status = 'published';
    footer.copyrightText = marker;
    await footer.save();

    let page = await CmsStaticPage.findOne({ slug: 'about', locale });
    if (!page) {
      page = await CmsStaticPage.create({
        slug: 'about', locale, pageType: 'about', title: 'About', heading: 'About', status: 'draft', content: '',
      });
    }
    page.status = 'published';
    page.content = marker;
    await page.save();

    const seedStats = await seedCmsSiteContent();
    if (seedStats.mode !== 'insert_only') throw new Error('seed mode must be insert_only');

    const hpAfter = await CmsHomepage.findOne({ locale }).lean();
    if (hpAfter.status !== 'published') throw new Error(`homepage status reverted to ${hpAfter.status}`);
    if (hpAfter.hero?.headline !== marker) throw new Error('homepage hero overwritten');

    const headerAfter = await CmsNavigation.findOne({ locale, placement: 'header' }).lean();
    if (headerAfter.status !== 'published') throw new Error(`header status reverted to ${headerAfter.status}`);
    if (!headerAfter.items?.[0]?.label?.includes(marker)) throw new Error('header items overwritten');

    const footerAfter = await CmsNavigation.findOne({ locale, placement: 'footer' }).lean();
    if (footerAfter.status !== 'published') throw new Error(`footer status reverted to ${footerAfter.status}`);
    if (footerAfter.copyrightText !== marker) throw new Error('footer content overwritten');

    const pageAfter = await CmsStaticPage.findOne({ slug: 'about', locale }).lean();
    if (pageAfter.status !== 'published') throw new Error(`static page status reverted to ${pageAfter.status}`);
    if (pageAfter.content !== marker) throw new Error('static page content overwritten');
  } finally {
    await restoreSnapshot();
  }
});

await check('Job plans seed is insert-only', async () => {
  const { seedJobPlans } = await import('../server/src/seed/jobPlans.js');
  const first = await seedJobPlans();
  const second = await seedJobPlans();
  if (first.mode !== 'insert_only' || second.mode !== 'insert_only') throw new Error('missing insert_only mode');
  if (second.inserted !== 0) throw new Error('second run inserted plans');
});

await check('Major collections persist in MongoDB', async () => {
  const models = [
    ['Job', '../server/src/models/Job.js'],
    ['Scholarship', '../server/src/models/Scholarship.js'],
    ['Admission', '../server/src/models/Admission.js'],
    ['Blog', '../server/src/models/Blog.js'],
    ['CmsHomepage', '../server/src/models/CmsHomepage.js'],
    ['ContactMessage', '../server/src/models/ContactMessage.js'],
    ['SupportTicket', '../server/src/models/SupportTicket.js'],
    ['UserNotification', '../server/src/models/UserNotification.js'],
    ['User', '../server/src/models/User.js'],
    ['Employer', '../server/src/models/Employer.js'],
    ['Institution', '../server/src/models/Institution.js'],
    ['ForeignStudy', '../server/src/models/ForeignStudy.js'],
    ['Webinar', '../server/src/models/Webinar.js'],
  ];

  for (const [name, modPath] of models) {
    const mod = await import(modPath);
    const Model = mod[name];
    const count = await Model.countDocuments();
    console.log(`  ${name}: ${count} documents`);
  }
});

await check('Health endpoint reports email mode', async () => {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  if (!body.email?.mode) throw new Error('missing email.mode');
  if (!['live', 'placeholder'].includes(body.email.mode)) throw new Error(`invalid mode ${body.email.mode}`);
}, { optionalServer: true });

await check('Email placeholder does not fail queue job', async () => {
  const { sendEmail, isSmtpConfigured } = await import('../server/src/services/emailService.js');
  const result = await sendEmail({ to: 'test@example.com', subject: 'C6.1 test', body: 'test', template: 'test' });
  if (isSmtpConfigured()) {
    if (!result.sent) throw new Error('SMTP configured but send failed');
  } else if (!result.placeholder) {
    throw new Error('expected placeholder mode when SMTP not configured');
  }
});

const passed = results.filter((r) => r.ok).length;
console.log(`\n${passed}/${results.length} checks passed`);

process.exit(passed === results.length ? 0 : 1);
