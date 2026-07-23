import { asyncHandler } from '../../utils/asyncHandler.js';
import { isScoringEnabled } from '../../config/careerFeatureFlags.js';
import { ScoringService, buildScoreExplanation } from '../../services/career/ScoringService.js';

export function requireScoringEnabled(_req, res, next) {
  if (!isScoringEnabled()) {
    return res.status(503).json({ error: 'Scoring API is disabled' });
  }
  next();
}

function actorFromReq(req) {
  return { type: 'talent', id: String(req.user.userId) };
}

export const getLatestScore = asyncHandler(async (req, res) => {
  const scoreType = req.query.scoreType || 'career_readiness';
  const snapshot = await ScoringService.getLatest(req.user.userId, scoreType);
  res.json({
    snapshot,
    explanation: buildScoreExplanation(snapshot),
  });
});

export const getScoreHistory = asyncHandler(async (req, res) => {
  const scoreType = req.query.scoreType || 'career_readiness';
  const limit = req.query.limit;
  const history = await ScoringService.getHistory(req.user.userId, scoreType, { limit });
  res.json({ data: history, scoreType });
});

export const getScoreExplanation = asyncHandler(async (req, res) => {
  const scoreType = req.query.scoreType || 'career_readiness';
  const explanation = await ScoringService.getExplanation(req.user.userId, scoreType);
  res.json(explanation);
});

export const recomputeScore = asyncHandler(async (req, res) => {
  const scoreType = req.body?.scoreType || req.query.scoreType || 'career_readiness';
  const snapshot = await ScoringService.compute(
    req.user.userId,
    scoreType,
    { version: req.body?.version, jobId: req.body?.jobId },
    actorFromReq(req)
  );
  res.status(201).json({
    snapshot,
    explanation: buildScoreExplanation(snapshot, scoreType),
  });
});

export const getJobMatch = asyncHandler(async (req, res) => {
  const jobId = req.params.jobId;
  const match = await ScoringService.computeJobMatch(req.user.userId, jobId);
  res.json({
    ...match,
    explanation: match.explanation,
  });
});

export const getResumeQuality = asyncHandler(async (req, res) => {
  const payload = await ScoringService.getResumeQualityPayload(req.user.userId);
  res.json(payload);
});

export const getSkillGap = asyncHandler(async (req, res) => {
  const payload = await ScoringService.getSkillGapPayload(req.user.userId, {
    jobId: req.query.jobId,
    careerGoalTitle: req.query.careerGoalTitle,
  });
  res.json(payload);
});
