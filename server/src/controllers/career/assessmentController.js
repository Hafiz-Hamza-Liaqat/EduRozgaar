import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  isAssessmentsEnabled,
  isAssessmentResultsEnabled,
} from '../../config/careerFeatureFlags.js';
import { AssessmentService } from '../../services/career/AssessmentService.js';

export function requireAssessmentsEnabled(_req, res, next) {
  if (!isAssessmentsEnabled()) {
    return res.status(503).json({ error: 'Assessments are disabled' });
  }
  next();
}

function actorFromReq(req) {
  return { type: 'talent', id: String(req.user.userId) };
}

export const listAssessmentCategories = asyncHandler(async (_req, res) => {
  const data = await AssessmentService.listCategories();
  res.json({ data });
});

export const listAssessments = asyncHandler(async (req, res) => {
  const data = await AssessmentService.listCatalog(req.query);
  res.json({ data });
});

export const getAssessmentBySlug = asyncHandler(async (req, res) => {
  const assessment = await AssessmentService.getBySlug(req.params.slug);
  res.json(assessment);
});

export const startAssessmentAttempt = asyncHandler(async (req, res) => {
  const id = req.body?.assessmentId || req.body?.slug || req.params.id;
  const result = await AssessmentService.startAttempt(req.user.userId, id, actorFromReq(req));
  res.status(201).json(result);
});

export const submitAssessmentAttempt = asyncHandler(async (req, res) => {
  if (!isAssessmentResultsEnabled()) {
    return res.status(503).json({ error: 'Assessment results are disabled' });
  }
  const result = await AssessmentService.submitAttempt(
    req.user.userId,
    req.params.attemptId,
    req.body,
    actorFromReq(req)
  );
  res.json(result);
});

export const listMyAssessmentAttempts = asyncHandler(async (req, res) => {
  const data = await AssessmentService.listMyAttempts(req.user.userId, req.query);
  res.json({ data });
});

export const getAssessmentAttempt = asyncHandler(async (req, res) => {
  const attempt = await AssessmentService.getAttempt(req.user.userId, req.params.attemptId);
  res.json(attempt);
});

export const getEmployerVisibleSkills = asyncHandler(async (req, res) => {
  const data = await AssessmentService.getEmployerVisibleSkills(req.user.userId);
  res.json({ data });
});

/** Staff/catalog authoring — thin wrappers */
export const createAssessment = asyncHandler(async (req, res) => {
  const assessment = await AssessmentService.createAssessment(req.body, {
    type: 'staff',
    id: String(req.user.userId),
  });
  res.status(201).json(assessment);
});

export const publishAssessment = asyncHandler(async (req, res) => {
  const assessment = await AssessmentService.publishAssessment(req.params.id, {
    type: 'staff',
    id: String(req.user.userId),
  });
  res.json(assessment);
});

export const createQuestionBank = asyncHandler(async (req, res) => {
  const bank = await AssessmentService.createQuestionBank(req.body);
  res.status(201).json(bank);
});

export const addQuestion = asyncHandler(async (req, res) => {
  const question = await AssessmentService.addQuestion(req.params.bankId, req.body);
  res.status(201).json(question);
});
