/**
 * L.2.8 — Canonical resume quality rules (single source of truth).
 * Replaces duplicate client ResumeScore.computeScore logic.
 */

function snapField(snap, key) {
  return snap?.[key];
}

function personalFromSnap(snap, primary) {
  return snap?.personalInfo || snap?.personal || primary?.personal || {};
}

/**
 * @param {object} params
 * @param {object} [params.profile] TalentProfile
 * @param {object[]} [params.resumeVersions] ResumeVersion docs
 * @returns {{ score: number; strengths: string[]; missing: string[]; improvements: string[]; suggestions: string[]; checks: object[]; explanation: string }}
 */
export function evaluateResumeQuality({ profile = {}, resumeVersions = [] } = {}) {
  if (!resumeVersions.length) {
    return {
      score: 0,
      strengths: [],
      missing: ['No resume version created'],
      improvements: ['Create a resume version from your Talent Profile'],
      suggestions: ['Create a resume version from your Talent Profile'],
      checks: [],
      explanation: 'No resume version on Talent Profile yet.',
    };
  }

  const primary = resumeVersions.find((v) => v.isPrimary) || resumeVersions[0];
  const snap = primary.snapshot || {};
  const personal = personalFromSnap(snap, primary);
  const projects = snap.projects || [];
  const certs = snap.certifications || profile.certificationReferences || [];
  const skills = snap.skills || profile.skills || [];
  const skillCount = Array.isArray(skills)
    ? skills.length
    : (skills.technical?.length || 0) + (skills.soft?.length || 0);

  const checks = [
    {
      key: 'contact_name',
      label: 'Add your full name',
      ok: Boolean(personal.fullName?.trim() || profile.displayName),
      strength: 'Full name',
    },
    {
      key: 'contact_email',
      label: 'Add email address',
      ok: Boolean(personal.email?.trim()),
      strength: 'Email',
    },
    {
      key: 'contact_phone',
      label: 'Add phone number',
      ok: Boolean(personal.phone?.trim()),
      strength: 'Phone',
    },
    {
      key: 'contact_linkedin',
      label: 'Add LinkedIn profile',
      ok: Boolean(personal.linkedInUrl?.trim() || profile.socialProfile?.linkedIn),
      strength: 'LinkedIn',
    },
    {
      key: 'summary',
      label: 'Write a professional summary (40+ chars)',
      ok: Boolean(
        (snap.summary && String(snap.summary).length >= 40)
        || (snap.careerObjective && String(snap.careerObjective).length >= 20)
        || (profile.summary && String(profile.summary).length >= 40),
      ),
      strength: 'Professional summary',
    },
    {
      key: 'education',
      label: 'Include education',
      ok: (snap.education?.length || profile.education?.length || 0) > 0,
      strength: 'Education',
    },
    {
      key: 'experience',
      label: 'Include work experience',
      ok: (snap.experience?.length || profile.experience?.length || 0) > 0,
      strength: 'Experience',
    },
    {
      key: 'projects',
      label: 'Add at least one project',
      ok: projects.length > 0,
      strength: 'Projects',
    },
    {
      key: 'certifications',
      label: 'List certifications',
      ok: (Array.isArray(certs) ? certs.length : 0) > 0,
      strength: 'Certifications',
    },
    {
      key: 'skills',
      label: 'List at least 5 skills',
      ok: skillCount >= 5,
      strength: 'Skills section',
    },
    {
      key: 'published',
      label: 'Publish your primary resume',
      ok: primary.status === 'published',
      strength: 'Published resume',
    },
    {
      key: 'primary',
      label: 'Mark a resume as primary',
      ok: Boolean(primary.isPrimary),
      strength: 'Primary resume set',
    },
    {
      key: 'formatting',
      label: 'Use a resume headline/title',
      ok: Boolean(snap.headline || primary.title),
      strength: 'Resume headline',
    },
  ];

  const done = checks.filter((c) => c.ok).length;
  const score = Math.round((done / checks.length) * 100);
  const missing = checks.filter((c) => !c.ok).map((c) => c.label);
  const strengths = checks.filter((c) => c.ok).map((c) => c.strength);

  return {
    score,
    strengths,
    missing,
    improvements: missing,
    suggestions: missing.slice(0, 6),
    checks,
    explanation: `Resume quality based on "${primary.title || 'Resume'}" (${done}/${checks.length} criteria met).`,
    primaryVersionId: primary._id ? String(primary._id) : null,
  };
}
