/**
 * L.2.8 — Deterministic job–candidate match (no AI).
 * Single reusable engine for dashboards, employer cards, and job detail.
 */

function norm(s) {
  return String(s || '').trim().toLowerCase();
}

function tokenize(text) {
  return norm(text)
    .split(/[^a-z0-9+#.]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
}

function collectCandidateSkills(ctx) {
  const fromProfile = (ctx.profile?.skills || []).map((s) => norm(typeof s === 'string' ? s : s.name));
  const fromVerified = (ctx.verifiedSkills || []).map((s) => norm(s.skillName || s.title || ''));
  const fromCreds = (ctx.credentials || [])
    .filter((c) => c.verificationStatus === 'active' || c.status === 'active')
    .map((c) => norm(c.skillName || c.title || ''));
  const snap = ctx.primaryResumeSnapshot || {};
  const snapSkills = (snap.skills || []).map((s) => norm(typeof s === 'string' ? s : s.name));
  return [...new Set([...fromProfile, ...fromVerified, ...fromCreds, ...snapSkills].filter(Boolean))];
}

function collectRequiredSkills(job) {
  const req = [
    ...(job?.skillsRequired || []),
    ...(job?.requirements || []),
    job?.category,
    job?.educationRequirement,
    job?.experience,
  ]
    .filter(Boolean)
    .flatMap((r) => tokenize(String(r)));
  return [...new Set(req)];
}

function matchSkill(required, candidateSkills) {
  const r = norm(required);
  if (!r) return false;
  return candidateSkills.some((c) => c.includes(r) || r.includes(c));
}

function parseExperienceYears(job) {
  const text = norm(job?.experience || '');
  const m = text.match(/(\d+)\s*\+?\s*(year|yr)/);
  if (m) return Number(m[1]);
  if (text.includes('fresh') || text.includes('entry')) return 0;
  if (text.includes('senior')) return 5;
  if (text.includes('mid')) return 3;
  return null;
}

function candidateExperienceYears(profile) {
  const exp = profile?.experience || [];
  if (!exp.length) return 0;
  let months = 0;
  for (const e of exp) {
    const start = e.startDate ? new Date(e.startDate).getTime() : null;
    const end = e.endDate ? new Date(e.endDate).getTime() : Date.now();
    if (start && end >= start) months += (end - start) / (30 * 24 * 60 * 60 * 1000);
  }
  return Math.round((months / 12) * 10) / 10;
}

function educationMatch(profile, job) {
  const eduReq = norm(job?.educationRequirement || '');
  if (!eduReq) return { score: 80, matched: true, label: 'No education requirement specified' };
  const degrees = (profile?.education || []).map((e) => norm(`${e.degree} ${e.fieldOfStudy}`)).join(' ');
  if (!degrees) return { score: 0, matched: false, label: job.educationRequirement };
  const hit = eduReq.split(/\s+/).some((w) => w.length > 3 && degrees.includes(w));
  return { score: hit ? 100 : 40, matched: hit, label: job.educationRequirement };
}

function languageMatch(profile, verifiedSkills) {
  const langs = (profile?.languages || []).map((l) => norm(l.language || l.name || l));
  const englishVerified = (verifiedSkills || []).some((s) => norm(s.skillName || s.category || '').includes('english'));
  if (englishVerified || langs.includes('english')) return 100;
  if (langs.length) return 60;
  return 30;
}

function portfolioScore(profile) {
  const refs = profile?.portfolioReferences || [];
  return refs.length > 0 ? 100 : 0;
}

/**
 * @param {object} ctx — profile, job, verifiedSkills, credentials, readinessSnapshot, primaryResumeSnapshot, assessmentScores
 * @returns {object} match result with explainability
 */
export function computeJobMatch(ctx) {
  const job = ctx.job;
  if (!job) {
    return {
      score: 0,
      overall: 0,
      strengths: [],
      missing: ['Job context required'],
      missingRequirements: [],
      improvements: [],
      factors: [],
      explanation: 'No job provided for match calculation.',
      deterministic: true,
      aiUsed: false,
    };
  }

  const candidateSkills = collectCandidateSkills(ctx);
  const required = collectRequiredSkills(job);
  const matchedReqs = [];
  const missingReqs = [];

  for (const req of required.slice(0, 25)) {
    if (matchSkill(req, candidateSkills)) matchedReqs.push(req);
    else missingReqs.push(req);
  }

  const skillDenom = Math.max(1, Math.min(required.length, 25));
  const skillScore = required.length
    ? Math.round((matchedReqs.length / skillDenom) * 100)
    : (candidateSkills.length >= 3 ? 70 : 40);

  const reqYears = parseExperienceYears(job);
  const candYears = candidateExperienceYears(ctx.profile || {});
  let expScore = 70;
  if (reqYears != null) {
    if (candYears >= reqYears) expScore = 100;
    else if (candYears >= reqYears - 1) expScore = 75;
    else expScore = Math.max(20, Math.round((candYears / Math.max(reqYears, 1)) * 100));
  }

  const edu = educationMatch(ctx.profile, job);
  const langScore = languageMatch(ctx.profile, ctx.verifiedSkills);
  const readiness = ctx.readinessOverall ?? ctx.readinessSnapshot?.overall ?? 0;
  const readinessScore = Number(readiness) || 0;

  const verified = (ctx.verifiedSkills || []).filter((s) => (s.score ?? 0) >= 60);
  const assessScore = verified.length
    ? Math.round(verified.reduce((s, v) => s + (Number(v.score) || 0), 0) / verified.length)
    : 0;

  const portfolio = portfolioScore(ctx.profile);
  const profileComplete = ctx.profileCompletionScore ?? 0;

  const factors = [
    { key: 'required_skills', weight: 0.35, score: skillScore, label: 'Required skills overlap' },
    { key: 'experience', weight: 0.2, score: expScore, label: 'Experience fit' },
    { key: 'education', weight: 0.15, score: edu.score, label: 'Education fit' },
    { key: 'readiness', weight: 0.1, score: readinessScore, label: 'Career readiness' },
    { key: 'verified_skills', weight: 0.1, score: assessScore, label: 'Verified assessment performance' },
    { key: 'language', weight: 0.05, score: langScore, label: 'Language proficiency' },
    { key: 'portfolio', weight: 0.05, score: portfolio, label: 'Portfolio / projects' },
  ];

  let weighted = 0;
  let wSum = 0;
  for (const f of factors) {
    weighted += f.score * f.weight;
    wSum += f.weight;
  }
  const overall = Math.round(weighted / (wSum || 1));

  const strengths = [];
  for (const s of matchedReqs.slice(0, 12)) {
    strengths.push(s.charAt(0).toUpperCase() + s.slice(1));
  }
  if (edu.matched && edu.label) strengths.push(String(edu.label));
  for (const v of verified.slice(0, 5)) {
    const name = v.skillName || v.title;
    if (name) strengths.push(`Verified ${name}`);
  }
  if (candYears > 0) strengths.push(`${candYears} yr experience`);
  if (portfolio === 100) strengths.push('Portfolio linked');

  const missing = [...new Set(missingReqs.slice(0, 10).map((m) => m.charAt(0).toUpperCase() + m.slice(1)))];
  const improvements = missing.length
    ? missing.map((m) => `Build or verify skill: ${m}`)
    : ['Keep profile and credentials updated'];

  return {
    score: overall,
    overall,
    strengths: [...new Set(strengths)].slice(0, 15),
    missing,
    missingRequirements: missing,
    improvements,
    factors: factors.map((f) => ({
      ...f,
      contribution: Math.round(f.score * f.weight),
      explanation: `${f.label}: ${f.score}/100`,
    })),
    explanation: `Job match ${overall}% based on ${matchedReqs.length}/${skillDenom} required skills, experience, education, and verified assessments.`,
    deterministic: true,
    aiUsed: false,
    jobId: job._id ? String(job._id) : null,
    version: '1.0.0',
  };
}
