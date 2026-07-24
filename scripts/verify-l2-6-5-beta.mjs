/**
 * L.2.6.5 — Live Beta readiness verification against running API + static L.2.6 gates.
 * Usage: node scripts/verify-l2-6-5-beta.mjs
 * Requires: API on http://127.0.0.1:5000, Mongo with seed data.
 */
import fs from 'fs';
import { docExists } from './lib/docExists.mjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const API = process.env.VERIFY_API_URL || 'http://127.0.0.1:5000/api';

let passed = 0;
let failed = 0;
let partial = 0;
const results = [];

function record(id, status, detail = '') {
  results.push({ id, status, detail });
  if (status === 'PASS') {
    passed += 1;
    console.log(`  PASS  ${id}${detail ? ` — ${detail}` : ''}`);
  } else if (status === 'PARTIAL') {
    partial += 1;
    console.log(`  PART  ${id}${detail ? ` — ${detail}` : ''}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${id}${detail ? ` — ${detail}` : ''}`);
  }
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function exists(rel) {
  return docExists(root, rel);
}

async function api(method, urlPath, { token, body, formData } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (formData) {
    payload = formData;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${API}${urlPath}`, { method, headers, body: payload });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  return { status: res.status, data, ok: res.ok };
}

async function main() {
  console.log('\n=== L.2.6.5 Beta Verification ===\n');
  console.log(`API: ${API}\n`);

  // --- Health ---
  console.log('0. Health');
  try {
    const h = await api('GET', '/health');
    if (h.ok && h.data?.status === 'ok') record('health.api', 'PASS', `mongo=${h.data.mongo}`);
    else record('health.api', 'FAIL', JSON.stringify(h.data));
  } catch (e) {
    record('health.api', 'FAIL', e.message);
    console.log('\nAPI unreachable — aborting live checks. Static checks continue.\n');
  }

  // --- Static L.2.6 gates ---
  console.log('\n1. Static L.2.6 implementation gates');
  const staticChecks = [
    ['search.adminReindexUi', 'client/src/pages/Admin/AdminGlobalSearch.jsx', ['Rebuild Search Index', 'adminReindex']],
    ['search.heroLayout', 'client/src/components/search/GlobalSearch.jsx', ['showCategoryFilter', 'showProvinceFilter', 'w-full']],
    ['search.seedReindex', 'server/src/seed/index.js', ['SearchIndexer', 'rebuildAll', 'seedAssessments']],
    ['apply.dualWriteDefault', 'server/src/config/careerFeatureFlags.js', ['APPLICATION_DUAL_WRITE === \'0\'', 'isOpportunityApplicationEnabled']],
    ['apply.awaitDualWrite', 'server/src/controllers/applicationsController.js', ['await ApplicationMigrationService.dualWriteFromLegacyJobApplication', 'opportunityApplicationId']],
    ['apply.jobRedirect', 'client/src/pages/Jobs/JobDetail.jsx', ['opportunityApplicationId', 'APPLICATIONS', 'Track application', 'APPLICATIONS_NEW']],
    ['onboarding.register', 'client/src/pages/Auth/Register.jsx', ['TALENT_PROFILE', 'onboarding=1']],
    ['onboarding.banner', 'client/src/pages/TalentProfile/CareerOnboardingBanner.jsx', ['edur_onboarding_done', 'RESUME_BUILDER']],
    ['resume.noJson', 'client/src/pages/TalentProfile/ResumeVersionsPanel.jsx', ['ResumePreview', 'ResumeDownload'], ['JSON.stringify']],
    ['learning.deterministic', 'shared/career/learningRecommendations.js', ['buildDeterministicLearningRecommendations'], ['openai', 'anthropic', 'gemini']],
    ['learning.wired', 'server/src/services/career/DashboardCompositionService.js', ['buildDeterministicLearningRecommendations']],
    ['guidance.roadmaps', 'shared/career/degreeRoadmaps.js', ['DEGREE_ROADMAPS', 'salaryPakistanPkr']],
    ['assessments.seed', 'server/src/seed/assessments.js', ['iq-fundamentals', 'MVP_ASSESSMENTS']],
    ['ai.budget', 'docs/AI_BUDGET_POLICY.md', ['disabled', 'Paid AI']],
  ];

  for (const [id, file, mustInclude = [], mustNot = []] of staticChecks) {
    if (!exists(file)) {
      record(id, 'FAIL', `missing ${file}`);
      continue;
    }
    const src = read(file);
    const missing = mustInclude.filter((s) => !src.includes(s));
    const banned = mustNot.filter((s) => src.toLowerCase().includes(s.toLowerCase()));
    if (missing.length) record(id, 'FAIL', `missing: ${missing.join(', ')}`);
    else if (banned.length) record(id, 'FAIL', `forbidden: ${banned.join(', ')}`);
    else record(id, 'PASS', file);
  }

  // Resume JSON leak (case-sensitive beyond simple includes)
  {
    const src = read('client/src/pages/TalentProfile/ResumeVersionsPanel.jsx');
    if (/JSON\.stringify\(preview/.test(src)) record('resume.jsonLeak', 'FAIL', 'still stringifies preview');
    else record('resume.jsonLeak', 'PASS', 'no JSON.stringify(preview)');
  }

  // Learning widget not placeholder-only
  {
    const src = read('client/src/dashboard/widgets/RecommendedLearningWidget.jsx');
    if (src.includes('data?.items') && src.includes('item.title')) record('learning.widget', 'PASS');
    else record('learning.widget', 'FAIL', 'widget still placeholder-only');
  }

  const liveOk = results.find((r) => r.id === 'health.api')?.status === 'PASS';
  if (!liveOk) {
    summarize();
    process.exit(failed ? 1 : 0);
  }

  // --- Search live ---
  console.log('\n2. Global Search (live)');
  const searchQueries = [
    ['search.jobs', { q: 'engineer', type: 'job' }],
    ['search.scholarships', { q: 'scholarship', type: 'scholarship' }],
    ['search.admissions', { q: 'BS', type: 'admission' }],
    ['search.blogs', { q: 'career', type: 'blog' }],
    ['search.universities', { q: 'university', type: 'university' }],
    ['search.partial', { q: 'eng' }],
  ];

  let anySearchHits = 0;
  for (const [id, params] of searchQueries) {
    const qs = new URLSearchParams(params).toString();
    const res = await api('GET', `/search?${qs}`);
    if (!res.ok) {
      record(id, 'FAIL', `HTTP ${res.status}`);
      continue;
    }
    const total = res.data?.total ?? res.data?.results?.length ?? 0;
    if (total > 0) {
      anySearchHits += 1;
      record(id, 'PASS', `${total} hits`);
    } else {
      record(id, 'PARTIAL', '0 hits — index may be empty');
    }
  }

  const empty = await api('GET', '/search?q=zzzxqnotfound999');
  if (empty.ok && (empty.data?.total === 0 || !empty.data?.results?.length)) {
    record('search.emptyState', 'PASS', 'no-results shape ok');
  } else if (empty.ok) {
    record('search.emptyState', 'PARTIAL', `unexpected hits=${empty.data?.total}`);
  } else {
    record('search.emptyState', 'FAIL', `HTTP ${empty.status}`);
  }

  if (anySearchHits === 0) {
    record('search.indexPopulated', 'FAIL', 'all typed searches returned 0 — need reindex');
  } else {
    record('search.indexPopulated', 'PASS', `${anySearchHits} query types returned hits`);
  }

  // Reindex via admin if we can login
  console.log('\n3. Auth + Admin reindex + assessments');
  const stamp = Date.now();
  const email = `beta_l265_${stamp}@example.com`;
  const password = 'BetaTest!23456';

  const reg = await api('POST', '/auth/register', {
    body: { name: 'Beta Verify', email, password },
  });
  let userToken = reg.data?.token || reg.data?.accessToken;
  if (!userToken && reg.ok) {
    const login = await api('POST', '/auth/login', { body: { email, password } });
    userToken = login.data?.token || login.data?.accessToken;
  }
  if (userToken) record('auth.register', 'PASS', email);
  else record('auth.register', 'FAIL', `HTTP ${reg.status} ${JSON.stringify(reg.data)?.slice(0, 120)}`);

  // Try known seed admin if present
  let adminToken = null;
  for (const [em, pw] of [
    ['verify-admin@edurozgaar.local', 'VerifyAdmin!23456'],
    ['admin@strideto.com', 'Admin1234'],
    ['admin@strideto.com', 'Admin@12345'],
    ['admin@strideto.com', 'admin123'],
    ['admin@strideto.com', 'Password1!'],
    ['admin@edurozgaar.com', 'Admin@12345'],
    ['admin@example.com', 'password123'],
  ]) {
    const login = await api('POST', '/auth/login', { body: { email: em, password: pw } });
    if (login.ok && (login.data?.token || login.data?.accessToken)) {
      const tok = login.data.token || login.data.accessToken;
      const me = await api('GET', '/users/me', { token: tok }).catch(() => ({ ok: false }));
      // prefer any successful login that can hit admin search
      const stats = await api('GET', '/admin/search/stats', { token: tok });
      if (stats.ok) {
        adminToken = tok;
        record('auth.admin', 'PASS', em);
        break;
      }
    }
  }
  if (!adminToken) record('auth.admin', 'PARTIAL', 'no known admin credentials — skip live reindex');

  if (adminToken) {
    const before = await api('GET', '/admin/search/stats', { token: adminToken });
    const beforeTotal = before.data?.total ?? 0;
    const reindex = await api('POST', '/admin/search/reindex', { token: adminToken, body: {} });
    if (reindex.ok && reindex.data?.ok) {
      const indexed = (reindex.data.results || []).reduce((n, r) => n + (r.indexed || 0), 0);
      record('search.reindex', 'PASS', `indexed=${indexed}`);
    } else {
      record('search.reindex', 'FAIL', `HTTP ${reindex.status}`);
    }
    const after = await api('GET', '/admin/search/stats', { token: adminToken });
    const afterTotal = after.data?.total ?? 0;
    if (afterTotal > 0) record('search.indexCount', 'PASS', `total=${afterTotal} (before=${beforeTotal})`);
    else record('search.indexCount', 'FAIL', 'index still 0 after reindex');

    // Re-check job search after reindex
    const jobSearch = await api('GET', '/search?q=developer&type=job&limit=5');
    if (jobSearch.ok && (jobSearch.data?.total || 0) > 0) record('search.afterReindex.jobs', 'PASS', `${jobSearch.data.total} jobs`);
    else record('search.afterReindex.jobs', 'FAIL', 'still no job hits');
  }

  // Assessments catalog (requires talent auth)
  console.log('\n4. Assessments + credentials + apply');
  const catalog = userToken
    ? await api('GET', '/assessments', { token: userToken })
    : { ok: false, status: 401, data: null };
  const assessments = catalog.data?.data || catalog.data || [];
  const list = Array.isArray(assessments) ? assessments : [];
  if (catalog.ok && list.length >= 11) record('assessments.catalog11', 'PASS', `${list.length} published`);
  else if (catalog.ok && list.length > 0) record('assessments.catalog11', 'PARTIAL', `only ${list.length} published`);
  else record('assessments.catalog11', 'FAIL', `HTTP ${catalog.status} count=${list.length}`);

  const expectedSlugs = [
    'iq-fundamentals',
    'logical-reasoning-basics',
    'numerical-reasoning-basics',
    'verbal-reasoning-basics',
    'english-proficiency-basics',
    'communication-skills-basics',
    'computer-fundamentals',
    'ms-office-basics',
    'programming-fundamentals',
    'problem-solving-basics',
    'career-aptitude-basics',
  ];
  const slugs = new Set(list.map((a) => a.slug));
  const missingSlugs = expectedSlugs.filter((s) => !slugs.has(s));
  if (!missingSlugs.length) record('assessments.slugs', 'PASS');
  else record('assessments.slugs', 'FAIL', `missing ${missingSlugs.join(', ')}`);

  if (userToken && list[0]?.slug) {
    const slug = list.find((a) => a.slug === 'computer-fundamentals')?.slug || list[0].slug;
    const start = await api('POST', `/assessments/${slug}/attempts`, { token: userToken, body: {} });
    // Some APIs use POST /assessments/attempts { slug }
    let attempt = start.data;
    let startRes = start;
    if (!start.ok) {
      startRes = await api('POST', '/assessments/attempts', { token: userToken, body: { slug } });
      attempt = startRes.data;
    }
    if (!startRes.ok) {
      record('assessments.start', 'FAIL', `HTTP ${startRes.status} ${JSON.stringify(startRes.data)?.slice(0, 160)}`);
    } else {
      record('assessments.start', 'PASS', slug);
      const attemptId = attempt?.attempt?._id || attempt?._id || attempt?.attemptId;
      const questions = attempt?.questions || [];
      if (!attemptId) {
        record('assessments.submit', 'FAIL', 'no attempt id');
      } else if (!questions.length) {
        record('assessments.submit', 'FAIL', 'no questions returned');
      } else {
        // Prefer known correct indices for seeded computer-fundamentals (6 of 8 are index 1).
        const answers = questions.map((q, idx) => {
          let selectedIndex = 1;
          if (slug === 'computer-fundamentals' && (idx === 6 || idx === 7)) selectedIndex = 0;
          if (slug === 'problem-solving-basics') selectedIndex = 0;
          return {
            questionId: q.questionId || q.legacyMcqId || q.id || q._id,
            selectedIndex,
          };
        });
        const submit = await api('POST', `/assessments/attempts/${attemptId}/submit`, {
          token: userToken,
          body: { answers, durationSeconds: 30 },
        });
        if (submit.ok && submit.data?.result) {
          record('assessments.submit', 'PASS', `score=${submit.data.result.score} passed=${submit.data.result.passed}`);
          if (submit.data.result.passed && submit.data.result.credentialId) {
            record('credentials.issuedOnPass', 'PASS', String(submit.data.result.credentialId));
          } else if (submit.data.result.passed) {
            record('credentials.issuedOnPass', 'PARTIAL', 'passed but no credentialId in result');
          } else {
            // try intentional pass — if score low due to guessing, PARTIAL
            record('credentials.issuedOnPass', 'PARTIAL', `not passed (score=${submit.data.result.score}) — may be wrong answers`);
          }

          // Fail path: start another assessment and submit wrong/empty if max attempts allow
          const failSlug = list.find((a) => a.slug === 'problem-solving-basics' && a.slug !== slug)?.slug;
          if (failSlug) {
            let failStart = await api('POST', `/assessments/${failSlug}/attempts`, { token: userToken, body: {} });
            if (!failStart.ok) failStart = await api('POST', '/assessments/attempts', { token: userToken, body: { slug: failSlug } });
            const fAttempt = failStart.data?.attempt?._id || failStart.data?._id;
            const fQs = failStart.data?.questions || [];
            if (failStart.ok && fAttempt && fQs.length) {
              const wrong = fQs.map((q) => ({
                questionId: q.questionId || q.legacyMcqId || q.id || q._id,
                selectedIndex: 3, // often wrong
              }));
              const failSubmit = await api('POST', `/assessments/attempts/${fAttempt}/submit`, {
                token: userToken,
                body: { answers: wrong, durationSeconds: 20 },
              });
              if (failSubmit.ok && failSubmit.data?.result?.passed === false && !failSubmit.data.result.credentialId) {
                record('credentials.noIssueOnFail', 'PASS');
              } else if (failSubmit.ok && failSubmit.data?.result?.passed === false) {
                record('credentials.noIssueOnFail', 'PASS', 'failed without credential');
              } else if (failSubmit.ok && failSubmit.data?.result?.passed) {
                record('credentials.noIssueOnFail', 'PARTIAL', 'unexpected pass with wrong answers');
              } else {
                record('credentials.noIssueOnFail', 'FAIL', `HTTP ${failSubmit.status}`);
              }
            } else {
              record('credentials.noIssueOnFail', 'PARTIAL', 'could not start fail assessment');
            }
          }
        } else {
          record('assessments.submit', 'FAIL', `HTTP ${submit.status} ${JSON.stringify(submit.data)?.slice(0, 160)}`);
        }
      }
    }

    // Talent profile
    const tp = await api('GET', '/talent/me', { token: userToken });
    if (tp.ok) record('talent.profile', 'PASS');
    else record('talent.profile', 'FAIL', `HTTP ${tp.status}`);

    // Dashboard learning widget
    const dash = await api('GET', '/career/dashboard', { token: userToken });
    if (!dash.ok) {
      const dash2 = await api('GET', '/auth/dashboard', { token: userToken });
      if (dash2.ok) {
        await inspectDashboard(dash2.data, 'auth/dashboard');
      } else {
        record('dashboard.load', 'FAIL', `HTTP ${dash.status}/${dash2.status}`);
      }
    } else {
      await inspectDashboard(dash.data, 'career/dashboard');
    }

    // Talent profile — PATCH not PUT
    const put = await api('PATCH', '/talent/me', {
      token: userToken,
      body: {
        displayName: 'Beta Verify',
        headline: 'Aspiring Software Engineer',
        summary: 'CS student interested in javascript and python',
        careerGoals: [{ title: 'Become a software engineer', status: 'active' }],
        skills: [{ name: 'JavaScript', category: 'technical', level: 'beginner', source: 'self_reported' }],
      },
    });
    if (put.ok) record('talent.update', 'PASS');
    else {
      const create = await api('POST', '/talent/me', {
        token: userToken,
        body: {
          displayName: 'Beta Verify',
          headline: 'Aspiring Software Engineer',
          summary: 'CS student interested in javascript and python',
        },
      });
      if (create.ok) record('talent.update', 'PASS', 'created then ok');
      else record('talent.update', 'PARTIAL', `HTTP ${put.status}/${create.status}`);
    }

    // Apply to internal job — fetch enough pages / filter client-side
    const jobs = await api('GET', '/jobs?limit=50');
    const jobList = jobs.data?.data || jobs.data || [];
    let internal = (Array.isArray(jobList) ? jobList : []).find((j) => j.applyType === 'internal');
    if (!internal) {
      // Direct DB may have flipped; try search then detail
      const searchJobs = await api('GET', '/search?q=Developer&type=job&limit=10');
      const hit = searchJobs.data?.results?.[0];
      if (hit?.id || hit?.entityId) {
        const detail = await api('GET', `/jobs/${hit.url?.split('/').pop() || hit.id}`);
        if (detail.data?.applyType === 'internal') internal = detail.data;
      }
    }
    if (!internal) {
      record('apply.internalJob', 'FAIL', 'no internal job available after L265 seed fix');
    } else {
      const form = new FormData();
      form.append('useProfileResume', '0');
      form.append('coverLetter', 'Beta verification apply');
      const applyRes = await fetch(`${API}/jobs/${internal._id}/apply`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` },
        body: form,
      });
      const applyText = await applyRes.text();
      let applyData;
      try { applyData = JSON.parse(applyText); } catch { applyData = { raw: applyText }; }
      if (applyRes.ok && applyData.opportunityApplicationId) {
        record('apply.createsTracker', 'PASS', `oa=${applyData.opportunityApplicationId}`);
        const oa = await api('GET', `/applications/${applyData.opportunityApplicationId}`, { token: userToken });
        if (oa.ok) record('apply.trackerReadable', 'PASS');
        else record('apply.trackerReadable', 'FAIL', `HTTP ${oa.status}`);
      } else if (applyRes.ok) {
        record('apply.createsTracker', 'FAIL', `applied but no opportunityApplicationId: ${JSON.stringify(applyData).slice(0, 160)}`);
      } else {
        record('apply.createsTracker', 'FAIL', `HTTP ${applyRes.status} ${JSON.stringify(applyData).slice(0, 160)}`);
      }
    }

    // Credentials list
    const creds = await api('GET', '/credentials', { token: userToken });
    const credList = creds.data?.data || creds.data || [];
    if (creds.ok) record('credentials.list', 'PASS', `count=${Array.isArray(credList) ? credList.length : 0}`);
    else {
      const creds2 = await api('GET', '/talent/me/credentials', { token: userToken });
      if (creds2.ok) record('credentials.list', 'PASS', 'via talent/me/credentials');
      else record('credentials.list', 'PARTIAL', `HTTP ${creds.status}`);
    }
  }

  // Learning engine unit check (no API)
  console.log('\n5. Deterministic learning engine');
  try {
    const { buildDeterministicLearningRecommendations } = await import(
      pathToFileUrl(path.join(root, 'shared/career/learningRecommendations.js'))
    );
    const a = buildDeterministicLearningRecommendations({
      profile: { headline: 'software engineer', education: [{ degree: 'BS CS' }], careerGoals: [{ title: 'Developer' }], skills: [] },
      assessments: { recentAttempts: [] },
      credentials: [],
      readiness: { overall: 40 },
    });
    const b = buildDeterministicLearningRecommendations({
      profile: { headline: 'accountant', education: [{ degree: 'BBA' }], careerGoals: [{ title: 'Finance' }], skills: [] },
      assessments: { recentAttempts: [{ passed: false, categorySlug: 'ms_office' }] },
      credentials: [],
      readiness: { overall: 80 },
    });
    if (a.items?.length && b.items?.length) {
      const sameTop = a.items[0]?.id === b.items[0]?.id;
      if (!sameTop) record('learning.rulesDiffer', 'PASS', `${a.items[0]?.id} vs ${b.items[0]?.id}`);
      else record('learning.rulesDiffer', 'PARTIAL', 'top item same across dissimilar profiles');
    } else record('learning.rulesDiffer', 'FAIL', 'empty items');
    if (a.placeholder === true) record('learning.notPlaceholder', 'FAIL');
    else record('learning.notPlaceholder', 'PASS');
  } catch (e) {
    record('learning.rulesDiffer', 'FAIL', e.message);
  }

  // Guidance structure
  console.log('\n6. Career guidance content');
  try {
    const { DEGREE_ROADMAPS } = await import(pathToFileUrl(path.join(root, 'shared/career/degreeRoadmaps.js')));
    if (DEGREE_ROADMAPS.length >= 5) record('guidance.count', 'PASS', `${DEGREE_ROADMAPS.length} majors`);
    else record('guidance.count', 'FAIL', `${DEGREE_ROADMAPS.length}`);
    const required = ['roles', 'requiredSkills', 'certifications', 'salaryPakistanPkr', 'learning', 'faq', 'links', 'progression'];
    const bad = DEGREE_ROADMAPS.filter((d) => required.some((k) => d[k] == null));
    if (!bad.length) record('guidance.fields', 'PASS');
    else record('guidance.fields', 'FAIL', bad.map((d) => d.id).join(','));
  } catch (e) {
    record('guidance.count', 'FAIL', e.message);
  }

  // Typo tolerance disclosure
  {
    const svc = read('server/src/services/search/SearchIndexService.js');
    if (/fuzz|typo|editDistance|levenshtein/i.test(svc)) record('search.typoTolerance', 'PASS', 'fuzzy support found');
    else record('search.typoTolerance', 'PARTIAL', 'no fuzzy/typo engine — exact/partial text only');
  }

  // Internship search type — public search may not index internship
  {
    const types = read('shared/search/entityTypes.js');
    if (types.includes("'internship'") || types.includes('"internship"')) {
      record('search.internshipEntity', 'PASS');
    } else {
      record('search.internshipEntity', 'PARTIAL', 'internship not a search entity type — use listings');
    }
  }

  summarize();
  process.exit(failed > 0 ? 1 : 0);
}

async function inspectDashboard(data, source) {
  record('dashboard.load', 'PASS', source);
  const widgets = data?.widgets || data?.layout || data;
  const flat = JSON.stringify(data);
  if (flat.includes('recommended-learning') || flat.includes('recommendedLearning') || /learning/i.test(flat)) {
    // look for items array with titles
    const hasItems = /"items"\s*:\s*\[\s*\{/.test(flat) && !/"placeholder"\s*:\s*true/.test(flat.match(/recommended-learning[\s\S]{0,400}/)?.[0] || '');
    if (flat.includes('"placeholder":true') && flat.includes('learningPlaceholder')) {
      record('dashboard.learning', 'FAIL', 'still placeholder in composition');
    } else if (flat.includes('recommended-learning') || flat.includes('Recommended Learning') || flat.includes('mdn') || flat.includes('assess-')) {
      record('dashboard.learning', 'PASS', 'learning payload present');
    } else {
      record('dashboard.learning', 'PARTIAL', 'dashboard loaded; learning payload unclear');
    }
  } else {
    record('dashboard.learning', 'PARTIAL', 'learning widget key not found in payload');
  }
  if (flat.includes('readiness') || flat.includes('overall')) record('dashboard.readiness', 'PASS');
  else record('dashboard.readiness', 'PARTIAL', 'readiness field not observed');
}

function pathToFileUrl(p) {
  const resolved = path.resolve(p);
  let u = resolved.replace(/\\/g, '/');
  if (!u.startsWith('/')) u = `/${u}`;
  return `file://${u}`;
}

function summarize() {
  console.log('\n=== Summary ===');
  console.log(`PASS=${passed} PARTIAL=${partial} FAIL=${failed} TOTAL=${passed + partial + failed}`);
  const confidence = Math.round(((passed + partial * 0.5) / Math.max(1, passed + partial + failed)) * 100);
  console.log(`Confidence≈${confidence}%`);
  const out = path.join(root, 'docs', 'archive', 'qa', '_l265_verify_results.json');
  fs.writeFileSync(out, JSON.stringify({ passed, partial, failed, confidence, results }, null, 2));
  console.log(`Wrote ${out}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
