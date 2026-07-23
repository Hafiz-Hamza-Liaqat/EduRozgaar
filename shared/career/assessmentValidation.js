import {
  ASSESSMENT_STATUSES,
  ASSESSMENT_ATTEMPT_STATUSES,
  ASSESSMENT_CATEGORY_FAMILIES,
  ASSESSMENT_PROCTORING_LEVELS,
  QUESTION_TYPES,
} from './assessmentConstants.js';

function trimStr(v, max = 500) {
  if (v == null) return '';
  return String(v).trim().slice(0, max);
}

function setOf(arr) {
  return new Set(arr);
}

function enumErr(value, allowed, field) {
  if (value == null || value === '') return [];
  if (!allowed.has(value)) return [`${field} must be one of: ${[...allowed].join(', ')}`];
  return [];
}

export function validateAssessmentInput(body = {}, { partial = false } = {}) {
  const errors = [];
  if (!partial && !trimStr(body.title)) errors.push('title is required');
  if (!partial && !trimStr(body.slug)) errors.push('slug is required');
  if (!partial && !trimStr(body.categorySlug)) errors.push('categorySlug is required');
  errors.push(...enumErr(body.status, setOf(ASSESSMENT_STATUSES), 'status'));
  errors.push(...enumErr(body.proctoringLevel, setOf(ASSESSMENT_PROCTORING_LEVELS), 'proctoringLevel'));
  if (body.family != null) errors.push(...enumErr(body.family, setOf(ASSESSMENT_CATEGORY_FAMILIES), 'family'));
  if (body.passingScore != null) {
    const n = Number(body.passingScore);
    if (!Number.isFinite(n) || n < 0 || n > 100) errors.push('passingScore must be 0-100');
  }
  if (body.durationMinutes != null) {
    const n = Number(body.durationMinutes);
    if (!Number.isFinite(n) || n < 1) errors.push('durationMinutes must be >= 1');
  }
  return errors;
}

export function parseAssessmentInput(body = {}) {
  return {
    title: body.title !== undefined ? trimStr(body.title, 200) : undefined,
    slug: body.slug !== undefined ? trimStr(body.slug, 120).toLowerCase().replace(/\s+/g, '-') : undefined,
    description: body.description !== undefined ? trimStr(body.description, 4000) : undefined,
    categorySlug: body.categorySlug !== undefined ? trimStr(body.categorySlug, 80) : undefined,
    family: body.family !== undefined ? trimStr(body.family, 40) : undefined,
    status: body.status !== undefined ? trimStr(body.status, 20) : undefined,
    durationMinutes: body.durationMinutes !== undefined ? Number(body.durationMinutes) : undefined,
    passingScore: body.passingScore !== undefined ? Number(body.passingScore) : undefined,
    maxAttempts: body.maxAttempts !== undefined ? Number(body.maxAttempts) : undefined,
    employerVisible: body.employerVisible !== undefined ? Boolean(body.employerVisible) : undefined,
    proctoringLevel: body.proctoringLevel !== undefined ? trimStr(body.proctoringLevel, 20) : undefined,
    locale: body.locale !== undefined ? trimStr(body.locale, 10) : undefined,
    market: body.market !== undefined ? trimStr(body.market, 40) : undefined,
    legacyQuizId: body.legacyQuizId,
    questionBankId: body.questionBankId,
    skillName: body.skillName !== undefined ? trimStr(body.skillName, 120) : undefined,
    sections: Array.isArray(body.sections) ? body.sections : undefined,
    rules: Array.isArray(body.rules) ? body.rules : undefined,
    credentialRule: body.credentialRule && typeof body.credentialRule === 'object' ? body.credentialRule : undefined,
    metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : undefined,
  };
}

export function validateQuestionInput(body = {}, { partial = false } = {}) {
  const errors = [];
  if (!partial && !trimStr(body.prompt)) errors.push('prompt is required');
  errors.push(...enumErr(body.questionType, setOf(QUESTION_TYPES), 'questionType'));
  if (!partial && (!Array.isArray(body.options) || body.options.length < 2)) {
    errors.push('options must have at least 2 entries');
  }
  if (!partial && body.correctIndex == null) errors.push('correctIndex is required');
  return errors;
}

export function parseQuestionInput(body = {}) {
  return {
    prompt: body.prompt !== undefined ? trimStr(body.prompt, 2000) : undefined,
    questionType: body.questionType !== undefined ? trimStr(body.questionType, 30) : undefined,
    options: Array.isArray(body.options)
      ? body.options.map((o) => trimStr(typeof o === 'string' ? o : o?.label || o?.text, 500)).filter(Boolean)
      : undefined,
    correctIndex: body.correctIndex !== undefined ? Number(body.correctIndex) : undefined,
    correctIndexes: Array.isArray(body.correctIndexes) ? body.correctIndexes.map(Number) : undefined,
    explanation: body.explanation !== undefined ? trimStr(body.explanation, 2000) : undefined,
    difficulty: body.difficulty !== undefined ? Number(body.difficulty) : undefined,
    tags: Array.isArray(body.tags) ? body.tags.map((t) => trimStr(t, 60)).filter(Boolean) : undefined,
    legacyMcqId: body.legacyMcqId,
    metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : undefined,
  };
}

export function validateAttemptSubmitInput(body = {}) {
  const errors = [];
  if (!Array.isArray(body.answers)) errors.push('answers array is required');
  return errors;
}

export function parseAttemptSubmitInput(body = {}) {
  return {
    answers: Array.isArray(body.answers)
      ? body.answers.map((a) => ({
        questionId: a.questionId != null ? String(a.questionId) : null,
        selectedIndex: a.selectedIndex != null ? Number(a.selectedIndex) : null,
        selectedIndexes: Array.isArray(a.selectedIndexes) ? a.selectedIndexes.map(Number) : undefined,
      }))
      : [],
    durationSeconds: body.durationSeconds != null ? Number(body.durationSeconds) : null,
  };
}

export { ASSESSMENT_ATTEMPT_STATUSES };
