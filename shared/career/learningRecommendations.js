/**
 * L.2.6 — Deterministic (non-AI) learning recommendations for dashboard widget.
 */

const RESOURCE_CATALOG = [
  {
    id: 'assess-iq',
    title: 'Take IQ Fundamentals assessment',
    type: 'assessment',
    category: 'iq',
    href: '/assessments/iq-fundamentals',
    reason: 'Build cognitive readiness baselines',
  },
  {
    id: 'assess-logical',
    title: 'Practice Logical Reasoning',
    type: 'assessment',
    category: 'logical_reasoning',
    href: '/assessments/logical-reasoning-basics',
    reason: 'Strengthen analytical thinking for hiring screens',
  },
  {
    id: 'assess-numerical',
    title: 'Practice Numerical Reasoning',
    type: 'assessment',
    category: 'numerical_reasoning',
    href: '/assessments/numerical-reasoning-basics',
    reason: 'Improve quantitative comfort for aptitude tests',
  },
  {
    id: 'assess-verbal',
    title: 'Practice Verbal Reasoning',
    type: 'assessment',
    category: 'verbal_reasoning',
    href: '/assessments/verbal-reasoning-basics',
    reason: 'Improve reading and language screens',
  },
  {
    id: 'assess-english',
    title: 'English Proficiency assessment',
    type: 'assessment',
    category: 'english',
    href: '/assessments/english-proficiency-basics',
    reason: 'Workplace English for local and remote roles',
  },
  {
    id: 'assess-comm',
    title: 'Communication Skills assessment',
    type: 'assessment',
    category: 'communication',
    href: '/assessments/communication-skills-basics',
    reason: 'Interview and teamwork readiness',
  },
  {
    id: 'assess-computer',
    title: 'Computer Fundamentals',
    type: 'assessment',
    category: 'computer_fundamentals',
    href: '/assessments/computer-fundamentals',
    reason: 'Baseline digital literacy employers expect',
  },
  {
    id: 'assess-office',
    title: 'MS Office assessment',
    type: 'assessment',
    category: 'ms_office',
    href: '/assessments/ms-office-basics',
    reason: 'Common requirement for office/admin roles',
  },
  {
    id: 'assess-programming',
    title: 'Programming Fundamentals',
    type: 'assessment',
    category: 'programming_fundamentals',
    href: '/assessments/programming-fundamentals',
    reason: 'Entry path for software and IT careers',
  },
  {
    id: 'assess-problem',
    title: 'Problem Solving assessment',
    type: 'assessment',
    category: 'problem_solving',
    href: '/assessments/problem-solving-basics',
    reason: 'Structured thinking for any career track',
  },
  {
    id: 'assess-aptitude',
    title: 'Career Aptitude assessment',
    type: 'assessment',
    category: 'aptitude',
    href: '/assessments/career-aptitude-basics',
    reason: 'Clarify degree-aligned career direction',
  },
  {
    id: 'resource-mdn',
    title: 'MDN Web Docs',
    type: 'documentation',
    category: 'programming_fundamentals',
    href: 'https://developer.mozilla.org/',
    external: true,
    reason: 'Free documentation for web fundamentals',
  },
  {
    id: 'resource-excel',
    title: 'Microsoft Excel help center',
    type: 'documentation',
    category: 'ms_office',
    href: 'https://support.microsoft.com/excel',
    external: true,
    reason: 'Official Excel learning resources',
  },
  {
    id: 'resource-freecodecamp',
    title: 'freeCodeCamp curriculum',
    type: 'learning',
    category: 'programming_fundamentals',
    href: 'https://www.freecodecamp.org/learn',
    external: true,
    reason: 'Free structured coding practice',
  },
  {
    id: 'resource-khan',
    title: 'Khan Academy — Math & logic',
    type: 'learning',
    category: 'numerical_reasoning',
    href: 'https://www.khanacademy.org/',
    external: true,
    reason: 'Free practice for numerical and logic skills',
  },
  {
    id: 'resource-guidance',
    title: 'Strideto Career Guidance center',
    type: 'roadmap',
    category: 'aptitude',
    href: '/career-guidance',
    reason: 'Degree roadmaps, roles, and salary guidance',
  },
  {
    id: 'resource-jobs',
    title: 'Browse open jobs',
    type: 'milestone',
    category: 'general',
    href: '/jobs',
    reason: 'Apply skills to real opportunities',
  },
  {
    id: 'resource-resume',
    title: 'Polish your resume',
    type: 'milestone',
    category: 'general',
    href: '/resume-builder',
    reason: 'Employers review resume quality early',
  },
];

function skillNames(profile) {
  return (profile?.skills || []).map((s) => String(s.name || '').toLowerCase()).filter(Boolean);
}

function goalText(profile) {
  const goals = (profile?.careerGoals || []).map((g) => `${g.title || ''} ${g.notes || ''}`).join(' ').toLowerCase();
  const prefs = `${profile?.preferences?.targetRole || ''} ${profile?.headline || ''} ${profile?.summary || ''}`.toLowerCase();
  return `${goals} ${prefs}`;
}

function educationHints(profile) {
  return (profile?.education || [])
    .map((e) => `${e.degree || ''} ${e.fieldOfStudy || ''} ${e.institution || ''}`.toLowerCase())
    .join(' ');
}

function failedCategories(assessmentsCtx) {
  const failed = new Set();
  for (const item of assessmentsCtx?.recentAttempts || []) {
    if (item.passed === false && item.categorySlug) failed.add(item.categorySlug);
  }
  return failed;
}

function verifiedCategories(credentials = []) {
  const set = new Set();
  for (const c of credentials) {
    if (c.status === 'active' || c.verificationStatus === 'verified') {
      const skill = String(c.skillName || c.title || '').toLowerCase();
      if (skill.includes('logical')) set.add('logical_reasoning');
      if (skill.includes('numerical')) set.add('numerical_reasoning');
      if (skill.includes('verbal')) set.add('verbal_reasoning');
      if (skill.includes('english')) set.add('english');
      if (skill.includes('communication')) set.add('communication');
      if (skill.includes('office') || skill.includes('excel')) set.add('ms_office');
      if (skill.includes('programming') || skill.includes('software')) set.add('programming_fundamentals');
      if (skill.includes('computer')) set.add('computer_fundamentals');
      if (skill.includes('problem')) set.add('problem_solving');
      if (skill.includes('aptitude') || skill.includes('cognitive') || skill.includes('iq')) set.add('iq');
    }
  }
  return set;
}

function readinessGaps(readiness) {
  const gaps = [];
  const providers = readiness?.providers || readiness?.breakdown || [];
  const list = Array.isArray(providers) ? providers : Object.values(providers || {});
  for (const p of list) {
    const score = p?.score ?? p?.value;
    const key = String(p?.key || p?.id || p?.name || '').toLowerCase();
    if (typeof score === 'number' && score < 60) {
      if (key.includes('skill')) gaps.push('programming_fundamentals', 'ms_office');
      if (key.includes('assess')) gaps.push('aptitude', 'communication');
      if (key.includes('profile') || key.includes('complet')) gaps.push('general');
      if (key.includes('credential') || key.includes('verif')) gaps.push('english', 'computer_fundamentals');
    }
  }
  if ((readiness?.overall ?? readiness?.score ?? 100) < 55) {
    gaps.push('aptitude', 'communication', 'computer_fundamentals');
  }
  return gaps;
}

/**
 * @param {object} ctx dashboard composition context
 * @returns {{ placeholder: boolean, items: array, messageKey?: string }}
 */
export function buildDeterministicLearningRecommendations(ctx = {}) {
  const profile = ctx.profile || {};
  const goals = goalText(profile);
  const edu = educationHints(profile);
  const skills = skillNames(profile);
  const failed = failedCategories(ctx.assessments || {});
  const verified = verifiedCategories(ctx.credentials || []);
  const gaps = readinessGaps(ctx.readiness || ctx.scoring || {});

  const scored = RESOURCE_CATALOG.map((item) => {
    let score = 1;
    if (failed.has(item.category)) score += 8;
    if (gaps.includes(item.category)) score += 5;
    if (verified.has(item.category)) score -= 4;
    if (item.category === 'general') score += 2;

    const hay = `${goals} ${edu} ${skills.join(' ')}`;
    if (item.category === 'programming_fundamentals' && /computer|software|cs|it|python|javascript|code/.test(hay)) score += 4;
    if (item.category === 'ms_office' && /business|admin|office|account|bba|commerce/.test(hay)) score += 4;
    if (item.category === 'numerical_reasoning' && /engineer|finance|account|math|stat/.test(hay)) score += 3;
    if (item.category === 'communication' && /market|hr|sales|media|teach/.test(hay)) score += 3;
    if (item.category === 'aptitude' && !goals.trim()) score += 3;
    if (item.type === 'assessment' && !(ctx.assessments?.recentAttempts?.length)) score += 2;

    return { ...item, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const items = scored.slice(0, 8).map(({ score, ...rest }) => rest);

  if (!items.length) {
    return {
      placeholder: false,
      items: RESOURCE_CATALOG.filter((r) => r.id === 'resource-guidance' || r.id === 'assess-aptitude' || r.id === 'resource-resume'),
      messageKey: null,
    };
  }

  return { placeholder: false, items, messageKey: null };
}
