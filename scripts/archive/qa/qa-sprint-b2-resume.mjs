/**
 * Sprint B.2 Resume Builder — manual QA automation
 * Creates test resumes, validates save/load, captures preview + PDF artifacts.
 *
 * Usage: node scripts/qa-sprint-b2-resume.mjs
 * Requires: dev servers on :5000 and :5173, npx puppeteer (auto-downloaded)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'docs', 'qa-sprint-b2');
const BASE = process.env.API_URL || 'http://localhost:5000/api';
const APP = process.env.APP_URL || 'http://localhost:5173';
const EMAIL = process.env.QA_EMAIL || 'admin@edurozgaar.pk';
const PASS = process.env.QA_PASSWORD || 'Admin1234';

const TECH_SKILLS_RAW = `JavaScript, TypeScript, Python
React, Node.js, Express
MongoDB, PostgreSQL, Redis
Docker, Kubernetes, AWS
Git, CI/CD, REST APIs
GraphQL, HTML/CSS, Tailwind CSS
Vue.js, Angular, Next.js
Java, Spring Boot, C#
Linux, Bash, Nginx
Agile, Scrum, Jira
Unit Testing, Jest, Cypress
Microservices, System Design
SQL, NoSQL, Elasticsearch
Terraform, Ansible, GCP
Azure, Firebase, WebSockets`;

const SOFT_SKILLS = ['Communication', 'Leadership', 'Problem Solving', 'Teamwork', 'Time Management', 'Adaptability', 'Critical Thinking'];

const SECTION_HEADINGS = [
  'Career Objective',
  'Education',
  'Technical Skills',
  'Soft Skills',
  'Experience',
  'Projects',
  'Certifications',
  'Languages',
  'References',
  'Awards',
  'Volunteer Experience',
  'Publications',
  'Interests',
  'Professional Memberships',
];

function parseSkillLines(text) {
  const out = [];
  const seen = new Set();
  for (const part of String(text || '').split(/[\n,]/)) {
    const s = part.trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

function buildFullResume(titleSuffix = 'Full QA') {
  const technical = parseSkillLines(TECH_SKILLS_RAW);
  // Add duplicate to verify dedupe
  technical.push('JavaScript', 'React');

  return {
    title: `Sprint B.2 ${titleSuffix}`,
    template: 'modern-professional',
    personalInfo: {
      fullName: 'Syed Daniyal Abbas',
      professionalTitle: 'Senior Software Engineer',
      email: 'daniyal@example.com',
      phone: '+92 300 1234567',
      city: 'Karachi',
      province: 'Sindh',
      linkedInUrl: 'https://linkedin.com/in/daniyal',
      githubUrl: 'https://github.com/daniyal',
      portfolioUrl: 'https://daniyal.dev',
      profilePhotoUrl: '',
    },
    careerObjective:
      'Results-driven software engineer with 8+ years building scalable web applications. Seeking senior roles where I can lead technical initiatives and mentor teams.',
    education: [
      { degree: 'BS Computer Science', university: 'NUST', fieldOfStudy: 'Software Engineering', graduationYear: '2018', gpa: '3.8' },
      { degree: 'MS Computer Science', university: 'LUMS', fieldOfStudy: 'Distributed Systems', graduationYear: '2020', gpa: '3.9' },
    ],
    skills: { technical, soft: SOFT_SKILLS },
    experience: Array.from({ length: 6 }, (_, i) => ({
      company: `Tech Company ${i + 1}`,
      role: `Software Engineer ${i + 1}`,
      duration: `${2018 + i} – ${2019 + i}`,
      description: `Led development of platform features serving ${(i + 1) * 10000} users. Improved performance by ${10 + i * 5}%. Collaborated with cross-functional teams on architecture, code review, and deployment pipelines.`,
    })),
    projects: [
      { title: 'EduRozgaar Portal', description: 'Full-stack education and jobs platform for Pakistan.', technologies: 'React, Node.js, MongoDB' },
      { title: 'Analytics Dashboard', description: 'Real-time metrics dashboard with role-based access.', technologies: 'Vue, Python, PostgreSQL' },
      { title: 'Mobile Banking App', description: 'Secure fintech application with biometric auth.', technologies: 'React Native, AWS' },
    ],
    certifications: ['AWS Solutions Architect', 'MongoDB Developer', 'Scrum Master'],
    languages: ['English (Fluent)', 'Urdu (Native)', 'Arabic (Basic)'],
    references: [
      { name: 'Dr. Ahmed Khan', title: 'Professor', company: 'NUST', email: 'ahmed@nust.edu.pk', phone: '+92 300 1111111' },
      { name: 'Sara Malik', title: 'Engineering Manager', company: 'TechCorp', email: 'sara@techcorp.com', phone: '+92 300 2222222' },
    ],
    awards: [
      { title: 'Best Graduate Project', issuer: 'NUST CS Department', year: '2018', description: 'Awarded for innovative capstone project.' },
      { title: 'Employee of the Year', issuer: 'TechCorp', year: '2022', description: 'Recognized for outstanding delivery.' },
    ],
    volunteerExperience: [
      { organization: 'Code for Pakistan', role: 'Mentor', duration: '2021 – Present', description: 'Mentor students in open-source and web development.' },
    ],
    publications: [
      { title: 'Scaling Web Apps in Emerging Markets', publisher: 'Tech Journal PK', year: '2023', url: 'https://example.com/article', description: 'Case study on performance optimization.' },
    ],
    interests: ['Open Source', 'Technical Writing', 'Chess', 'Hiking'],
    professionalMemberships: [
      { organization: 'IEEE', role: 'Member', since: '2019' },
      { organization: 'ACM', role: 'Professional Member', since: '2020' },
    ],
  };
}

function buildShortResume() {
  const r = buildFullResume('Short 1-Page');
  r.experience = r.experience.slice(0, 1);
  r.projects = r.projects.slice(0, 1);
  r.skills.technical = r.skills.technical.slice(0, 8);
  r.references = [];
  r.awards = [];
  r.volunteerExperience = [];
  r.publications = [];
  r.interests = [];
  r.professionalMemberships = [];
  return r;
}

function buildMediumResume() {
  const r = buildFullResume('Medium 2-Page');
  r.experience = r.experience.slice(0, 3);
  r.skills.technical = r.skills.technical.slice(0, 20);
  return r;
}

function buildLongResume() {
  return buildFullResume('Long 3+ Page');
}

async function login() {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  const data = await res.json();
  return { token: data.accessToken, refresh: data.refreshToken, user: data.user };
}

async function api(token, method, urlPath, body) {
  const opts = {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${urlPath}`, opts);
  const data = res.status !== 204 ? await res.json().catch(() => ({})) : null;
  return { status: res.status, ok: res.ok, data };
}

function assertFieldsLoaded(loaded, expected) {
  const errors = [];
  const pi = loaded.personalInfo || {};
  const epi = expected.personalInfo;
  for (const f of ['fullName', 'professionalTitle', 'email', 'phone']) {
    if (pi[f] !== epi[f]) errors.push(`personalInfo.${f}: got "${pi[f]}", expected "${epi[f]}"`);
  }
  if ((loaded.references || []).length !== expected.references.length) errors.push('references count mismatch');
  if ((loaded.awards || []).length !== expected.awards.length) errors.push('awards count mismatch');
  if ((loaded.volunteerExperience || []).length !== expected.volunteerExperience.length) errors.push('volunteer count mismatch');
  if ((loaded.publications || []).length !== expected.publications.length) errors.push('publications count mismatch');
  if (pi.professionalTitle !== epi.professionalTitle) errors.push('professionalTitle missing after reload');
  return errors;
}

async function runApiQa(token) {
  const results = [];
  const full = buildFullResume();

  const created = await api(token, 'POST', '/resumes', full);
  results.push({ test: 'Create full QA resume', pass: created.ok, detail: created.ok ? created.data._id : created.status });

  if (!created.ok) return { results, resumeId: null, full };

  const id = created.data._id;
  const loaded = await api(token, 'GET', `/resumes/${id}`);
  const fieldErrors = assertFieldsLoaded(loaded.data, full);
  results.push({
    test: 'Save/load field persistence',
    pass: loaded.ok && fieldErrors.length === 0,
    detail: fieldErrors.length ? fieldErrors.join('; ') : 'All key fields persisted',
  });

  const techCount = (loaded.data.skills?.technical || []).length;
  const dupCheck = new Set((loaded.data.skills?.technical || []).map((s) => s.toLowerCase()));
  results.push({
    test: 'Skills: 30+ technical, deduped',
    pass: techCount >= 30 && dupCheck.size === techCount,
    detail: `${techCount} skills, ${dupCheck.size} unique`,
  });

  const ai = await api(token, 'POST', '/resumes/ai-suggest', { careerObjective: full.careerObjective });
  results.push({
    test: 'AI objective suggest (no regression)',
    pass: ai.ok && (ai.data?.careerObjective?.improved || ai.data?.suggestions),
    detail: ai.ok ? 'OK' : `HTTP ${ai.status}`,
  });

  return { results, resumeId: id, full };
}

async function captureBrowserArtifacts({ token, refresh, user, resumeId, resumeIds }) {
  const puppeteer = await import('puppeteer').catch(async () => {
    console.log('Installing puppeteer via npx...');
    const { execSync } = await import('child_process');
    execSync('npm install puppeteer@23 --no-save', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
    return import('puppeteer');
  });

  const browser = await puppeteer.default.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  await page.goto(`${APP}/login`, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.evaluate(
    ({ token, refresh, user }) => {
      localStorage.setItem('edurozgaar-token', token);
      localStorage.setItem('edurozgaar-refresh-token', refresh);
      localStorage.setItem('edurozgaar-user', JSON.stringify(user));
    },
    { token, refresh, user }
  );

  const client = await page.createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: OUT_DIR,
  });

  const screenshots = [];

  async function captureResume(label, id, scrollShots = 2) {
    await page.goto(`${APP}/resume-builder?edit=${id}`, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForSelector('.resume-preview', { timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1500));

    const preview = await page.$('.resume-preview');
    if (!preview) throw new Error('Preview not found');

    const headerPath = path.join(OUT_DIR, `${label}-preview-header.png`);
    await preview.screenshot({ path: headerPath });
    screenshots.push({ file: headerPath, label: `${label} preview (header area)` });

    const fullPreviewPath = path.join(OUT_DIR, `${label}-preview-full.png`);
    await page.screenshot({ path: fullPreviewPath, fullPage: true });
    screenshots.push({ file: fullPreviewPath, label: `${label} preview (full page)` });

    const domCheck = await page.evaluate((headings) => {
      const root = document.querySelector('.resume-preview');
      if (!root) return { error: 'no preview' };
      const text = root.innerText;
      const found = headings.filter((h) => text.includes(h));
      const header = {
        name: text.includes('Syed Daniyal Abbas'),
        title: text.includes('Senior Software Engineer'),
        contact: text.includes('daniyal@example.com') && text.includes('+92 300 1234567'),
        social: text.includes('LinkedIn') && text.includes('GitHub'),
      };
      return { found, header, textLength: text.length };
    }, SECTION_HEADINGS);

    // Scroll sections for section headings screenshot
    await page.evaluate(() => {
      const w = document.querySelector('.resume-preview-wrapper');
      if (w) w.scrollTop = w.scrollHeight / 2;
    });
    await new Promise((r) => setTimeout(r, 500));
    const sectionsPath = path.join(OUT_DIR, `${label}-preview-sections.png`);
    await page.screenshot({ path: sectionsPath });
    screenshots.push({ file: sectionsPath, label: `${label} preview (sections scroll)` });

    // Download PDF
    const buttons = await page.$$('button');
    let downloaded = false;
    for (const btn of buttons) {
      const txt = await page.evaluate((el) => el.textContent, btn);
      if (/pdf|download/i.test(txt || '')) {
        await btn.click();
        downloaded = true;
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 8000));

    const pdfsBefore = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.pdf'));
    const pdfPath = path.join(OUT_DIR, `${label}.pdf`);
    const newPdf = fs.readdirSync(OUT_DIR).find((f) => f.endsWith('.pdf') && !pdfsBefore.includes(f));
    if (newPdf) {
      fs.renameSync(path.join(OUT_DIR, newPdf), pdfPath);
    }

    let pdfPages = [];
    if (fs.existsSync(pdfPath)) {
      const pdfPage = await browser.newPage();
      await pdfPage.goto(`file:///${pdfPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 2000));
      for (let p = 1; p <= 3; p += 1) {
        if (p > 1) {
          await pdfPage.keyboard.press('PageDown');
          await new Promise((r) => setTimeout(r, 800));
        }
        const shot = path.join(OUT_DIR, `${label}-pdf-page${p}.png`);
        await pdfPage.screenshot({ path: shot, fullPage: false });
        pdfPages.push(shot);
      }
      await pdfPage.close();
    }

    return { domCheck, pdfPath: fs.existsSync(pdfPath) ? pdfPath : null, pdfPages, downloaded };
  }

  const captures = {};
  captures.full = await captureResume('full-qa', resumeId, 3);
  if (resumeIds.short) captures.short = await captureResume('short-1page', resumeIds.short);
  if (resumeIds.medium) captures.medium = await captureResume('medium-2page', resumeIds.medium);
  if (resumeIds.long) captures.long = await captureResume('long-3page', resumeIds.long);

  // Template switch regression
  await page.goto(`${APP}/resume-builder?edit=${resumeId}`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('.resume-preview');
  const templates = await page.$$('[data-template-id], button');
  let switched = false;
  for (const t of templates) {
    const id = await page.evaluate((el) => el.getAttribute('data-template-id') || el.textContent, t);
    if (id && /minimal|creative|academic/i.test(id)) {
      await t.click();
      switched = true;
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 1000));
  const afterSwitch = await page.evaluate(() => !!document.querySelector('.resume-preview .resume-name'));
  captures.templateSwitch = { switched, nameVisible: afterSwitch };

  await browser.close();
  return { screenshots, captures };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log('Sprint B.2 Resume QA\n');
  console.log(`Output: ${OUT_DIR}\n`);

  const { token, refresh, user } = await login();
  console.log('Login: OK\n');

  const { results: apiResults, resumeId, full } = await runApiQa(token);

  const shortRes = await api(token, 'POST', '/resumes', buildShortResume());
  const mediumRes = await api(token, 'POST', '/resumes', buildMediumResume());
  const longRes = await api(token, 'POST', '/resumes', buildLongResume());

  const resumeIds = {
    short: shortRes.ok ? shortRes.data._id : null,
    medium: mediumRes.ok ? mediumRes.data._id : null,
    long: longRes.ok ? longRes.data._id : null,
  };

  let browserData = null;
  try {
    browserData = await captureBrowserArtifacts({ token, refresh, user, resumeId, resumeIds });
    console.log('Browser capture: OK\n');
  } catch (err) {
    console.error('Browser capture failed:', err.message);
    apiResults.push({ test: 'Browser screenshots + PDF', pass: false, detail: err.message });
  }

  const domResults = [];
  if (browserData?.captures?.full) {
    const { domCheck, pdfPath } = browserData.captures.full;
    domResults.push({
      test: 'Header: Full Name in preview',
      pass: domCheck.header?.name,
      detail: domCheck.header?.name ? 'Visible' : 'Missing',
    });
    domResults.push({
      test: 'Header: Professional Title in preview',
      pass: domCheck.header?.title,
      detail: domCheck.header?.title ? 'Visible' : 'Missing',
    });
    domResults.push({
      test: 'Header: Contact in preview',
      pass: domCheck.header?.contact,
      detail: domCheck.header?.contact ? 'Visible' : 'Missing',
    });
    domResults.push({
      test: 'Header: Social links in preview',
      pass: domCheck.header?.social,
      detail: domCheck.header?.social ? 'Visible' : 'Missing',
    });
    for (const h of SECTION_HEADINGS) {
      const found = domCheck.found?.includes(h);
      domResults.push({
        test: `Section heading: ${h}`,
        pass: found,
        detail: found ? 'Present' : 'Missing',
      });
    }
    domResults.push({
      test: 'PDF exported',
      pass: !!pdfPath,
      detail: pdfPath || 'Not generated',
    });
    domResults.push({
      test: 'Template switch (name still visible)',
      pass: browserData.captures.templateSwitch?.nameVisible,
      detail: browserData.captures.templateSwitch?.switched ? 'Switched template' : 'No switch attempted',
    });
  }

  const allResults = [...apiResults, ...domResults];
  const failed = allResults.filter((r) => !r.pass);

  const report = `# Sprint B.2 QA Evidence Report

Generated: ${new Date().toISOString()}

## Environment
- API: ${BASE}
- App: ${APP}
- QA user: ${EMAIL}

## Resume IDs
- Full QA: \`${resumeId}\`
- Short (1-page): \`${resumeIds.short}\`
- Medium (2-page): \`${resumeIds.medium}\`
- Long (3+ page): \`${resumeIds.long}\`

## QA Checklist Results

| # | Test | Result | Detail |
|---|------|--------|--------|
${allResults.map((r, i) => `| ${i + 1} | ${r.test} | ${r.pass ? 'PASS' : 'FAIL'} | ${String(r.detail).replace(/\|/g, '\\|')} |`).join('\n')}

## Summary
- **Total:** ${allResults.length} checks
- **Passed:** ${allResults.length - failed.length}
- **Failed:** ${failed.length}

## Artifacts

### Preview screenshots
${browserData?.screenshots?.map((s) => `- [\`${path.basename(s.file)}\`](./${path.basename(s.file)}) — ${s.label}`).join('\n') || '- Browser capture not available'}

### Exported PDF
- [\`full-qa.pdf\`](./full-qa.pdf) — primary test PDF (download from Resume Builder)
${resumeIds.short ? '- `short-1page.pdf`' : ''}
${resumeIds.medium ? '- `medium-2page.pdf`' : ''}
${resumeIds.long ? '- `long-3page.pdf`' : ''}

### PDF page screenshots
- \`full-qa-pdf-page1.png\`, \`full-qa-pdf-page2.png\`, etc.

## Manual review notes
1. Compare \`full-qa-preview-full.png\` with \`full-qa-pdf-page1.png\` for visual parity.
2. Open \`full-qa.pdf\` locally to verify page numbers and multi-page layout.
3. Edit URL: ${APP}/resume-builder?edit=${resumeId}

## Regression confirmation
- Save/load: ${apiResults.find((r) => r.test.includes('Save/load'))?.pass ? 'PASS' : 'FAIL'}
- AI optimization: ${apiResults.find((r) => r.test.includes('AI'))?.pass ? 'PASS' : 'FAIL'}
- Template switching: ${domResults.find((r) => r.test.includes('Template'))?.pass ? 'PASS' : 'FAIL'}
`;

  fs.writeFileSync(path.join(OUT_DIR, 'QA_REPORT.md'), report);

  console.log('--- API & DOM Results ---');
  for (const r of allResults) {
    console.log(`  [${r.pass ? 'PASS' : 'FAIL'}] ${r.test}: ${r.detail}`);
  }
  console.log(`\nReport: ${path.join(OUT_DIR, 'QA_REPORT.md')}`);
  console.log(failed.length ? `\n${failed.length} check(s) FAILED` : '\nAll checks PASSED');
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
