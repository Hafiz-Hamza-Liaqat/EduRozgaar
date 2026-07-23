/**
 * L.2.8 — Career Intelligence & Employer Productivity verification.
 * Usage: npm run verify:l2-8
 */
import fs from 'fs';
import { docExists } from './lib/docExists.mjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);
const API = process.env.VERIFY_API_URL || 'http://127.0.0.1:5000/api';

let passed = 0;
let failed = 0;

function record(id, ok, detail = '') {
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${id}${detail ? ` — ${detail}` : ''}`);
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

async function api(method, urlPath, { token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API}${urlPath}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  return { status: res.status, data, ok: res.ok };
}

async function main() {
  console.log('\n=== L.2.8 Career Intelligence Verification ===\n');

  // --- Shared deterministic engines ---
  console.log('1. Shared scoring engines');
  try {
    const { computeJobMatch } = await import('../shared/scoring/jobMatchLogic.js');
    const { evaluateResumeQuality } = await import('../shared/scoring/resumeQualityRules.js');
    const { evaluateProfileCompleteness } = await import('../shared/scoring/profileCompletenessRules.js');
    const { buildHiringRecommendations } = await import('../shared/employer/hiringRecommendations.js');

    const match = computeJobMatch({
      profile: {
        skills: [{ name: 'JavaScript' }, { name: 'React' }, { name: 'Git' }],
        education: [{ degree: 'BS Computer Science' }],
        experience: [{ startDate: '2022-01', endDate: '2024-01', role: 'Dev' }],
      },
      job: {
        _id: 'job1',
        skillsRequired: ['JavaScript', 'React', 'Docker'],
        requirements: ['Git', 'Bachelor'],
        experience: '1 year',
      },
      verifiedSkills: [{ skillName: 'JavaScript', score: 90 }],
      readinessOverall: 75,
    });
    record('jobMatch.deterministic', match.deterministic === true && match.aiUsed === false);
    record('jobMatch.scoreRange', match.overall >= 0 && match.overall <= 100, `overall=${match.overall}`);
    record('jobMatch.strengths', Array.isArray(match.strengths) && match.strengths.length > 0);
    record('jobMatch.missing', Array.isArray(match.missing) && match.missing.some((m) => /docker/i.test(m)));

    const resumeQ = evaluateResumeQuality({
      profile: { displayName: 'Test' },
      resumeVersions: [{
        isPrimary: true,
        title: 'CV',
        status: 'published',
        snapshot: {
          summary: 'A'.repeat(45),
          experience: [{}],
          education: [{}],
          skills: [{ name: 'a' }, { name: 'b' }, { name: 'c' }, { name: 'd' }, { name: 'e' }],
          personalInfo: { fullName: 'T', email: 't@t.com', phone: '1' },
        },
      }],
    });
    record('resumeQuality.unified', resumeQ.score >= 50, `score=${resumeQ.score}`);

    const prof = evaluateProfileCompleteness({ displayName: 'X', headline: 'Y', skills: [{}, {}, {}], education: [{}] });
    record('profileCompletion.canonical', prof.score >= 0 && prof.score <= 100, `score=${prof.score}`);

    const recs = buildHiringRecommendations({
      jobMatch: { overall: 75 },
      readiness: { overall: 80 },
      profileCompleteness: 90,
      verifiedSkills: [{ skillName: 'JavaScript', score: 85 }],
      experienceYears: 2,
    });
    record('hiringReco.noHireReject', !recs.some((r) => /^(hire|reject)$/i.test(r.action)));
    record('hiringReco.advisory', recs.every((r) => r.advisory === true && r.deterministic === true));
  } catch (e) {
    record('shared.engines', false, e.message);
  }

  // --- Static wiring ---
  console.log('\n2. Static implementation gates');
  const staticChecks = [
    ['provider.jobMatch', 'server/src/services/career/scoring/providers.js', ['jobRequirementMatchProvider', 'evaluateProfileCompleteness']],
    ['weights.jobMatch', 'shared/scoring/weights/v1.json', ['job_match', 'job_requirement_match']],
    ['scoring.routes', 'server/src/routes/scoring.js', ['job-match', 'resume-quality', 'skill-gap']],
    ['employer.compare', 'server/src/routes/employerIntelligence.js', ['candidates/compare']],
    ['employer.filters', 'server/src/services/career/EmployerIntelligenceService.js', ['minJobMatch', 'sortCandidates', 'compareCandidates']],
    ['vacancy.service', 'server/src/services/career/JobVacancyService.js', ['getVacancyStats', 'assertJobAcceptingApplications']],
    ['job.seats', 'server/src/models/Job.js', ['totalSeats', 'autoCloseWhenFilled']],
    ['client.filters', 'client/src/pages/Employer/EmployerCandidates.jsx', ['minJobMatch', 'sortBestMatch']],
    ['client.compare', 'client/src/pages/Employer/EmployerCandidateCompare.jsx', ['Compare candidates']],
    ['explain.panel', 'client/src/components/career/ScoreExplainPanel.jsx', ['deterministicScoreNote']],
    ['skill.gap.widget', 'client/src/dashboard/widgets/SkillGapWidget.jsx', ['missingSkills']],
    ['resume.unified.client', 'client/src/pages/ResumeBuilder/ResumeScore.jsx', ['evaluateResumeQuality']],
    ['no.openai', 'server/src/services/career/scoring/providers.js', [], ['openai', 'anthropic', 'gemini']],
  ];

  for (const [id, file, must, mustNot = []] of staticChecks) {
    if (!exists(file)) {
      record(id, false, `missing ${file}`);
      continue;
    }
    const src = read(file);
    const miss = must.filter((s) => !src.includes(s));
    const bad = mustNot.filter((s) => src.toLowerCase().includes(s));
    record(id, miss.length === 0 && bad.length === 0, miss.length ? `missing ${miss.join(',')}` : bad.length ? `forbidden ${bad.join(',')}` : '');
  }

  // --- Live API (optional) ---
  console.log('\n3. Live API (optional — not required for static pass)');
  try {
    const h = await api('GET', '/health');
    record('health', h.ok, h.ok ? 'ok' : 'down');
  } catch {
    console.log('  SKIP  health — API unreachable');
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
