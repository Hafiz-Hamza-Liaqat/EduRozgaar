import { asyncHandler } from '../../utils/asyncHandler.js';
import { TalentProfileReadService } from '../../services/career/TalentProfileReadService.js';
import { requireTalentProfileEnabled } from './talentProfileController.js';

function actorFromReq(req) {
  return { type: 'talent', id: String(req.user.userId) };
}

/** GET /talent/me/resume-builder — Resume Builder view over canonical profile */
export const getResumeBuilderView = asyncHandler(async (req, res) => {
  const view = await TalentProfileReadService.getResumeBuilderView(req.user.userId);
  if (!view) return res.status(404).json({ error: 'No resume data found' });
  res.json(view);
});

/** PUT /talent/me/resume-builder — persist Resume Builder edits to TalentProfile */
export const saveResumeBuilderView = asyncHandler(async (req, res) => {
  const view = await TalentProfileReadService.saveResumeBuilderView(req.user.userId, req.body, actorFromReq(req));
  res.json(view);
});

/** GET /talent/me/summary — dashboard career header / profile summary */
export const getMyProfileSummary = asyncHandler(async (req, res) => {
  const summary = await TalentProfileReadService.getDashboardSummary(req.user.userId);
  res.json(summary);
});

/** GET /talent/me/apply-kit — job/scholarship/admission apply helpers */
export const getMyApplyKit = asyncHandler(async (req, res) => {
  const kit = await TalentProfileReadService.getApplyKit(req.user.userId);
  res.json(kit);
});

/** GET /talent/me/prefill — form autofill from TalentProfile */
export const getMyFormPrefill = asyncHandler(async (req, res) => {
  const prefill = await TalentProfileReadService.getFormPrefill(req.user.userId, req.user.email || '');
  res.json(prefill);
});

/** GET /talent/me/candidate-card — consumer-facing career identity snippet */
export const getMyCandidateCard = asyncHandler(async (req, res) => {
  const card = await TalentProfileReadService.getCandidateCardForUser(req.user.userId);
  if (!card) return res.status(404).json({ error: 'Candidate profile not found' });
  res.json(card);
});

export { requireTalentProfileEnabled };
